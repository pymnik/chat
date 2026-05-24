from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("var.env")

app = Flask(__name__)
CORS(app)

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)
            
@app.route("/api/messages/<chat_id>", methods=["GET"])
def get_messages(chat_id):
    response = supabase.rpc(
        "get_chat_messages",
        {
            "chat_id": int(chat_id)
        }
    ).execute()
    return response.data

@app.route("/api/messages", methods=["POST"])
def send_message():
    message = request().json()
    text = message.get("text")
    username = message.get("username")
    id = message.get("id")
    return True

@app.route("/api/chats/<user_id>", methods=["GET"])
def get_chats(user_id):
    response = supabase.rpc(
        "get_user_chats",
        {
            "user_id_input":int(user_id)
        }
    ).execute()
    return response.data

@app.route("/api/auth/<name>", methods=["GET"])
def auth(name):
    response = supabase.rpc(
        "get_user_id",
        {
            "nickname": name
        }
    ).execute()
    return response.data
    

if __name__ == "__main__":
    app.run()