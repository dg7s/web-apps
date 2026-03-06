# server.py
import socket
import threading
import time
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

VISITOR_COUNT = 0
lock = threading.Lock()

def parse_request(raw):
    if not raw:
        return "GET", "/", {}

    lines = raw.split("\r\n")
    # First line: "GET /path HTTP/1.1"
    method, path, _ = lines[0].split(" ", 2)

    headers = {}
    for line in lines[1:]:
        if ": " in line:
            key, val = line.split(": ", 1)
            headers[key] = val
        else:
            break   # blank line = end of headers

    return path

def generate_response(content, status, mime="text/html"):
    if isinstance(content, str):
        content = content.encode()
    response_line    = f"HTTP/1.1 {status}\r\n"
    response_headers = f"Content-Type: {mime}\r\nContent-Length: {len(content)}\r\n\r\n"
    return response_line.encode() + response_headers.encode() + content


def handle_client(client_connection):
    global VISITOR_COUNT
    request_data = client_connection.recv(1024).decode('utf-8')
    print(f"Connection received!")

    if not request_data:
        return

    print(f"--- Received Request ---\n{request_data}\n------------------------")

    path = parse_request(request_data)
    content, status, mime = read_file(path if path != "/" else "/index.html")
    response = generate_response(content, status, mime)
    client_connection.sendall(response)
    client_connection.close()

    #if path == '/favicon.ico':
    #    client_connection.sendall(generate_response("", "404 Not Found"))
    #    return

    #with lock:
    #    VISITOR_COUNT += 1
    #    count = VISITOR_COUNT
    
    #response_body = f"Visited {count} times"
    #client_connection.sendall(generate_response(response_body))
    #client_connection.close()

def start_server():
    VISITOR_COUNT = 0
    lock = threading.Lock()

    # 1. Create a socket object (IPv4, TCP)
    # AF_INET = IPv4, SOCK_STREAM = TCP
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    # Allow the port to be reused immediately (prevents "Address already in use" errors)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    # TODO: Bind the socket to 'localhost' and port 8000
    # Hint: bind() takes a tuple: ('host', port)
    server_socket.bind(('localhost', 8000))
    
    # TODO: Start listening for connections (backlog of 5)
    server_socket.listen(5)
    
    print("Server running on http://localhost:8000 ...")

    while True:
        # TODO: Accept a new connection
        client_connection, client_address = server_socket.accept()
        t = threading.Thread(target=handle_client, args=(client_connection,))
        t.start()

if __name__ == '__main__':
    start_server()