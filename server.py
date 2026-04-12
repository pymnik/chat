from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import psycopg2
import db
import json

conn = psycopg2.connect(os.environ.get("DATABASE_URL"))
cur = conn.cursor()

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

@app.route("/api/chats/<user_id>", methods=["GET"])
def get_chats(user_id):
    chats = cur.execute(f"SELECT CHATS.id, CHATS.user1, CHATS.user2, U1.username as U1NAME, U2.username as U2NAME FROM WHERE user1 = {user_id} OR user2 = {user_id} '\
                         LEFT JOIN USERS U1 ON U1.id = CHATS.user1 LEFT JOIN USERS U2 ON U2.id = CHATS.user2")
    chats = chats.fetchall()
    chats = json.dumps(chats)
    return chats
    

if __name__ == "__main__":
    app.run()