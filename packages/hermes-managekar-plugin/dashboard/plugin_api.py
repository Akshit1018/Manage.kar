"""Dashboard routes mounted at /api/plugins/managekar/."""

from __future__ import annotations

import os
from pathlib import Path
import sys

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from pairing import PairStore, compact_payload, default_store_path
from qr import encode_matrix, matrix_to_svg

router = APIRouter()


def _store() -> PairStore:
    return PairStore(default_store_path())


def _public_base() -> str:
    return os.environ.get("MANAGEKAR_PUBLIC_BASE", "http://127.0.0.1:9119").strip()


def _pair_base() -> str:
    return os.environ.get("MANAGEKAR_PAIR_BASE", "").strip() or _public_base()


def _claim_token(request: Request) -> str | None:
    env = os.environ.get("MANAGEKAR_DASHBOARD_TOKEN", "").strip()
    if env:
        return env
    header = request.headers.get("X-Hermes-Session-Token", "").strip()
    return header or None


def _qr_svg(payload: str) -> str:
    try:
        return matrix_to_svg(encode_matrix(payload))
    except Exception:
        return ""


@router.post("/pair")
async def mint_pair(request: Request) -> dict:
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    if not isinstance(payload, dict):
        payload = {}
    label = str(payload.get("host_label") or payload.get("label") or "Hermes")
    dashboard = _public_base()
    ticket = _store().mint(
        dashboard,
        label,
        token=_claim_token(request),
        endpoint=dashboard,
        pair_base=_pair_base(),
    )
    compact = compact_payload(ticket)
    return {
        "ticket": ticket,
        "pair_id": ticket["pairId"],
        "claim_url": ticket["claimUrl"],
        "qr_url": ticket.get("qrUrl"),
        "expires_at": ticket["expiresAt"],
        "payload": compact,
        "qr_svg": _qr_svg(compact),
    }


@router.post("/claim")
async def claim_pair(body: dict) -> dict:
    pair_id = str(body.get("pair_id") or body.get("pairId") or "").strip()
    device_id = str(body.get("device_id") or body.get("deviceId") or "phone").strip()
    device_name = str(body.get("device_name") or body.get("deviceName") or "Manage.kar").strip()
    if not pair_id:
        raise HTTPException(status_code=400, detail="pair_id required")
    try:
        claimed = _store().claim(pair_id, device_id, device_name)
    except KeyError:
        raise HTTPException(status_code=404, detail="unknown pair") from None
    except PermissionError:
        raise HTTPException(status_code=409, detail="already claimed") from None
    except TimeoutError:
        raise HTTPException(status_code=410, detail="expired") from None
    return claimed


@router.get("/ticket/{pair_id}")
async def read_ticket(pair_id: str) -> dict:
    record = _store().records.get(pair_id)
    if not record:
        raise HTTPException(status_code=404, detail="unknown pair")
    ticket = record["ticket"]
    return {"ticket": ticket, "claimed": record.get("claimed", False), "payload": compact_payload(ticket)}


@router.get("/page/{pair_id}", response_class=HTMLResponse)
async def pair_page(pair_id: str) -> str:
    record = _store().records.get(pair_id)
    if not record:
        raise HTTPException(status_code=404, detail="unknown pair")
    payload = compact_payload(record["ticket"])
    svg = _qr_svg(payload)
    return (
        "<!doctype html><html><body style='font-family:Inter,system-ui,sans-serif;"
        "padding:2rem;background:#e8f2fd;color:#170d02'>"
        "<p style='letter-spacing:.22em;color:#0053fd;margin:0'>HERMES</p>"
        "<h1 style='font-size:1.25rem'>Scan this ticket</h1>"
        f"<div aria-label='pair QR'>{svg}</div>"
        f"<p><code>{payload}</code></p>"
        "</body></html>"
    )


@router.get("/qr", response_class=HTMLResponse)
async def qr_help() -> str:
    return (
        "<!doctype html><html><body style='font-family:sans-serif;padding:2rem'>"
        "<p>POST /api/plugins/managekar/pair to mint a ticket. Phones claim on "
        "<code>hermes managekar --serve</code> (:9120), then attach to :9119.</p>"
        "</body></html>"
    )
