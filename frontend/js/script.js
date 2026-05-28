let currentMessages = [];

document.addEventListener("DOMContentLoaded", function () {
  renderRecentList();
});

document.addEventListener("click", function () {
  closeAllDropdowns();
});

function handleEnter(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function autoResizeInput() {
  const input = document.getElementById("userInput");
  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
}

function newChat() {
  currentMessages = [];
  document.getElementById("chatBox").innerHTML = "";
  document.getElementById("welcomeText").style.display = "block";
  document.querySelector(".chat-area").classList.remove("chat-mode");
  document.getElementById("userInput").value = "";
}

function saveConversation() {
  if (currentMessages.length === 0) return;

  let conversations = JSON.parse(localStorage.getItem("cgv_conversations")) || [];
  const firstUserMessage = currentMessages.find(msg => msg.role === "user")?.content || "Cuộc trò chuyện mới";

  conversations = conversations.filter(item => item.id !== currentMessages.id);

  conversations.unshift({
    id: currentMessages.id || Date.now(),
    title: firstUserMessage.slice(0, 35),
    messages: currentMessages
  });

  localStorage.setItem("cgv_conversations", JSON.stringify(conversations.slice(0, 10)));
  renderRecentList();
}

function renderRecentList() {
  const recentList = document.getElementById("recentList");
  if (!recentList) return;

  const conversations = JSON.parse(localStorage.getItem("cgv_conversations")) || [];

  recentList.innerHTML = conversations.map(item => `
    <div class="recent-item">
      <div class="recent-title" onclick="loadConversation(${item.id})">
        💬 ${item.title}
      </div>

      <div class="recent-actions">
        <button class="more-btn" onclick="toggleMenu(event, ${item.id})">
          ⋯
        </button>

        <div class="dropdown-menu" id="menu-${item.id}">
          <div onclick="renameConversation(event, ${item.id})">
            Đổi tên
          </div>

          <div onclick="deleteConversation(event, ${item.id})">
            Xóa
          </div>
        </div>
      </div>
    </div>
  `).join("");
}

function loadConversation(id) {
  const conversations = JSON.parse(localStorage.getItem("cgv_conversations")) || [];
  const conversation = conversations.find(item => item.id === id);

  if (!conversation) return;

  currentMessages = conversation.messages;
  currentMessages.id = conversation.id;

  const chatBox = document.getElementById("chatBox");
  const welcomeText = document.getElementById("welcomeText");
  const chatArea = document.querySelector(".chat-area");

  welcomeText.style.display = "none";
  chatArea.classList.add("chat-mode");
  chatBox.innerHTML = "";

  currentMessages.forEach(msg => {
    if (msg.role === "user") {
      chatBox.innerHTML += `<div class="user-message">${msg.content}</div>`;
    } else {
      chatBox.innerHTML += `<div class="bot-message">${marked.parse(msg.content)}</div>`;
    }
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

function toggleMenu(event, id) {
  event.stopPropagation();

  const menu = document.getElementById(`menu-${id}`);
  if (!menu) return;

  document.querySelectorAll(".dropdown-menu").forEach(item => {
    if (item !== menu) {
      item.classList.remove("show");
    }
  });
  menu.classList.toggle("show");
}

function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-menu").forEach(menu => {
    menu.classList.remove("show");
  });
}

function deleteConversation(event, id) {
  event.stopPropagation();

  let conversations = JSON.parse(localStorage.getItem("cgv_conversations")) || [];

  conversations = conversations.filter(item => item.id !== id);

  localStorage.setItem("cgv_conversations", JSON.stringify(conversations));

  if (currentMessages.id === id) {
    newChat();
  }

  renderRecentList();
}

function renameConversation(event, id) {
  event.stopPropagation();

  const newName = prompt("Nhập tên mới:");

  if (!newName) return;

  const conversations = JSON.parse(localStorage.getItem("cgv_conversations")) || [];
  const target = conversations.find(item => item.id === id);

  if (target) {
    target.title = newName.trim();
  }

  localStorage.setItem("cgv_conversations", JSON.stringify(conversations));

  renderRecentList();
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const welcomeText = document.getElementById("welcomeText");
  const chatArea = document.querySelector(".chat-area");
  const userText = input.value.trim();

  if (userText === "") return;

  if (!currentMessages.id) {
    currentMessages.id = Date.now();
  }

  welcomeText.style.display = "none";
  chatArea.classList.add("chat-mode");

  chatBox.innerHTML += `<div class="user-message">${userText}</div>`;

  currentMessages.push({
    role: "user",
    content: userText
  });

  input.value = "";
  input.style.height = "auto";
  chatBox.scrollTop = chatBox.scrollHeight;

  chatBox.innerHTML += `<div class="bot-message" id="loading">Bot đang trả lời...</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: userText
      })
    });

    const data = await response.json();
    const loading = document.getElementById("loading");

    if (loading) loading.remove();

    const botReply = data.reply || "Không có phản hồi.";

    chatBox.innerHTML += `<div class="bot-message">${marked.parse(botReply)}</div>`;

    currentMessages.push({
      role: "bot",
      content: botReply
    });

    saveConversation();

    chatBox.scrollTop = chatBox.scrollHeight;

  } catch (error) {
    const loading = document.getElementById("loading");

    if (loading) loading.remove();

    const errorText = "Lỗi kết nối chatbot.";

    chatBox.innerHTML += `<div class="bot-message">${errorText}</div>`;

    currentMessages.push({
      role: "bot",
      content: errorText
    });

    saveConversation();

    chatBox.scrollTop = chatBox.scrollHeight;
  }
}