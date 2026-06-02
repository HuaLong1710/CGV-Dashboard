require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const { pipeline } = require("@xenova/transformers");

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const TABLE_NAME = process.env.TABLE_NAME || "CGV";

let embeddingPipeline = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {

    console.log("Loading embedding model...");

    embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );

    console.log("Embedding model loaded!");
  }

  return embeddingPipeline;
}

async function createEmbedding(text) {

  const extractor = await getEmbeddingPipeline();

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}

const PORT = process.env.PORT || 3000;

/* Tên cột trong Supabase */
const COLS = {
  province: "Tỉnh thành",
  cinemaGroup: "Cụm Rạp",
  cinema: "Tên Rạp",
  movie: "Tên Phim",
  bookingDate: "Ngày Đặt",
  showDate: "Ngày Chiếu",
  ticketType: "Loại vé",
  listedPrice: "Giá niêm yết (Rạp)",
  vnPayPrice: "Giá bán (VNPAY)",
  vnPayTicketType: "Loại vé từ VNPAY",
};

/* Gọi Gemini */
async function askAI(prompt) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "openrouter/free",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.choices[0].message.content;
}

/* Format tiền */
function formatVND(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " VND";
}

/* API kiểm tra backend */
app.get("/", (req, res) => {
  res.send("Backend CGV đang chạy");
});

/* API test Supabase */
app.get("/api/test", async (req, res) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .limit(5);

  if (error) {
    return res.status(500).json({
      message: "Lỗi khi lấy dữ liệu từ Supabase",
      error: error.message,
    });
  }

  res.json(data);
});

/* Lấy mẫu dữ liệu nhỏ để test */
app.get("/api/sample", async (req, res) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .limit(20);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/* Đếm tổng số dòng */
async function getTotalRows() {
  const { count, error } = await supabase
    .from(TABLE_NAME)
    .select("*", {
      count: "estimated",
      head: true,
    });

  if (error) {
    console.log("getTotalRows error:", error);
    throw error;
  }

  return count || 0;
}

/* Lấy top theo 1 cột, xử lý theo từng trang */
async function getTopByColumn(columnName, limit = 10) {
  const pageSize = 10000;
  let from = 0;
  let to = pageSize - 1;
  let hasMore = true;

  const counter = {};

  while (hasMore) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`"${columnName}"`)
      .range(from, to);

    if (error) throw new Error(error.message);

    data.forEach((row) => {
      const key = row[columnName] || "Không rõ";
      counter[key] = (counter[key] || 0) + 1;
    });

    if (!data || data.length < pageSize) {
      hasMore = false;
    } else {
      from += pageSize;
      to += pageSize;
    }
  }

  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

async function getTopRevenueByColumn(columnName, limit = 10) {
  const pageSize = 10000;
  let from = 0;
  let to = pageSize - 1;
  let hasMore = true;

  const revenueMap = {};

  while (hasMore) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`"${columnName}", "${COLS.vnPayPrice}"`)
      .range(from, to);

    if (error) throw new Error(error.message);

    data.forEach((row) => {
      const key = row[columnName] || "Không rõ";
      const revenue = Number(row[COLS.vnPayPrice] || 0);

      revenueMap[key] = (revenueMap[key] || 0) + revenue;
    });

    if (!data || data.length < pageSize) {
      hasMore = false;
    } else {
      from += pageSize;
      to += pageSize;
    }
  }

  return Object.entries(revenueMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, revenue]) => ({
      name,
      revenue,
    }));
}

/* Tính doanh thu cơ bản theo từng trang */
async function getRevenueSummary() {
  const pageSize = 10000;
  let from = 0;
  let to = pageSize - 1;
  let hasMore = true;

  let totalRevenue = 0;
  let totalTickets = 0;
  let totalListedRevenue = 0;

  while (hasMore) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`"${COLS.vnPayPrice}", "${COLS.listedPrice}"`)
      .range(from, to);

    if (error) throw new Error(error.message);

    data.forEach((row) => {
      totalRevenue += Number(row[COLS.vnPayPrice] || 0);
      totalListedRevenue += Number(row[COLS.listedPrice] || 0);
      totalTickets += 1;
    });

    if (!data || data.length < pageSize) {
      hasMore = false;
    } else {
      from += pageSize;
      to += pageSize;
    }
  }

  return {
    totalRevenue,
    totalListedRevenue,
    totalTickets,
    averagePrice: totalTickets > 0 ? totalRevenue / totalTickets : 0,
  };
}

/* API summary để test nhanh */
app.get("/api/summary", async (req, res) => {
  try {

    const totalRows = await getTotalRows();

    res.json({
      success: true,
      totalRows
    });

  } catch (error) {

    console.log("SUMMARY ERROR:");
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo summary",
      error: error.message,
    });

  }
});

/* Phân loại câu hỏi đơn giản */
function detectIntent(message) {
  const text = message.toLowerCase();

  if (text.includes("bao nhiêu dòng") || text.includes("số dòng")) {
    return "total_rows";
  }

  if (text.includes("giá trung bình") || text.includes("giá vé trung bình")) {
    return "average_price";
  }

  if (text.includes("loại vé") && (text.includes("phổ biến") || text.includes("nhiều nhất"))) {
    return "top_ticket_types";
  }

  if (text.includes("doanh thu") && text.includes("phim")) {
    return "revenue_by_movie";
  }

  if (text.includes("doanh thu") && (text.includes("tỉnh") || text.includes("thành phố"))) {
    return "revenue_by_province";
  }

  if ((text.includes("phim") && (text.includes("top") || text.includes("nhiều nhất") || text.includes("phổ biến")))) {
    return "top_movies";
  }

  if ((text.includes("tỉnh") || text.includes("thành phố")) && (text.includes("top") || text.includes("phổ biến") || text.includes("nhiều nhất"))) {
    return "top_provinces";
  }

  if (text.includes("rạp") && (text.includes("top") || text.includes("nhiều nhất"))) {
    return "top_cinemas";
  }

  if (text.includes("doanh thu")) {
    return "revenue";
  }

  return "general";
}

/* API Chat */
async function searchRAG(userMessage) {
  try {
    const queryEmbedding = await createEmbedding(userMessage);

    const { data, error } = await supabase.rpc("match_rag_documents", {
      query_embedding: queryEmbedding,
      match_count: 3,
    });

    if (error) {
      console.log("RAG VECTOR ERROR:", error);
      return "";
    }

    if (!data || data.length === 0) {
      return "";
    }

    return data
      .map(
        (doc) =>
          `Tiêu đề: ${doc.title}\nNội dung: ${doc.content}\nĐộ liên quan: ${doc.similarity}`
      )
      .join("\n\n");
  } catch (error) {
    console.log("searchRAG error:", error);
    return "";
  }
}

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({
      reply: "Bạn chưa nhập câu hỏi.",
    });
  }

  try {
    const intent = detectIntent(userMessage);

    let dataForAI = "";

    if (intent === "total_rows") {
      const totalRows = await getTotalRows();

      dataForAI = `
Tổng số dòng dữ liệu ước tính: ${totalRows.toLocaleString("vi-VN")}
`;
    }

    else if (intent === "average_price") {
      const revenue = await getRevenueSummary();

      dataForAI = `
Tổng số vé/giao dịch: ${revenue.totalTickets.toLocaleString("vi-VN")}
Giá bán VNPAY trung bình: ${formatVND(revenue.averagePrice)}
Tổng doanh thu theo giá bán VNPAY: ${formatVND(revenue.totalRevenue)}
`;
    }

    else if (intent === "top_ticket_types") {
      const ticketTypes = await getTopByColumn(COLS.ticketType, 10);

      dataForAI = `
Top loại vé phổ biến:
${ticketTypes
  .map(
    (item, index) =>
      `${index + 1}. ${item.name}: ${item.count.toLocaleString("vi-VN")} giao dịch`
  )
  .join("\n")}
`;
    }

    else if (intent === "revenue_by_movie") {
      const topRevenueMovies = await getTopRevenueByColumn(COLS.movie, 10);

      dataForAI = `
Top phim theo doanh thu VNPAY:
${topRevenueMovies
  .map(
    (item, index) =>
      `${index + 1}. ${item.name}: ${formatVND(item.revenue)}`
  )
  .join("\n")}
`;
    }

    else if (intent === "revenue_by_province") {
      const topRevenueProvinces = await getTopRevenueByColumn(COLS.province, 10);

      dataForAI = `
Top tỉnh/thành theo doanh thu VNPAY:
${topRevenueProvinces
  .map(
    (item, index) =>
      `${index + 1}. ${item.name}: ${formatVND(item.revenue)}`
  )
  .join("\n")}
`;
    }

    else if (intent === "revenue") {
      const revenue = await getRevenueSummary();

      dataForAI = `
Tổng số vé/giao dịch: ${revenue.totalTickets.toLocaleString("vi-VN")}
Tổng doanh thu theo giá bán VNPAY: ${formatVND(revenue.totalRevenue)}
Tổng doanh thu theo giá niêm yết: ${formatVND(revenue.totalListedRevenue)}
Giá bán VNPAY trung bình: ${formatVND(revenue.averagePrice)}
`;
    }

    else if (intent === "top_movies") {
      const topMovies = await getTopByColumn(COLS.movie, 10);

      dataForAI = `
Top phim theo số lượng vé/giao dịch:
${topMovies
  .map(
    (item, index) =>
      `${index + 1}. ${item.name}: ${item.count.toLocaleString("vi-VN")} vé/giao dịch`
  )
  .join("\n")}
`;
    }

    else if (intent === "top_provinces") {
      const topProvinces = await getTopByColumn(COLS.province, 10);

      dataForAI = `
Top tỉnh/thành theo số lượng vé/giao dịch:
${topProvinces
  .map(
    (item, index) =>
      `${index + 1}. ${item.name}: ${item.count.toLocaleString("vi-VN")} vé/giao dịch`
  )
  .join("\n")}
`;
    }

    else if (intent === "top_cinemas") {
      const topCinemas = await getTopByColumn(COLS.cinema, 10);

      dataForAI = `
Top rạp theo số lượng vé/giao dịch:
${topCinemas
  .map(
    (item, index) =>
      `${index + 1}. ${item.name}: ${item.count.toLocaleString("vi-VN")} vé/giao dịch`
  )
  .join("\n")}
`;
    }

    else {
      const totalRows = await getTotalRows();
      const ragContext = await searchRAG(userMessage);

      dataForAI = `
Tổng số dòng dữ liệu ước tính: ${totalRows.toLocaleString("vi-VN")}

Câu hỏi này chưa khớp với nhóm phân tích số liệu cụ thể.
Hãy ưu tiên dùng kiến thức RAG nếu có liên quan.
`;

      const prompt = `
Bạn là chatbot phân tích dữ liệu CGV.

Kiến thức từ hệ thống RAG:
${ragContext}

Dữ liệu hiện có:
${dataForAI}

Câu hỏi người dùng:
${userMessage}

Yêu cầu:
- Trả lời bằng tiếng Việt.
- Ngắn gọn, rõ ràng.
- Ưu tiên dùng dữ liệu và kiến thức được cung cấp.
- Nếu không có dữ liệu thì nói rõ.
`;

      const botReply = await askAI(prompt);

      return res.json({
        intent,
        reply: botReply,
      });
    }

    const ragContext = await searchRAG(userMessage);

    const prompt = `
Bạn là chatbot phân tích dữ liệu CGV.

Kiến thức từ hệ thống RAG:
${ragContext}

Dữ liệu hiện có:
${dataForAI}

Câu hỏi người dùng:
${userMessage}

Yêu cầu:
- Trả lời bằng tiếng Việt.
- Ngắn gọn, rõ ràng.
- Ưu tiên dùng dữ liệu và kiến thức được cung cấp.
- Nếu không có dữ liệu thì nói rõ.
`;

    const botReply = await askAI(prompt);

    res.json({
      intent,
      reply: botReply,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);

    res.status(500).json({
      reply: "Lỗi chatbot hoặc lỗi khi lấy dữ liệu từ Supabase.",
      error: error.message,
    });
  }
});

app.post("/api/rag/embed", async (req, res) => {
  try {
    const { data: docs, error } = await supabase
      .from("rag_documents")
      .select("id, content")
      .is("embedding", null);

    if (error) throw error;

    for (const doc of docs) {
      const embedding = await createEmbedding(doc.content);

      const { error: updateError } = await supabase
        .from("rag_documents")
        .update({
          embedding: embedding,
        })
        .eq("id", doc.id);

      if (updateError) throw updateError;
    }

    res.json({
      success: true,
      embedded: docs.length,
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