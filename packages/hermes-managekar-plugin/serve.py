"""Unauthenticated pair/claim listener.

Official Hermes gates `/api/plugins/*` with a dashboard session token.
Phones cannot send that header, so `hermes managekar --serve` binds a small
stdlib HTTP server (default :9120) for mint/claim/QR only. After claim, the
phone attaches to the real dashboard (`--host`, usually :9119).
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

try:
    from .pairing import PairStore, compact_payload, default_store_path
    from .qr import encode_matrix, matrix_to_svg
except ImportError:
    from pairing import PairStore, compact_payload, default_store_path
    from qr import encode_matrix, matrix_to_svg


def ticket_qr_svg(payload: str) -> str:
    try:
        return matrix_to_svg(encode_matrix(payload))
    except Exception:
        return ""


def _json(handler: BaseHTTPRequestHandler, status: int, body: dict) -> None:
    payload = json.dumps(body).encode("utf-8")
    handler.send_response(status)
    handler.send_header("content-type", "application/json")
    handler.send_header("access-control-allow-origin", "*")
    handler.send_header("access-control-allow-headers", "content-type")
    handler.send_header("content-length", str(len(payload)))
    handler.end_headers()
    handler.wfile.write(payload)


def _html(handler: BaseHTTPRequestHandler, status: int, body: str) -> None:
    payload = body.encode("utf-8")
    handler.send_response(status)
    handler.send_header("content-type", "text/html; charset=utf-8")
    handler.send_header("access-control-allow-origin", "*")
    handler.send_header("content-length", str(len(payload)))
    handler.end_headers()
    handler.wfile.write(payload)


def make_handler(store: PairStore, pair_base: str, dashboard: str, label: str, token: str | None):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, format: str, *args: object) -> None:
            return

        def do_OPTIONS(self) -> None:
            self.send_response(204)
            self.send_header("access-control-allow-origin", "*")
            self.send_header("access-control-allow-headers", "content-type")
            self.send_header("access-control-allow-methods", "GET,POST,OPTIONS")
            self.end_headers()

        def _read_json(self) -> dict:
            length = int(self.headers.get("content-length") or 0)
            if length <= 0:
                return {}
            raw = self.rfile.read(length)
            if not raw:
                return {}
            parsed = json.loads(raw.decode("utf-8"))
            return parsed if isinstance(parsed, dict) else {}

        def do_GET(self) -> None:
            path = urlparse(self.path).path
            if path == "/health":
                _json(self, 200, {"ok": True, "pair_base": pair_base, "dashboard": dashboard})
                return
            if path.startswith("/pair/"):
                pair_id = path.split("/pair/", 1)[1].strip("/")
                record = store.records.get(pair_id)
                if not record:
                    _json(self, 404, {"error": "unknown pair"})
                    return
                ticket = record["ticket"]
                payload = compact_payload(ticket)
                svg = ticket_qr_svg(payload)
                _html(
                    self,
                    200,
                    (
                        "<!doctype html><html><body style='font-family:Inter,system-ui,sans-serif;"
                        "padding:2rem;background:#e8f2fd;color:#170d02'>"
                        "<p style='letter-spacing:.22em;color:#0053fd;margin:0'>HERMES</p>"
                        "<h1 style='font-size:1.25rem'>Scan this ticket</h1>"
                        f"<div aria-label='pair QR'>{svg}</div>"
                        f"<p><code>{payload}</code></p>"
                        "<p>Claim once, then the phone attaches to the Hermes dashboard socket.</p>"
                        "</body></html>"
                    ),
                )
                return
            _json(self, 404, {"error": "not found"})

        def do_POST(self) -> None:
            path = urlparse(self.path).path
            if path in {"/pair", "/api/plugins/managekar/pair"}:
                body = self._read_json()
                ticket = store.mint(
                    pair_base,
                    str(body.get("host_label") or body.get("label") or label),
                    token=token,
                    endpoint=dashboard,
                )
                _json(
                    self,
                    200,
                    {
                        "ticket": ticket,
                        "pair_id": ticket["pairId"],
                        "claim_url": ticket["claimUrl"],
                        "qr_url": ticket.get("qrUrl"),
                        "expires_at": ticket["expiresAt"],
                        "payload": compact_payload(ticket),
                    },
                )
                return
            if path in {"/claim", "/api/plugins/managekar/claim"}:
                body = self._read_json()
                pair_id = str(body.get("pair_id") or body.get("pairId") or "").strip()
                try:
                    claimed = store.claim(
                        pair_id,
                        str(body.get("device_id") or "phone"),
                        str(body.get("device_name") or "Manage.kar"),
                    )
                except KeyError:
                    _json(self, 404, {"error": "unknown pair"})
                    return
                except PermissionError:
                    _json(self, 409, {"error": "already claimed"})
                    return
                except TimeoutError:
                    _json(self, 410, {"error": "expired"})
                    return
                _json(self, 200, claimed)
                return
            _json(self, 404, {"error": "not found"})

    return Handler


def serve_forever(
    *,
    host: str = "127.0.0.1",
    port: int = 9120,
    dashboard: str = "http://127.0.0.1:9119",
    pair_base: str | None = None,
    label: str = "Hermes",
    token: str | None = None,
    store: PairStore | None = None,
    store_path: Path | None = None,
) -> ThreadingHTTPServer:
    resolved = store or PairStore(store_path or default_store_path())
    base = pair_base or f"http://{host}:{port}"
    handler = make_handler(resolved, base, dashboard, label, token)
    return ThreadingHTTPServer((host, port), handler)


def main() -> int:
    host = os.environ.get("MANAGEKAR_PAIR_BIND", "127.0.0.1")
    port = int(os.environ.get("MANAGEKAR_PAIR_PORT", "9120"))
    dashboard = os.environ.get("MANAGEKAR_PUBLIC_BASE", "http://127.0.0.1:9119")
    token = os.environ.get("MANAGEKAR_DASHBOARD_TOKEN") or None
    pair_base = os.environ.get("MANAGEKAR_PAIR_BASE") or f"http://{host}:{port}"
    server = serve_forever(
        host=host,
        port=port,
        dashboard=dashboard,
        pair_base=pair_base,
        token=token,
    )
    print(f"managekar pair listener on {pair_base} → dashboard {dashboard}", flush=True)
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
