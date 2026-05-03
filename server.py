from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)
            
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
    chats = supabase.execute(f"SELECT CHATS.id, CHATS.user1, CHATS.user2, U1.username as U1NAME, U2.username as U2NAME FROM CHATS LEFT JOIN USERS U1 ON U1.id = CHATS.user1 LEFT JOIN USERS U2 ON U2.id = CHATS.user2 WHERE user1 = 0 OR user2 = 1")
    chats = chats.data()
    chats = json.dumps(chats)
    print(chats)
    return chats
    

if __name__ == "__main__":
    print(get_chats(0))
    app.run()