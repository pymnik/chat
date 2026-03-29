from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api/messages", methods=["GET"])
def get_messages():
    return None

@app.route("/api/messages", methods=["POST"])
def send_message():
    message = request().json()
    text = message.get("text")
    username = message.get("username")
    id = message.get("id")
    return True

if name == "__main__":
    app.run()