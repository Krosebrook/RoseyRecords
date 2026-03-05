import http.server
import socketserver
import os
import time

PORT = 5000
DIRECTORY = "dist/public"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Setup paths
        path = self.path
        if path == '/':
            path = '/index.html'

        file_path = os.path.join(DIRECTORY, path.lstrip('/'))

        if not os.path.exists(file_path):
            self.path = '/index.html'

        return super().do_GET()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving SPA at port {PORT}")
    httpd.serve_forever()
