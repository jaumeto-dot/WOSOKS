import io
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from urllib.parse import urlencode

os.environ.pop("DATABASE_URL", None)
os.environ["WOS_ADMIN_PASSWORD"] = "TestPassword123!"

import app


class WOSSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = Path(tempfile.mkdtemp(prefix="wos-test-"))
        app.DATA_DIR = cls.tmp
        app.DB_PATH = cls.tmp / "wos.sqlite3"
        app.ADMIN_PASSWORD_PATH = cls.tmp / "admin_password.txt"
        app.IMPORTS_DIR = cls.tmp / "imports"
        app.DB_READY = False
        app.init_db()

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def call(self, path, method="GET", body=b"", content_type="", cookie=""):
        captured = {}
        env = {
            "REQUEST_METHOD": method,
            "PATH_INFO": path,
            "QUERY_STRING": "",
            "CONTENT_LENGTH": str(len(body)),
            "CONTENT_TYPE": content_type,
            "wsgi.input": io.BytesIO(body),
            "wsgi.errors": io.StringIO(),
            "wsgi.version": (1, 0),
            "wsgi.url_scheme": "https",
            "wsgi.multithread": False,
            "wsgi.multiprocess": False,
            "wsgi.run_once": False,
            "SERVER_NAME": "localhost",
            "SERVER_PORT": "443",
            "HTTP_X_FORWARDED_PROTO": "https",
        }
        if cookie:
            env["HTTP_COOKIE"] = cookie

        def start_response(status, headers):
            captured["status"] = status
            captured["headers"] = dict(headers)

        payload = b"".join(app.app(env, start_response))
        return captured["status"], captured["headers"], payload

    def login(self):
        body = urlencode({"username": "admin", "password": "TestPassword123!"}).encode()
        status, headers, _ = self.call(
            "/login", "POST", body, "application/x-www-form-urlencoded"
        )
        self.assertTrue(status.startswith("302"), status)
        raw_cookie = headers["Set-Cookie"]
        self.assertIn("HttpOnly", raw_cookie)
        self.assertIn("SameSite=Lax", raw_cookie)
        self.assertIn("Secure", raw_cookie)
        return raw_cookie.split(";", 1)[0]

    def test_unauthenticated_api_is_rejected(self):
        status, _, payload = self.call("/api/wines")
        self.assertTrue(status.startswith("401"), status)
        self.assertEqual(json.loads(payload)["error"], "No autorizado")

    def test_login_and_me(self):
        cookie = self.login()
        status, _, payload = self.call("/api/me", cookie=cookie)
        self.assertTrue(status.startswith("200"), status)
        data = json.loads(payload)
        self.assertEqual(data["username"], "admin")
        self.assertEqual(data["role"], "admin")

    def test_wines_requires_auth_and_returns_structure(self):
        cookie = self.login()
        status, _, payload = self.call("/api/wines", cookie=cookie)
        self.assertTrue(status.startswith("200"), status)
        data = json.loads(payload)
        self.assertIn("wines", data)
        self.assertIn("outlets", data)
        self.assertEqual(data["outlets"], app.OUTLETS)

    def test_password_hash_round_trip(self):
        hashed = app.hash_password("correct horse battery staple")
        self.assertTrue(app.verify_password("correct horse battery staple", hashed))
        self.assertFalse(app.verify_password("wrong", hashed))


if __name__ == "__main__":
    unittest.main()
