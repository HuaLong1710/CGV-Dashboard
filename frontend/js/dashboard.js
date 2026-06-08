let bubbleAction = null;
let bubbleDirection = "";
let pointerId = null;
let startX = 0;
let startY = 0;
let startLeft = 0;
let startTop = 0;
let startWidth = 0;
let startHeight = 0;

function startResizeBubble(event, direction) {
  event.preventDefault();
  event.stopPropagation();

  const bubble = document.getElementById("bubbleChat");
  const rect = bubble.getBoundingClientRect();

  bubbleAction = "resize";
  bubbleDirection = direction;
  pointerId = event.pointerId;

  startX = event.clientX;
  startY = event.clientY;
  startLeft = rect.left;
  startTop = rect.top;
  startWidth = rect.width;
  startHeight = rect.height;

  bubble.setPointerCapture(pointerId);

  document.body.style.userSelect = "none";
  document.body.style.cursor = getResizeCursor(direction);

  bubble.addEventListener("pointermove", handleBubblePointerMove);
  bubble.addEventListener("pointerup", stopBubblePointerAction);
  bubble.addEventListener("pointercancel", stopBubblePointerAction);
}

function startDragBubble(event) {
  if (
    event.target.tagName === "BUTTON" ||
    event.target.id === "bubbleTitle"
  ) return;

  event.preventDefault();

  const bubble = document.getElementById("bubbleChat");
  const rect = bubble.getBoundingClientRect();

  bubbleAction = "drag";
  bubbleDirection = "";
  pointerId = event.pointerId;
  startX = event.clientX;
  startY = event.clientY;
  startLeft = rect.left;
  startTop = rect.top;

  bubble.setPointerCapture(pointerId);

  document.body.style.userSelect = "none";
  document.body.style.cursor = "move";

  bubble.addEventListener("pointermove", handleBubblePointerMove);
  bubble.addEventListener("pointerup", stopBubblePointerAction);
  bubble.addEventListener("pointercancel", stopBubblePointerAction);
}

function handleBubblePointerMove(event) {
  if (!bubbleAction) return;

  const bubble = document.getElementById("bubbleChat");
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;

  if (bubbleAction === "drag") {
    bubble.style.left = startLeft + dx + "px";
    bubble.style.top = startTop + dy + "px";
    bubble.style.right = "auto";
    bubble.style.bottom = "auto";
  }

  if (bubbleAction === "resize") {
    let newLeft = startLeft;
    let newTop = startTop;
    let newWidth = startWidth;
    let newHeight = startHeight;

    if (bubbleDirection.includes("right")) {
      newWidth = startWidth + dx;
    }

    if (bubbleDirection.includes("left")) {
      newWidth = startWidth - dx;
      newLeft = startLeft + dx;
    }

    if (bubbleDirection.includes("bottom")) {
      newHeight = startHeight + dy;
    }

    if (bubbleDirection.includes("top")) {
      newHeight = startHeight - dy;
      newTop = startTop + dy;
    }

    bubble.style.left = newLeft + "px";
    bubble.style.top = newTop + "px";
    bubble.style.width = newWidth + "px";
    bubble.style.height = newHeight + "px";
    bubble.style.right = "auto";
    bubble.style.bottom = "auto";
  }
}

function stopBubblePointerAction(event) {
  const bubble = document.getElementById("bubbleChat");

  if (pointerId !== null && bubble.hasPointerCapture(pointerId)) {
    bubble.releasePointerCapture(pointerId);
  };

  bubbleAction = null;
  bubbleDirection = "";
  pointerId = null;

  document.body.style.userSelect = "auto";
  document.body.style.cursor = "auto";

  bubble.removeEventListener("pointermove", handleBubblePointerMove);
  bubble.removeEventListener("pointerup", stopBubblePointerAction);
  bubble.removeEventListener("pointercancel", stopBubblePointerAction);
}

function getResizeCursor(direction) {
  if (direction === "left" || direction === "right") return "ew-resize";
  if (direction === "top" || direction === "bottom") return "ns-resize";
  if (direction === "top-left" || direction === "bottom-right") return "nwse-resize";
  if (direction === "top-right" || direction === "bottom-left") return "nesw-resize";
  return "default";
}

/**/
function openChatbotContextMenu(event) {
  event.preventDefault();
  event.stopPropagation();

  const menuItem = document.getElementById("chatbotMenuItem");
  const menu = document.getElementById("chatbotContextMenu");

  if (!menuItem || !menu) return;

  const rect = menuItem.getBoundingClientRect();

  menu.style.display = "block";
  menu.style.left = rect.right - 8 + "px";
  menu.style.top = rect.top + 8 + "px";
}

document.addEventListener("click", function () {
  const menu = document.getElementById("chatbotContextMenu");

  if (menu) {
    menu.style.display = "none";
  }
});

function openBubbleChat() {
  const bubble = document.getElementById("bubbleChat");
  const icon = document.getElementById("bubbleChatIcon");
  const menu = document.getElementById("chatbotContextMenu");

  bubble.style.display = "flex";
  icon.style.display = "none";
  menu.style.display = "none";
}

/*lưu kích thước bubble chat khi đóng*/
window.addEventListener("DOMContentLoaded", () => {
  resetBubbleDefault();
});

function resetBubbleDefault() {
  const bubble = document.getElementById("bubbleChat");
  if (!bubble) return;

  bubble.style.width = "320px";
  bubble.style.height = "420px";
  bubble.style.left = "";
  bubble.style.top = "";
  bubble.style.right = "28px";
  bubble.style.bottom = "28px";
}

function resetBubblePosition() {
  const bubble = document.getElementById("bubbleChat");

  bubble.style.left = "calc(100vw - 348px)";
  bubble.style.top = "calc(100vh - 448px)";
  bubble.style.width = "320px";
  bubble.style.height = "420px";
  bubble.style.right = "auto";
  bubble.style.bottom = "auto";
}

/*bubble history*/
let bubbleMessagesData = [];

function toggleBubbleHistory(event) {
  event.stopPropagation();

  const historyBox = document.getElementById("bubbleHistory");

  if (historyBox.style.display === "block") {
    historyBox.style.display = "none";
    return;
  }

  renderBubbleHistory();
  historyBox.style.display = "block";
}

function renderBubbleHistory() {
  const historyList = document.getElementById("bubbleHistoryList");
  if (!historyList) return;

  const conversations =
    JSON.parse(localStorage.getItem("cgv_conversations")) || [];

  historyList.innerHTML = conversations.map(item => `
    <div class="bubble-history-item" onclick="loadBubbleConversation(${item.id})">
      ${item.title}
    </div>
  `).join("");
}

function loadBubbleConversation(id) {
  const conversations =
    JSON.parse(localStorage.getItem("cgv_conversations")) || [];

  const conversation =
    conversations.find(item => item.id === id);

  if (!conversation) return;

  bubbleMessagesData = conversation.messages;
  bubbleMessagesData.id = conversation.id;

  const messages = document.getElementById("bubbleMessages");

  messages.innerHTML = "";

  bubbleMessagesData.forEach(msg => {
    if (msg.role === "user") {
      messages.innerHTML += `<div class="bubble-user">${msg.content}</div>`;
    } else {
      messages.innerHTML += `<div class="bubble-bot">${msg.content}</div>`;
    }
  });

  messages.scrollTop = messages.scrollHeight;
}

function saveBubbleConversation() {
  if (bubbleMessagesData.length === 0) return;

  let conversations = JSON.parse(localStorage.getItem("cgv_conversations")) || [];
  const firstUserMessage = bubbleMessagesData.find(msg => msg.role === "user")?.content || "Cuộc trò chuyện mới";

  const id = bubbleMessagesData.id || Date.now();
  bubbleMessagesData.id = id;

  conversations = conversations.filter(item => item.id !== id);

  conversations.unshift({
    id: id,
    title: firstUserMessage.slice(0, 35),
    messages: bubbleMessagesData
  });

  localStorage.setItem("cgv_conversations", JSON.stringify(conversations.slice(0, 10)));
}

/*minimize bubble chat*/
function minimizeBubbleChat() {
  document.getElementById("bubbleChat").style.display = "none";
  document.getElementById("bubbleChatIcon").style.display = "flex";
}

function restoreBubbleChat() {
  document.getElementById("bubbleChat").style.display = "flex";
  document.getElementById("bubbleChatIcon").style.display = "none";
}

function closeBubbleChat() {
  document.getElementById("bubbleChat").style.display = "none";
  document.getElementById("bubbleChatIcon").style.display = "none";
}

function handleBubbleEnter(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendBubbleMessage();
  }
}

async function sendBubbleMessage() {
  const input = document.getElementById("bubbleInput");
  const messages = document.getElementById("bubbleMessages");

  const userText = input.value.trim();

  if (userText === "") return;

  messages.innerHTML += `<div class="bubble-user">${userText}</div>`;
  
  bubbleMessagesData.push({
    role: "user",
    content: userText
  });

  input.value = "";

  messages.innerHTML += `<div class="bubble-bot" id="bubbleLoading">Bot đang trả lời...</div>`;
  messages.scrollTop = messages.scrollHeight;

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

    const loading = document.getElementById("bubbleLoading");

    if (loading) {
      loading.remove();
    }

    messages.innerHTML += `<div class="bubble-bot">${data.reply}</div>`;

    bubbleMessagesData.push({
      role: "bot",
      content: data.reply
    });
    saveBubbleConversation();

    messages.scrollTop = messages.scrollHeight;

  } catch (error) {
    const loading = document.getElementById("bubbleLoading");

    if (loading) {
      loading.remove();
    }

    messages.innerHTML += `<div class="bubble-bot">Lỗi kết nối chatbot.</div>`;

    bubbleMessagesData.push({
      role: "bot",
      content: "Lỗi kết nối chatbot."
    });
    saveBubbleConversation();

    messages.scrollTop = messages.scrollHeight;
  }
}

function toggleBubbleSidebar(event) {
  event.stopPropagation();
  const sidebar = document.getElementById("bubbleSidebar");
  sidebar.classList.toggle("show");
  renderBubbleHistory();
}

function newBubbleChat() {
  bubbleMessagesData = [];
  document.getElementById("bubbleMessages").innerHTML = "";
  document.getElementById("bubbleInput").value = "";
}