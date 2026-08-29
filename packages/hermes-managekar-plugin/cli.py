"""`hermes managekar` and a standalone `python cli.py` host QR printer."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    from .pairing import PairStore, compact_payload, default_store_path, plugin_qr_url
    from .qr import encode_matrix, matrix_to_ascii
    from .serve import serve_forever
except ImportError:
    from pairing import PairStore, compact_payload, default_store_path, plugin_qr_url
    from qr import encode_matrix, matrix_to_ascii
    from serve import serve_forever


def print_pair(
    dashboard: str,
    label: str,
    *,
    store: PairStore | None = None,
    pair_base: str | None = None,
) -> dict:
    store = store or PairStore(default_store_path())
    ticket = store.mint(dashboard, label, endpoint=dashboard, pair_base=pair_base)
    payload = compact_payload(ticket)
    qr_url = ticket.get("qrUrl") or plugin_qr_url(pair_base or dashboard, ticket["pairId"])
    sys.stdout.write("\nManage.kar host pairing\n")
    sys.stdout.write("Scan the QR, or open the link on your phone.\n\n")
    sys.stdout.write(f"QR page:  {qr_url}\n")
    sys.stdout.write(f"Claim:    {ticket['claimUrl']}\n")
    sys.stdout.write(f"Attach:   {dashboard}\n")
    sys.stdout.write(f"Ticket:   {payload}\n\n")
    sys.stdout.write(json.dumps(ticket, indent=2))
    sys.stdout.write("\n")
    try:
        sys.stdout.write("\n")
        sys.stdout.write(matrix_to_ascii(encode_matrix(payload)))
        sys.stdout.write("\n")
    except Exception:
        sys.stdout.write("\n(ASCII QR skipped — open the QR page in a browser.)\n")
    return ticket


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Mint a Manage.kar host pairing ticket")
    parser.add_argument("--host", default="http://127.0.0.1:9119", help="Dashboard attach URL returned on claim")
    parser.add_argument("--label", default="Hermes")
    parser.add_argument("--store", type=Path, default=None)
    parser.add_argument("--serve", action="store_true", help="Listen for phone claim (bypasses dashboard plugin auth)")
    parser.add_argument("--port", type=int, default=9120)
    parser.add_argument("--bind", default="127.0.0.1")
    parser.add_argument("--pair-base", default=None)
    parser.add_argument("--token", default=None, help="Dashboard session token returned on claim")
    args = parser.parse_args(argv)
    store = PairStore(args.store) if args.store else PairStore(default_store_path())
    if args.serve:
        pair_base = args.pair_base or f"http://{args.bind}:{args.port}"
        server = serve_forever(
            host=args.bind,
            port=args.port,
            dashboard=args.host,
            pair_base=pair_base,
            label=args.label,
            token=args.token,
            store=store,
        )
        sys.stdout.write(f"managekar pair listener on {pair_base} → dashboard {args.host}\n")
        print_pair(args.host, args.label, store=store, pair_base=pair_base)
        server.serve_forever()
        return 0
    print_pair(args.host, args.label, store=store)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
