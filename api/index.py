from __future__ import annotations

import io
import os
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app import app as wos_app  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self._handle()

    def do_POST(self):
        self._handle()

    def _handle(self):
        parsed = urlsplit(self.path)
        body = self.rfile.read(int(self.headers.get("content-length", "0") or "0"))
        environ = {
            "REQUEST_METHOD": self.command,
            "PATH_INFO": parsed.path,
            "QUERY_STRING": parsed.query,
            "CONTENT_LENGTH": str(len(body)),
            "CONTENT_TYPE": self.headers.get("content-type", ""),
            "wsgi.input": io.BytesIO(body),
            "wsgi.errors": sys.stderr,
            "wsgi.version": (1, 0),
            "wsgi.url_scheme": "https",
            "wsgi.multithread": False,
            "wsgi.multiprocess": True,
            "wsgi.run_once": False,
            "SERVER_NAME": self.headers.get("host", "localhost"),
            "SERVER_PORT": "443",
        }
        for key, value in self.headers.items():
            header_key = "HTTP_" + key.upper().replace("-", "_")
            if header_key not in {"HTTP_CONTENT_TYPE", "HTTP_CONTENT_LENGTH"}:
                environ[header_key] = value
        if self.headers.get("x-forwarded-proto"):
            environ["HTTP_X_FORWARDED_PROTO"] = self.headers.get("x-forwarded-proto")

        captured = {}

        def start_response(status, headers):
            captured["status"] = status
            captured["headers"] = headers

        chunks = wos_app(environ, start_response)
        status = captured.get("status", "500 Internal Server Error")
        code = int(status.split(" ", 1)[0])
        self.send_response(code)
        for name, value in captured.get("headers", []):
            self.send_header(name, value)
        self.end_headers()
        for chunk in chunks:
            self.wfile.write(chunk)
