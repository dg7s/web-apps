# server.py
import socket
import threading
import os
from urllib.parse import unquote_plus

MIME_TYPES = {
    ".html": "text/html",
    ".css":  "text/css",
    ".js":   "application/javascript",
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".ico":  "image/x-icon",
}

VISITOR_COUNT = 0
lock = threading.Lock()

def read_file(path):
    public_root = os.path.abspath("public")
    abs_path    = os.path.abspath(os.path.join("public", path.lstrip("/")))

    if not abs_path.startswith(public_root + os.sep):
        return b"<h1>403 Forbidden</h1>", "403 Forbidden", "text/html"

    ext  = os.path.splitext(abs_path)[1].lower()
    mime = MIME_TYPES.get(ext, "application/octet-stream")

    try:
        with open(abs_path, "rb") as f:   # binary mode works for text AND images
            return f.read(), "200 OK", mime
    except FileNotFoundError:
        return b"<h1>404 Not Found</h1>", "404 Not Found", "text/html"

def parse_request(raw):
    if not raw:
        return "GET", "/", {}

    lines = raw.split("\r\n")
    # First line: "GET /path HTTP/1.1"
    parts = lines[0].split(" ", 2)
    method = parts[0]
    path = parts[1]
    return method, path

def parse_post_body(request_data):
    parts = request_data.split("\r\n\r\n", 1)
    if len(parts) < 2:
        return {}
    body = parts[1]
    post_data = {}

    pairs = body.split('&')
    for pair in pairs:
        if '=' in pair:
            key, val = pair.split('=',1)
            key = unquote_plus(key)
            val = unquote_plus(val)
            post_data[key] = val
    return post_data

def generate_response(content, status, mime="text/html"):
    if isinstance(content, str):
        content = content.encode()
    response_line    = f"HTTP/1.1 {status}\r\n"
    response_headers = (
        f"Content-Type: {mime}\r\n"
        f"Cache-Control: no-store, must-revalidate\r\n"
        f"Content-Length: {len(content)}\r\n\r\n"
    )
    return response_line.encode() + response_headers.encode() + content


def handle_client(client_connection):
    global VISITOR_COUNT
    request_data = client_connection.recv(4096).decode('utf-8')
    print(f"Connection received!")

    if not request_data:
        return

    print(f"--- Received Request ---\n{request_data}\n------------------------")

    method, path = parse_request(request_data)

    if path == "/" or path == "/index.html":
        with lock:
            VISITOR_COUNT += 1
            print(f"Visitor count: {VISITOR_COUNT}")

    if method == "POST" and path == "/submit":
        form_data = parse_post_body(request_data)
        user_name = form_data['name']
        
        response_html = f"""
        <!DOCTYPE html><html><body>
            <h1>Thank you, {user_name}!</h1>
            <a href="/index.html">Back</a>
        </body></html>
        """
        response = generate_response(response_html, "200 OK")
    else:
        file_path = path if path != "/" else "/index.html"
        content, status, mime = read_file(file_path)
        response = generate_response(content, status, mime)

    client_connection.sendall(response)
    client_connection.close()

def start_server():
    # 1. Create a socket object (IPv4, TCP)
    # AF_INET = IPv4, SOCK_STREAM = TCP
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    # Allow the port to be reused immediately (prevents "Address already in use" errors)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    server_socket.bind(('localhost', 8000))
    server_socket.listen(5)
    
    print("Server running on http://localhost:8000 ...")

    while True:
        client_connection, client_address = server_socket.accept()
        t = threading.Thread(target=handle_client, args=(client_connection,))
        t.start()

if __name__ == '__main__':
    start_server()