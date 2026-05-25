function handleEnter(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function showDashboard() {
  document.querySelector(".chat-area").style.display = "none";
  document.getElementById("dashboardArea").style.display = "block";
}

function showChatbot() {
  document.querySelector(".chat-area").style.display = "flex";
  document.getElementById("dashboardArea").style.display = "none";
}

/* Tự động co giãn ô chat */
function autoResizeInput() {
  const input = document.getElementById("userInput");
  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
}

/* Gửi tin nhắn */
async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const welcomeText = document.getElementById("welcomeText");
  const chatArea = document.querySelector(".chat-area");
  const userText = input.value.trim();
  if (userText === "") return;

  /* Ẩn lời chào */
  welcomeText.style.display = "none";

  /* Chuyển sang chế độ chat */
  chatArea.classList.add("chat-mode");

  /* Tin nhắn user */
  chatBox.innerHTML += `<div class="user-message">${userText}</div>`;
  input.value = "";

  /* Reset chiều cao input */
  input.style.height = "auto";

  /* Scroll xuống */
  chatBox.scrollTop = chatBox.scrollHeight;

  /* Loading */
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

    /* Xóa loading */
    const loading = document.getElementById("loading");
    if (loading) {
      loading.remove();
    }

    /* Markdown format */
    const markdownReply = marked.parse(data.reply);

    /* Tin nhắn bot */
    chatBox.innerHTML += `
      <div class="bot-message">
        ${markdownReply}
      </div>
    `;

    /* Scroll xuống cuối */
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (error) {

    /* Xóa loading nếu lỗi */
    const loading = document.getElementById("loading");
    if (loading) {
      loading.remove();
    }

    /* Hiện lỗi */
    chatBox.innerHTML += `
      <div class="bot-message">
        Lỗi kết nối chatbot.
      </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}