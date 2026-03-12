import http.server
import socketserver
import os
import sys
import json
import socket

PORT = 0
DIRECTORY = "/app/dist/public"

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Mock API endpoints to prevent hanging
        if self.path.startswith('/api/auth/user'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"id": 1, "username": "testuser"}).encode())
            return

        if self.path.startswith('/api/songs'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            # Return some mock songs so the UI renders cards
            self.wfile.write(json.dumps([
                {
                    "id": 1,
                    "title": "Test Song 1",
                    "description": "A test song",
                    "genre": "Pop",
                    "mood": "Happy",
                    "lyrics": "La la la",
                    "audioUrl": None,
                    "hasVocal": False,
                    "isPublic": True,
                    "userId": 1,
                    "createdAt": "2024-03-09T00:00:00.000Z",
                    "playCount": 0,
                    "likeCount": 0
                }
            ]).encode())
            return

        if self.path.startswith('/api/public-songs'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps([
                 {
                    "id": 1,
                    "title": "Test Public Song",
                    "description": "A test song",
                    "genre": "Pop",
                    "mood": "Happy",
                    "lyrics": "La la la",
                    "audioUrl": None,
                    "hasVocal": False,
                    "isPublic": True,
                    "userId": 1,
                    "createdAt": "2024-03-09T00:00:00.000Z",
                    "playCount": 10,
                    "likeCount": 5
                }
            ]).encode())
            return

        if self.path.startswith('/api/liked-songs'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"likedIds": [1]}).encode())
            return

        # Serve static files or fallback to index.html for SPA routing
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            self.path = '/index.html'
        return super().do_GET()

# Try to find an open port
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind(('127.0.0.1', 0))
PORT = sock.getsockname()[1]
sock.close()

with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
    print(f"Serving at port {PORT}")
    with open("verification/port.txt", "w") as f:
        f.write(str(PORT))
    httpd.serve_forever()
