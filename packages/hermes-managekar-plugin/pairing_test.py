import unittest

from pairing import KIND, PairStore, compact_payload, plugin_claim_url
from qr import encode_matrix, matrix_to_svg


class PairStoreTests(unittest.TestCase):
    def test_mint_and_single_claim(self) -> None:
        store = PairStore(records={})
        ticket = store.mint("http://127.0.0.1:9119", "stub", now=1_000.0, token="mk_test")
        self.assertEqual(ticket["kind"], KIND)
        self.assertEqual(ticket["claimUrl"], plugin_claim_url("http://127.0.0.1:9119"))
        claimed = store.claim(ticket["pairId"], "phone-1", "Pixel", now=1_010.0)
        self.assertEqual(claimed["token"], "mk_test")
        self.assertEqual(claimed["endpoint"], "http://127.0.0.1:9119")
        with self.assertRaises(PermissionError):
            store.claim(ticket["pairId"], "phone-2", "Other", now=1_020.0)

    def test_expired_ticket(self) -> None:
        store = PairStore(records={})
        ticket = store.mint("http://10.0.0.4:9119", "vps", now=1_000.0)
        with self.assertRaises(TimeoutError):
            store.claim(ticket["pairId"], "phone-1", "Pixel", now=1_000.0 + 11 * 60)

    def test_compact_payload(self) -> None:
        store = PairStore(records={})
        ticket = store.mint("http://127.0.0.1:9119", now=1_000.0)
        payload = compact_payload(ticket)
        self.assertTrue(payload.startswith(f"{KIND}|"))
        self.assertIn(ticket["pairId"], payload)

    def test_pair_base_claim_urls_keep_dashboard_endpoint(self) -> None:
        store = PairStore(records={})
        ticket = store.mint(
            "http://127.0.0.1:9119",
            "home",
            now=1_000.0,
            token="dash_tok",
            endpoint="http://127.0.0.1:9119",
            pair_base="http://127.0.0.1:9120",
        )
        self.assertEqual(ticket["claimUrl"], plugin_claim_url("http://127.0.0.1:9120"))
        self.assertTrue(ticket["qrUrl"].startswith("http://127.0.0.1:9120/pair/"))
        claimed = store.claim(ticket["pairId"], "phone-1", "Pixel", now=1_010.0)
        self.assertEqual(claimed["endpoint"], "http://127.0.0.1:9119")
        self.assertEqual(claimed["token"], "dash_tok")

    def test_host_qr_svg(self) -> None:
        svg = matrix_to_svg(encode_matrix("managekar.pair.v1|abc|http://127.0.0.1:9120/claim"))
        self.assertIn("<svg", svg)
        self.assertIn("shape-rendering=\"crispEdges\"", svg)
        self.assertIn("#e8f2fd", svg)


if __name__ == "__main__":
    unittest.main()
