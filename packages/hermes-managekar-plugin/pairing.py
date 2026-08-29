"""Single-use managekar.pair.v1 tickets. Stdlib only — no Hermes import."""

from __future__ import annotations

import json
import os
import secrets
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

KIND = "managekar.pair.v1"
TTL_SECONDS = 10 * 60
PLUGIN = "managekar"


def _is_http(url: str) -> bool:
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def default_store_path() -> Path:
    home = Path(os.environ.get("HERMES_HOME") or (Path.home() / ".hermes"))
    return home / "platforms" / PLUGIN / "pairs.json"


def normalize_base(base: str) -> str:
    trimmed = base.strip().rstrip("/")
    if not trimmed:
        return "http://127.0.0.1:9119"
    if "://" not in trimmed:
        trimmed = f"http://{trimmed}"
    if not _is_http(trimmed):
        raise ValueError("base must be http(s)")
    return trimmed


def plugin_claim_url(base: str) -> str:
    return f"{normalize_base(base)}/api/plugins/{PLUGIN}/claim"


def plugin_qr_url(base: str, pair_id: str) -> str:
    return f"{normalize_base(base)}/pair/{pair_id}"


def build_ticket(
    *,
    pair_id: str,
    claim_url: str,
    expires_at: str,
    qr_url: str | None = None,
    host_label: str | None = None,
) -> dict[str, Any]:
    ticket: dict[str, Any] = {
        "v": 1,
        "kind": KIND,
        "pairId": pair_id,
        "claimUrl": claim_url,
        "expiresAt": expires_at,
    }
    if qr_url:
        ticket["qrUrl"] = qr_url
    if host_label:
        ticket["hostLabel"] = host_label[:80]
    return ticket


def compact_payload(ticket: dict[str, Any]) -> str:
    return f"{KIND}|{ticket['pairId']}|{ticket['claimUrl']}"


class PairStore:
    def __init__(self, path: Path | None = None, records: dict[str, Any] | None = None) -> None:
        self.path = path
        self.records: dict[str, Any] = records if records is not None else {}
        if path and path.exists() and records is None:
            try:
                loaded = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                loaded = {}
            if isinstance(loaded, dict):
                self.records = loaded

    def save(self) -> None:
        if self.path is None:
            return
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(self.records, indent=2), encoding="utf-8")

    def mint(
        self,
        base: str,
        host_label: str = "Hermes",
        now: float | None = None,
        token: str | None = None,
        endpoint: str | None = None,
        pair_base: str | None = None,
    ) -> dict[str, Any]:
        now = time.time() if now is None else now
        pair_id = secrets.token_hex(16)
        expires_at = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime(now + TTL_SECONDS))
        session_token = token or f"mk_{secrets.token_hex(16)}"
        claim_base = pair_base or base
        ticket = build_ticket(
            pair_id=pair_id,
            claim_url=plugin_claim_url(claim_base),
            expires_at=expires_at,
            qr_url=plugin_qr_url(claim_base, pair_id),
            host_label=host_label,
        )
        self.records[pair_id] = {
            "ticket": ticket,
            "token": session_token,
            "expires_at": now + TTL_SECONDS,
            "claimed": False,
            "endpoint": normalize_base(endpoint or base),
        }
        self.save()
        return ticket

    def claim(
        self,
        pair_id: str,
        device_id: str,
        device_name: str,
        now: float | None = None,
    ) -> dict[str, Any]:
        now = time.time() if now is None else now
        record = self.records.get(pair_id)
        if record is None:
            raise KeyError("unknown pair")
        if record.get("claimed"):
            raise PermissionError("already claimed")
        if now >= float(record["expires_at"]):
            raise TimeoutError("expired")
        record["claimed"] = True
        record["device_id"] = device_id
        record["device_name"] = device_name
        self.save()
        result = {
            "endpoint": record["endpoint"],
            "token": record["token"],
        }
        install_id = record.get("install_id")
        version = record.get("version")
        if install_id:
            result["install_id"] = install_id
        if version:
            result["version"] = version
        return result


def mint_pair(base: str, host_label: str = "Hermes") -> dict[str, Any]:
    return PairStore(default_store_path()).mint(base, host_label)
