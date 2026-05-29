require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const TABLE_NAME = process.env.TABLE_NAME || "CGV";
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
  listedPrice: "Giá niêm yết (Rap)",
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

  if (text.includes("tổng doanh thu") || text.includes("doanh thu")) {
    return "revenue";
  }

  if (text.includes("phim") && (text.includes("nhiều nhất") || text.includes("top"))) {
    return "top_movies";
  }

  if (
    (text.includes("tỉnh") || text.includes("thành phố")) &&
    (text.includes("nhiều nhất") || text.includes("top"))
  ) {
    return "top_provinces";
  }

  if (text.includes("rạp") && (text.includes("nhiều nhất") || text.includes("top"))) {
    return "top_cinemas";
  }

  return "general";
}

/* API Chat */
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

    if (intent === "revenue") {
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
${topMovies.map((item, index) => `${index + 1}. ${item.name}: ${item.count.toLocaleString("vi-VN")} vé/giao dịch`).join("\n")}
`;
    }

    else if (intent === "top_provinces") {
      const topProvinces = await getTopByColumn(COLS.province, 10);

      dataForAI = `
Top tỉnh/thành theo số lượng vé/giao dịch:
${topProvinces.map((item, index) => `${index + 1}. ${item.name}: ${item.count.toLocaleString("vi-VN")} vé/giao dịch`).join("\n")}
`;
    }

    else if (intent === "top_cinemas") {
      const topCinemas = await getTopByColumn(COLS.cinema, 10);

      dataForAI = `
Top rạp theo số lượng vé/giao dịch:
${topCinemas.map((item, index) => `${index + 1}. ${item.name}: ${item.count.toLocaleString("vi-VN")} vé/giao dịch`).join("\n")}
`;
    }

    else {
      const totalRows = await getTotalRows();
      const topMovies = await getTopByColumn(COLS.movie, 5);
      const topProvinces = await getTopByColumn(COLS.province, 5);

      dataForAI = `
Tổng số dòng dữ liệu: ${totalRows.toLocaleString("vi-VN")}

Top 5 phim theo số lượng vé/giao dịch:
${topMovies.map((item, index) => `${index + 1}. ${item.name}: ${item.count.toLocaleString("vi-VN")}`).join("\n")}

Top 5 tỉnh/thành theo số lượng vé/giao dịch:
${topProvinces.map((item, index) => `${index + 1}. ${item.name}: ${item.count.toLocaleString("vi-VN")}`).join("\n")}
`;
    }

    const prompt = `
Bạn là chatbot phân tích dữ liệu bán vé xem phim CGV.

Dữ liệu truy vấn được từ Supabase:
${dataForAI}

Câu hỏi của người dùng:
${userMessage}

Yêu cầu:
- Trả lời bằng tiếng Việt.
- Ngắn gọn, rõ ràng.
- Chỉ dựa vào dữ liệu được cung cấp.
- Nếu dữ liệu chưa đủ để kết luận, hãy nói rõ.
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

/* Start Server */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});