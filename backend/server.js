require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { chat } = require("./controllers/chatController");
const { embedNewDocuments } = require("./services/ragService");
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* API kiểm tra backend */
app.get("/", (req, res) => {
  res.send("Backend CGV đang chạy");
});

/* API Chat */
app.post("/chat", chat);

/* API tạo embedding cho RAG */
app.post("/api/rag/embed", async (req, res) => {
  try {
    const embeddedCount = await embedNewDocuments();

    res.json({
      success: true,
      embedded: embeddedCount,
    });
  } catch (error) {
    console.log("RAG EMBED ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* Start Server */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});