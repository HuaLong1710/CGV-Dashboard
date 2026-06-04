const openai = require("../config/openai");

/* Gọi API Chat */
async function askAI(prompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `
Bạn là trợ lý BI phân tích dữ liệu CGV/VNPAY.
Quy tắc:
- Chỉ dùng dữ liệu được cung cấp.
- Không bịa số liệu.
- Trả lời bằng tiếng Việt.
- Mỗi ý xuống dòng riêng.
- Không dùng tiếng Anh.
- Không lặp lại ý.
- Nếu thiếu dữ liệu thì nói rõ.
        `,
      },

      {
        role: "user",
        content: prompt,
      },
    ],
  });
  
  return completion.choices[0].message.content;
}

module.exports = {
  askAI,
};