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
  document.getElementById("bubbleChat").style.display = "flex";
  document.getElementById("bubbleChatIcon").style.display = "none";
  document.getElementById("chatbotContextMenu").style.display = "none";
}

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
    messages.scrollTop = messages.scrollHeight;

  } catch (error) {
    const loading = document.getElementById("bubbleLoading");

    if (loading) {
      loading.remove();
    }

    messages.innerHTML += `<div class="bubble-bot">Lỗi kết nối chatbot.</div>`;
    messages.scrollTop = messages.scrollHeight;
  }
}