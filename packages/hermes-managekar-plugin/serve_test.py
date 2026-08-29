import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from pairing import PairStore, plugin_claim_url
from serve import make_handler


def _json(url: str, method: str = "GET", body: dict | None = None) -> tuple[int, dict]:
    data = None if body is None else json.dumps(body).encode("utf-8")
    request = Request(url, data=data, method=method)
    if body is not None:
        request.add_header("content-type", "application/json")
    try:
        with urlopen(request, timeout=2) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raw = error.read().decode("utf-8")
        parsed = json.loads(raw) if raw else {}
        return error.code, parsed


class ServeTests(unittest.TestCase):
    def test_claim_returns_dashboard_and_rejects_reuse(self) -> None:
        store = PairStore(records={})
        handler = make_handler(
            store,
            "http://127.0.0.1:9120",
            "http://127.0.0.1:9119",
            "Hermes",
            "dash_tok",
        )
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        port = server.server_address[1]
        try:
            health_status, health = _json(f"http://127.0.0.1:{port}/health")
            self.assertEqual(health_status, 200)
            self.assertTrue(health["ok"])
            self.assertEqual(health["dashboard"], "http://127.0.0.1:9119")

            mint_status, minted = _json(
                f"http://127.0.0.1:{port}/api/plugins/managekar/pair",
                "POST",
                {"host_label": "verify"},
            )
            self.assertEqual(mint_status, 200)
            self.assertEqual(minted["ticket"]["kind"], "managekar.pair.v1")
            self.assertEqual(minted["claim_url"], plugin_claim_url("http://127.0.0.1:9120"))

            claim_status, claimed = _json(
                f"http://127.0.0.1:{port}/claim",
                "POST",
                {"pair_id": minted["pair_id"], "device_id": "phone", "device_name": "gate"},
            )
            self.assertEqual(claim_status, 200)
            self.assertEqual(claimed["endpoint"], "http://127.0.0.1:9119")
            self.assertEqual(claimed["token"], "dash_tok")
            self.assertNotEqual(claimed["endpoint"], "http://127.0.0.1:9120")

            reuse_status, reuse = _json(
                f"http://127.0.0.1:{port}/api/plugins/managekar/claim",
                "POST",
                {"pair_id": minted["pair_id"], "device_id": "other", "device_name": "gate"},
            )
            self.assertEqual(reuse_status, 409)
            self.assertEqual(reuse["error"], "already claimed")
        finally:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    unittest.main()
