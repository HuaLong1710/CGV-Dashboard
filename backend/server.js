require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

/* Cache dữ liệu */
let cgvRows = [];
let cgvSummary = "";

/* Đọc dữ liệu CGV */
function readCGVData() {
  return new Promise((resolve, reject) => {

    const rows = [];
    const filePath = path.join(__dirname, "data", "cgv.csv");

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => {

        console.log("Số dòng CSV đọc được:", rows.length);
        console.log("Cột CSV:", Object.keys(rows[0] || {}));
        console.log("Dòng đầu tiên:", rows[0]);

        resolve(rows);

      })
      .on("error", reject);

  });
}

/* Tóm tắt dữ liệu CGV */
function summarizeData(rows) {

  let totalRevenue = 0;
  let totalTickets = 0;

  const movieRevenue = {};
  const provinceRevenue = {};

  rows.forEach(row => {

    const revenue =
      Number(
        String(row["Giá bán (VNPAY)"] || 0)
          .replace(/[^\d]/g, "")
      );

    const movie =
      row["Tên Phim"] || "Không rõ";

    const province =
      row["Tỉnh thành"] || "Không rõ";

    totalRevenue += revenue;
    totalTickets += 1;

    movieRevenue[movie] =
      (movieRevenue[movie] || 0) + revenue;

    provinceRevenue[province] =
      (provinceRevenue[province] || 0) + revenue;

  });

  const topMovie =
    Object.entries(movieRevenue)
      .sort((a, b) => b[1] - a[1])[0];

  const topProvince =
    Object.entries(provinceRevenue)
      .sort((a, b) => b[1] - a[1])[0];

  return `
Tổng doanh thu: ${totalRevenue.toLocaleString("vi-VN")} VND
Tổng số vé bán: ${totalTickets.toLocaleString("vi-VN")}
Phim doanh thu cao nhất: ${topMovie ? topMovie[0] : "Không có dữ liệu"} - ${topMovie ? topMovie[1].toLocaleString("vi-VN") : 0} VND
Tỉnh thành doanh thu cao nhất: ${topProvince ? topProvince[0] : "Không có dữ liệu"} - ${topProvince ? topProvince[1].toLocaleString("vi-VN") : 0} VND
`;

}

/* API Chat */
app.post("/chat", async (req, res) => {

  const userMessage = req.body.message;

  try {

    /* Dùng dữ liệu cache */
    const dataSummary = cgvSummary;

    /* Prompt cho Gemini */
    const prompt = `
Bạn là chatbot phân tích dữ liệu bán vé xem phim CGV.

Dữ liệu hiện tại:
${dataSummary}

Hãy trả lời dựa trên dữ liệu trên.
Nếu người dùng hỏi ngoài dữ liệu thì hãy trả lời ngắn gọn.

Câu hỏi:
${userMessage}
`;

    /* Gọi Gemini API */
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }
    );

    /* Lấy phản hồi */
    const botReply =
      response.data.candidates[0].content.parts[0].text;

    /* Trả dữ liệu */
    res.json({
      reply: botReply
    });

  } catch (error) {

    console.log(error.response?.data || error.message);

    res.status(500).json({
      reply: "Lỗi chatbot"
    });

  }

});

/* Start Server */
async function startServer() {

  try {

    /* Đọc CSV 1 lần */
    cgvRows = await readCGVData();

    /* Cache summary */
    cgvSummary = summarizeData(cgvRows);

    console.log("Đã load dữ liệu CGV khi khởi động server.");
    console.log("Số dòng:", cgvRows.length);

    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });

  } catch (error) {

    console.log("Lỗi khi đọc CSV:", error.message);

  }

}

startServer();