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
    <div class="recent-item" data-title="${item.title}">
      <div class="recent-title" title="${item.title}" onclick="loadConversation(${item.id})">
        <span class="recent-text">${item.title}</span>
      </div>

      <div class="recent-actions">
        <button class="more-btn" onclick="toggleMenu(event, ${item.id})">
          ⋮
        </button>

        <div class="dropdown-menu" id="menu-${item.id}">
          <div onclick="openRenameModal(event, ${item.id})">Đổi tên</div>
          <div onclick="deleteConversation(event, ${item.id})">Xóa</div>
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

  document.querySelectorAll(".dropdown-menu").forEach(menu => {
    menu.classList.remove("show");
    menu.classList.remove("up");
    menu.classList.remove("down");
  });

  document.addEventListener("click", () => {
  document.querySelectorAll(".dropdown-menu").forEach(menu => {
    menu.classList.remove("show");
    menu.classList.remove("up");
    menu.classList.remove("down");
  });
});

  const menu = document.getElementById(`menu-${id}`);
  const rect = menu.parentElement.getBoundingClientRect();
  const windowHeight = window.innerHeight;

  if (rect.bottom > windowHeight - 120) {
    menu.classList.add("up");
  } else {
    menu.classList.add("down");
  }

  menu.classList.add("show");
}

let deleteTargetId = null;

function deleteConversation(event, id) {
  event.stopPropagation();
  deleteTargetId = id;
  document.getElementById("deleteModal").style.display = "flex";
  closeAllDropdowns();
}

function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById("deleteModal").style.display = "none";
}

function confirmDelete() {
  if (!deleteTargetId) return;

  let conversations = JSON.parse(localStorage.getItem("cgv_conversations")) || [];
  conversations = conversations.filter(item => item.id !== deleteTargetId);

  localStorage.setItem("cgv_conversations", JSON.stringify(conversations));

  if (currentMessages.id === deleteTargetId) {
    newChat();
  }

  closeDeleteModal();
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

let renameTargetId = null;

function openRenameModal(event, id) {
  event.stopPropagation();

  const conversations = JSON.parse(localStorage.getItem("cgv_conversations")) || [];
  const target = conversations.find(item => item.id === id);

  if (!target) return;

  renameTargetId = id;

  document.getElementById("renameInput").value = target.title;
  document.getElementById("renameModal").style.display = "flex";

  closeAllDropdowns();
}

function closeRenameModal() {
  renameTargetId = null;
  document.getElementById("renameModal").style.display = "none";
}

function confirmRename() {
  const newName = document.getElementById("renameInput").value.trim();

  if (!newName || !renameTargetId) return;

  const conversations = JSON.parse(localStorage.getItem("cgv_conversations")) || [];
  const target = conversations.find(item => item.id === renameTargetId);

  if (target) {
    target.title = newName;
  }

  localStorage.setItem("cgv_conversations", JSON.stringify(conversations));

  closeRenameModal();
  renderRecentList();
}

function openSearchModal() {
  document.getElementById("searchModal").style.display = "flex";

  document.getElementById("searchInput").value = "";
  document.getElementById("searchResults").innerHTML = "";

  setTimeout(() => {
    document.getElementById("searchInput").focus();
  }, 100);
}

function handleSearchEnter(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    searchConversations();
  }
}

function closeSearchModal() {
  document.getElementById("searchModal").style.display = "none";
}

function openSearchResult(id) {
  loadConversation(id);
  closeSearchModal();
}

function searchConversations() {
  const keyword = document.getElementById("searchInput").value.toLowerCase().trim();
  const resultBox = document.getElementById("searchResults");
  const conversations = JSON.parse(localStorage.getItem("cgv_conversations")) || [];

  if (!keyword) {
    resultBox.innerHTML = `
      <div class="search-empty">Vui lòng nhập từ khóa cần tìm.</div>
    `;
    return;
  }

  const results = conversations.filter(item => {
    const matchTitle = item.title?.toLowerCase().includes(keyword);

    const matchContent = item.messages?.some(msg =>
      msg.content?.toLowerCase().includes(keyword)
    );

    return matchTitle || matchContent;
  });

  if (results.length === 0) {
    resultBox.innerHTML = `
      <div class="search-empty">Không tìm thấy cuộc trò chuyện phù hợp.</div>
    `;
    return;
  }

  resultBox.innerHTML = results.map(item => {
    const previewMessage = item.messages?.find(msg =>
      msg.content?.toLowerCase().includes(keyword)
    );

    const preview = previewMessage
      ? previewMessage.content.slice(0, 120) + "..."
      : "Khớp với tên cuộc trò chuyện";

    return `
      <div class="search-result-item" onclick="openSearchResult(${item.id})">
        <div class="search-result-title">${item.title}</div>
        <div class="search-result-preview">${preview}</div>
      </div>
    `;
  }).join("");
}