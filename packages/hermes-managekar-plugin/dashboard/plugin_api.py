"""Dashboard routes mounted at /api/plugins/managekar/."""

from __future__ import annotations

import os
from pathlib import Path
import sys

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from pairing import PairStore, compact_payload, default_store_path

router = APIRouter()


def _store() -> PairStore:
    return PairStore(default_store_path())


def _public_base() -> str:
    return os.environ.get("MANAGEKAR_PUBLIC_BASE", "http://127.0.0.1:9119").strip()


@router.post("/pair")
async def mint_pair(body: dict | None = None) -> dict:
    payload = body or {}
    label = str(payload.get("host_label") or payload.get("label") or "Hermes")
    token = os.environ.get("MANAGEKAR_DASHBOARD_TOKEN") or None
    ticket = _store().mint(_public_base(), label, token=token)
    return {
        "ticket": ticket,
        "pair_id": ticket["pairId"],
        "claim_url": ticket["claimUrl"],
        "qr_url": ticket.get("qrUrl"),
        "expires_at": ticket["expiresAt"],
        "payload": compact_payload(ticket),
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


@router.get("/qr", response_class=HTMLResponse)
async def qr_help() -> str:
    return (
        "<!doctype html><html><body style='font-family:sans-serif;padding:2rem'>"
        "<p>POST /api/plugins/managekar/pair to mint a ticket, then open /pair/&lt;id&gt;.</p>"
        "</body></html>"
    )
