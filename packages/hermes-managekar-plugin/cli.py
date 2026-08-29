"""`hermes managekar` and a standalone `python cli.py` host QR printer."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    from .pairing import PairStore, compact_payload, default_store_path, plugin_qr_url
except ImportError:
    from pairing import PairStore, compact_payload, default_store_path, plugin_qr_url


def print_pair(host: str, label: str) -> dict:
    store = PairStore(default_store_path())
    ticket = store.mint(host, label)
    payload = compact_payload(ticket)
    qr_url = ticket.get("qrUrl") or plugin_qr_url(host, ticket["pairId"])
    sys.stdout.write("\nManage.kar host pairing\n")
    sys.stdout.write("Scan the QR, or open the link on your phone.\n\n")
    sys.stdout.write(f"QR page:  {qr_url}\n")
    sys.stdout.write(f"Claim:    {ticket['claimUrl']}\n")
    sys.stdout.write(f"Ticket:   {payload}\n\n")
    sys.stdout.write(json.dumps(ticket, indent=2))
    sys.stdout.write("\n")
    try:
        try:
            from .qr import encode_matrix, matrix_to_ascii
        except ImportError:
            from qr import encode_matrix, matrix_to_ascii

        sys.stdout.write("\n")
        sys.stdout.write(matrix_to_ascii(encode_matrix(payload)))
        sys.stdout.write("\n")
    except Exception:
        sys.stdout.write("\n(ASCII QR skipped — open the QR page in a browser.)\n")
    return ticket


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Mint a Manage.kar host pairing ticket")
    parser.add_argument("--host", default="http://127.0.0.1:9119")
    parser.add_argument("--label", default="Hermes")
    parser.add_argument("--store", type=Path, default=None)
    args = parser.parse_args(argv)
    if args.store:
        ticket = PairStore(args.store).mint(args.host, args.label)
        sys.stdout.write(json.dumps(ticket))
        sys.stdout.write("\n")
        return 0
    print_pair(args.host, args.label)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
