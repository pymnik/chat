// ---- Config ----
// Flask runs on port 5000 by default. Change if you serve the API elsewhere.
const API_BASE = "https://chat-rp5s.onrender.com";
const POLL_INTERVAL = 3000; // ms

// ---- State ----
let currentUser = null;      // { id, name }
let activeChatId = null;
let pollTimer = null;

// ---- Elements ----
const loginScreen = document.getElementById("login");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username-input");
const loginError = document.getElementById("login-error");

const app = document.getElementById("app");
const currentUserEl = document.getElementById("current-user");
const logoutBtn = document.getElementById("logout-btn");
const chatListEl = document.getElementById("chat-list");
const chatTitleEl = document.getElementById("chat-title");
const messagesEl = document.getElementById("messages");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const fileInputBtn = document.getElementById("file-input");
const audioSent = new Audio("sent.mp3");
const audioReceived = new Audio("received.mp3");
let messageNumber = 0;

// ---- Helpers ----
async function apiGet(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  let res;
  if (!body){
    res = await fetch(API_BASE + path, {
    method: "POST"
  });
  }
  else{
    res = await fetch(API_BASE + path, {
    method: "POST",
    body: body
  });
  }
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  // Body may be empty or non-JSON; don't choke on it.
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// Pull a value from an object trying several possible keys.
function pick(obj, keys, fallback = undefined) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function formatTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function saveSession() {
  localStorage.setItem("chat_user", JSON.stringify(currentUser));
}

function loadSession() {
  const raw = localStorage.getItem("chat_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---- Auth ----
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const name = usernameInput.value.trim();
  if (!name) return;

  try {
    const data = await apiGet(`/api/auth/${encodeURIComponent(name)}`);
    const id = data && data.id;
    if (!id || id === "None") {
      loginError.textContent = "User not found.";
      return;
    }
    currentUser = { id: String(id), name };
    saveSession();
    enterApp();
  } catch (err) {
    loginError.textContent = "Could not reach the server.";
    console.error(err);
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("chat_user");
  currentUser = null;
  activeChatId = null;
  stopPolling();
  app.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  usernameInput.value = "";
});

// ---- App ----
function enterApp() {
  loginScreen.classList.add("hidden");
  app.classList.remove("hidden");
  currentUserEl.textContent = currentUser.name;
  loadChats();
}

async function loadChats() {
  chatListEl.innerHTML = `<div class="empty">Loading…</div>`;
  try {
    const chats = await apiGet(`/api/chats/${encodeURIComponent(currentUser.id)}`);
    renderChats(Array.isArray(chats) ? chats : []);
  } catch (err) {
    chatListEl.innerHTML = `<div class="empty">Could not load chats.</div>`;
    console.error(err);
  }
}

function renderChats(chats) {
  if (!chats.length) {
    chatListEl.innerHTML = `<div class="empty">No chats yet.</div>`;
    return;
  }
  chatListEl.innerHTML = "";
  chats.forEach((chat) => {
    const id = chat.id;
    const name = chat.u1name === currentUser.name ? chat.u2name : chat.u1name;
    const preview = chat.last_message;
    const avatar = chat.avatar;

    const item = document.createElement("div");
    item.className = "chat-item";
    item.dataset.chatId = id;
    item.innerHTML = `
      <div class="avatar ${avatar}">${escapeHtml(name.charAt(0).toUpperCase())}</div>
      <div class="chat-info">
        <div class="chat-name">${escapeHtml(name)}</div>
        ${preview ? `<div class="chat-preview">${escapeHtml(preview)}</div>` : ""}
      </div>
    `;
    item.addEventListener("click", () => openChat(id, name, item));
    chatListEl.appendChild(item);
  });
}

function openChat(chatId, name, itemEl) {
  activeChatId = String(chatId);
  chatTitleEl.textContent = name;
  messageForm.classList.remove("hidden");

  document.querySelectorAll(".chat-item.active").forEach((el) => el.classList.remove("active"));
  if (itemEl) itemEl.classList.add("active");

  loadMessages();
  startPolling();
}

async function loadMessages() {
  if (!activeChatId) return;
  try {
    const messages = await apiGet(`/api/messages/${encodeURIComponent(activeChatId)}`);
    renderMessages(Array.isArray(messages) ? messages : []);
  } catch (err) {
    console.error(err);
  }
}

function renderMessages(messages) {
  const wasAtBottom =
    messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 80;

  if (!messages.length) {
    messagesEl.innerHTML = `<div class="empty">No messages yet. Say hi!</div>`;
    return;
  }
  else if (messageNumber > 0 && messages.length > messageNumber && String(messages[messages.length - 1].sender) !== String(currentUser.id)) {
    audioReceived.play();
  }

  messageNumber = messages.length;

  messagesEl.innerHTML = "";
  messages.forEach((msg) => {
    const senderId = msg.sender;
    const senderName = msg.sender_name;
    const content = msg.content;
    const time = msg.timestamp;
    const file_url = msg.file_url;

    const mine = String(senderId) === String(currentUser.id);

    const el = document.createElement("div");
    el.className = `message ${mine ? "out" : "in"}`;
    el.innerHTML = `
      ${!mine && senderName ? `<div class="sender">${escapeHtml(senderName)}</div>` : ""}
      ${file_url ? `<div class='img-container'><img src="${escapeHtml(file_url)}" alt="Image" class="message-image"></div>` : ""}
      <div class="content">${escapeHtml(content)}</div>
      ${time ? `<div class="time">${escapeHtml(formatTime(time))}</div>` : ""}
    `;
    messagesEl.appendChild(el);
  });

  if (wasAtBottom) messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ---- Sending ----
messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const text = messageInput.value.trim();
  const file = fileInputBtn.files[0];

  if (!text || !activeChatId) return;

  const payload = {
    chatId: activeChatId,
    senderId: currentUser.id,
    text: text,
    time: new Date().toISOString()
  };

  const formData = new FormData();
  formData.append("msg", JSON.stringify(payload));
  if (file) {
    formData.append("file", file);
  }

  console.log("Sending message:", payload);

  messageInput.value = "";
  try {
    // The endpoint takes the message in the URL path.
    const encoded = encodeURIComponent(JSON.stringify(payload));
    await apiPost(`/api/messages/${encoded}`, formData);
    await loadMessages();
  } catch (err) {
    console.error(err);
    messageInput.value = text; // restore so the user doesn't lose it
  }
  audioSent.play();
});

// ---- Polling ----
function startPolling() {
  stopPolling();
  pollTimer = setInterval(loadMessages, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

// ---- Boot ----
(function init() {
  const session = loadSession();
  if (session && session.id) {
    currentUser = session;
    enterApp();
  }
})();
