import unittest

from pairing import KIND, PairStore, compact_payload, plugin_claim_url


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


if __name__ == "__main__":
    unittest.main()
