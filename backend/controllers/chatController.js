const detectIntent = require("../utils/detechIntent");
const { formatVND } = require("../utils/format");
const { askAI } = require("../services/aiService");
const { searchRAG } = require("../services/ragService");
const { loadDocs } = require("../services/docService");
const { extractMovieName } = require("../services/movieService");

const {
  getTotalRows,
  getOverviewStats,
  getTopMoviesStats,
  getTopProvincesStats,
  getTopCinemasStats,
  getTopTicketTypesStats,
  getTopMovieRevenue,
  getTopProvinceRevenue,
  getTopMoviesByProvince,
  getTopCinemasByProvince,
  getMovieMonthlyStats,
  getMarketingPriorityProvinces,
  getMovieBusinessFocus,
  getCinemaExpansionCandidates,
  getTicketBusinessValue,
  getHighRevenueLowTransactionProvinces,
  getPromotionByProvince,
  getMonthlyStats,
  getMonthStats,
} = require("../services/statsService");

const PROVINCES = require("../utils/provinces");

function extractProvince(message) {
  const text = message.toLowerCase();

  const province = PROVINCES.find((p) => text.includes(p));

  if (!province) return "";

  if (province === "hcm" || province === "sài gòn") {
    return "Hồ Chí Minh";
  }

  if (province === "huế") {
    return "Thừa Thiên Huế";
  }

  if (province === "nha trang") {
    return "Khánh Hòa";
  }

  if (province === "đà lạt") {
    return "Lâm Đồng";
  }

  if (province === "vũng tàu") {
    return "Bà Rịa - Vũng Tàu";
  }

  return province
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractMonthNumber(message) {
  const text = message.toLowerCase();

  const match = text.match(/tháng\s*(\d{1,2})/);

  if (!match) return null;

  const month = Number(match[1]);

  if (month < 1 || month > 12) return null;

  return month;
}

/* API kiểm tra backend */
async function chat(req, res) {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({
      reply: "Bạn chưa nhập câu hỏi.",
    });
  }

  try {
    const intent = detectIntent(userMessage);
    const docsContent = loadDocs();
    let dataForAI = "";

    if (intent === "forecast") {
      dataForAI = `
    Dữ liệu hiện tại chỉ là dữ liệu giao dịch lịch sử.
    Hệ thống chưa có mô hình dự báo doanh thu tương lai.
    Vì vậy không đủ cơ sở để dự báo doanh thu năm sau.
    `;
    }

    else if (intent === "total_rows") {
      const overview = await getOverviewStats();
      dataForAI = `
    Tổng số giao dịch/vé trong dữ liệu: ${Number(overview.transaction_count).toLocaleString("vi-VN")}
    `;
    }

    else if (intent === "average_price") {
      const overview = await getOverviewStats();
      dataForAI = `
    Giá bán VNPAY trung bình: ${formatVND(overview.avg_price)}
    Tổng số giao dịch: ${Number(overview.transaction_count).toLocaleString("vi-VN")}
    Tổng doanh thu VNPAY: ${formatVND(overview.total_revenue)}
    `;
    }

    else if (intent === "top_ticket_types") {
      const ticketTypes = await getTopTicketTypesStats(10);
      dataForAI = `
    Top loại vé phổ biến:
    ${ticketTypes.map((item, index) =>
      `${index + 1}. ${item.ticket_type}: ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    `;
    }

    else if (intent === "revenue_by_movie") {
      const topMovies = await getTopMovieRevenue(10);
      dataForAI = `
    Top phim theo doanh thu VNPAY:
    ${topMovies.map((item, index) =>
      `${index + 1}. ${item.movie_name}: ${formatVND(item.total_revenue)}`
    ).join("\n")}
    `;
    }

    else if (intent === "revenue_by_province") {
      const topProvinces = await getTopProvinceRevenue(10);
      dataForAI = `
    Top tỉnh/thành theo doanh thu VNPAY:
    ${topProvinces.map((item, index) =>
      `${index + 1}. ${item.province_name}: ${formatVND(item.total_revenue)}`
    ).join("\n")}
    `;
    }

    else if (intent === "revenue") {
      const overview = await getOverviewStats();
      dataForAI = `
    Tổng số giao dịch: ${Number(overview.transaction_count).toLocaleString("vi-VN")}
    Tổng doanh thu theo giá bán VNPAY: ${formatVND(overview.total_revenue)}
    Tổng doanh thu theo giá niêm yết: ${formatVND(overview.total_listed_revenue)}
    Giá bán VNPAY trung bình: ${formatVND(overview.avg_price)}
    Chiết khấu trung bình: ${(Number(overview.avg_discount_rate || 0) * 100).toFixed(2)}%
    `;
    }

    else if (intent === "top_movies") {
      const topMovies = await getTopMoviesStats(10);
      dataForAI = `
    Top phim theo số lượng giao dịch:
    ${topMovies.map((item, index) =>
      `${index + 1}. ${item.movie_name}: ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    `;
    }

    else if (intent === "top_provinces") {
      const topProvinces = await getTopProvincesStats(10);
      dataForAI = `
    Top tỉnh/thành theo số lượng giao dịch:
    ${topProvinces.map((item, index) =>
      `${index + 1}. ${item.province_name}: ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    `;
    }

    else if (intent === "top_cinemas") {
      const topCinemas = await getTopCinemasStats(10);
      dataForAI = `
    Top rạp theo số lượng giao dịch:
    ${topCinemas.map((item, index) =>
      `${index + 1}. ${item.cinema_name}: ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    `;
    }

    else if (intent === "discount") {
      dataForAI = `
    Dữ liệu có thể phân tích chênh lệch giữa giá niêm yết và giá bán VNPAY.
    Nếu giá bán VNPAY thấp hơn giá niêm yết, phần chênh lệch có thể phản ánh ưu đãi, khuyến mãi hoặc chính sách giảm giá.
    `;
    }

    else if (intent === "price_compare") {
      dataForAI = `
    Giá niêm yết là giá vé gốc do rạp công bố.
    Giá bán VNPAY là số tiền khách hàng thực tế thanh toán qua VNPAY.
    So sánh hai chỉ số này giúp đánh giá mức ưu đãi và hiệu quả chính sách giá.
    `;
    }

    else if (intent === "dashboard_explain") {
      dataForAI = `
    Dashboard CGV/VNPAY hỗ trợ theo dõi doanh thu, số lượng giao dịch, giá vé trung bình, top phim, top tỉnh/thành, top rạp và loại vé phổ biến.
    Các chỉ số này giúp người dùng hiểu hiệu quả bán vé theo nhiều góc nhìn khác nhau.
    `;
    }

    else if (intent === "business_insight") {
      dataForAI = `
    Dựa trên các chỉ số BI, chatbot có thể hỗ trợ ra quyết định kinh doanh bằng cách chỉ ra phim, khu vực, rạp hoặc loại vé có hiệu quả cao.
    Tuy nhiên hệ thống chỉ nên đưa ra gợi ý dựa trên dữ liệu hiện có, không tự suy đoán nguyên nhân nếu chưa có dữ liệu bổ sung.
    `;
    }

    else if (intent === "data_limit") {
      dataForAI = `
    Dữ liệu hiện tại chỉ phản ánh các giao dịch có trong bộ dữ liệu CGV/VNPAY.
    Dữ liệu có thể chưa bao gồm toàn bộ kênh bán vé, thông tin khách hàng, số lượng vé mỗi hóa đơn hoặc các yếu tố thị trường bên ngoài.
    `;
    }

    else if (intent === "top_movie_by_province") {
      const provinceName = extractProvince(userMessage);

      if (!provinceName) {
        dataForAI = "Chưa xác định được tỉnh/thành trong câu hỏi.";
      } else {
        const rows = await getTopMoviesByProvince(provinceName, 10);

        dataForAI = `
    Top phim theo doanh thu tại ${provinceName}:
    ${rows.map((item, index) =>
      `${index + 1}. ${item.movie_name}: ${formatVND(item.total_revenue)} - ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    `;
      }
    }

    else if (intent === "top_cinema_by_province") {
      const provinceName = extractProvince(userMessage);

      if (!provinceName) {
        dataForAI = "Chưa xác định được tỉnh/thành trong câu hỏi.";
      } else {
        const rows = await getTopCinemasByProvince(provinceName, 10);

        dataForAI = `
    Top rạp theo doanh thu tại ${provinceName}:
    ${rows.map((item, index) =>
      `${index + 1}. ${item.cinema_name}: ${formatVND(item.total_revenue)} - ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    `;
      }
    }

    else if (intent === "movie_month_trend") {
      const movieName = await extractMovieName(userMessage);

      if (!movieName) {
        dataForAI = "Chưa xác định được tên phim trong câu hỏi.";
      } else {
        const rows = await getMovieMonthlyStats(movieName, 12);

        dataForAI = `
    Xu hướng doanh thu theo tháng của phim ${movieName}:
    ${rows.map((item, index) =>
      `${index + 1}. ${item.month}: ${formatVND(item.total_revenue)} - ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    `;
      }
    }

    else if (intent === "marketing_priority") {
      const rows = await getMarketingPriorityProvinces(5);
      dataForAI = `
    Các tỉnh/thành nên ưu tiên marketing dựa trên doanh thu VNPAY:
    ${rows.map((item, index) =>
      `${index + 1}. ${item.province_name}: ${formatVND(item.total_revenue)} - ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    Yêu cầu phân tích:
    - Ưu tiên các tỉnh có doanh thu và lượng giao dịch cao.
    - Đưa ra nhận xét và gợi ý hành động ngắn.
    `;
    }

    else if (intent === "movie_business_focus") {
      const rows = await getMovieBusinessFocus(5);
      dataForAI = `
    Nhóm/phim đang mang lại doanh thu cao nhất:
    ${rows.map((item, index) =>
      `${index + 1}. ${item.movie_name}: ${formatVND(item.total_revenue)} - ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    Yêu cầu phân tích:
    - Xác định nhóm phim/phim nên được ưu tiên về suất chiếu hoặc truyền thông.
    - Không suy đoán nguyên nhân ngoài dữ liệu.
    `;
    }

    else if (intent === "cinema_expansion") {
      const rows = await getCinemaExpansionCandidates(10);
      dataForAI = `
    Các tỉnh/thành có tiềm năng xem xét mở rộng rạp hoặc tăng hợp tác:
    ${rows.map((item, index) =>
      `${index + 1}. ${item.province_name}: ${formatVND(item.total_revenue)} - ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    Yêu cầu phân tích:
    - Chỉ xem đây là gợi ý ban đầu dựa trên doanh thu và giao dịch.
    - Cần nói rõ rằng quyết định mở rộng rạp còn cần thêm dữ liệu dân số, chi phí mặt bằng và đối thủ.
    `;
    }

    else if (intent === "ticket_business_value") {
      const rows = await getTicketBusinessValue(5);
      dataForAI = `
    Loại vé tạo doanh thu tốt nhất:
    ${rows.map((item, index) =>
      `${index + 1}. ${item.ticket_type}: ${formatVND(item.total_revenue)} - ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    Yêu cầu phân tích:
    - Nêu loại vé hiệu quả nhất theo doanh thu.
    - Gợi ý cách tận dụng loại vé này trong kinh doanh.
    `;
    }

    else if (intent === "high_revenue_low_transaction") {
      const rows = await getHighRevenueLowTransactionProvinces(10);
      dataForAI = `
    Các tỉnh/thành có giá trị trung bình/giao dịch cao:
    ${rows.map((item, index) =>
      `${index + 1}. ${item.province_name}: Giá TB ${formatVND(item.avg_price)} - Doanh thu ${formatVND(item.total_revenue)} - ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    Yêu cầu phân tích:
    - Tìm các tỉnh có giá trị trung bình cao nhưng không nhất thiết có giao dịch cao nhất.
    - Đây là tín hiệu để xem xét phân khúc khách hàng có giá trị cao.
    `;
    }

    else if (intent === "promotion_analysis") {
      const rows = await getPromotionByProvince(10);
      dataForAI = `
    Tỷ lệ sử dụng khuyến mãi theo tỉnh:

    ${rows.map((item,index)=>
    `${index+1}. ${item.province_name}: ${Number(item.promo_rate).toFixed(2)}%`
    ).join("\n")}
    Yêu cầu:
    - Phân tích tỉnh nào phản hồi tốt nhất với chương trình khuyến mãi.
    - Đưa ra nhận xét marketing.
    `;
    }

    else if (intent === "monthly_revenue") {
      const monthNumber = extractMonthNumber(userMessage);

      if (!monthNumber) {
        const rows = await getMonthlyStats();

        dataForAI = `
    Doanh thu theo tất cả các tháng:
    ${rows.map((item) =>
      `Tháng ${item.month_number}: ${formatVND(item.total_revenue)} - ${Number(item.transaction_count).toLocaleString("vi-VN")} giao dịch`
    ).join("\n")}
    `;
      } else {
        const currentMonth = await getMonthStats(monthNumber);
        const previousMonthNumber = monthNumber - 1;

        let previousText = "Không có dữ liệu tháng trước để so sánh.";

        if (previousMonthNumber >= 1) {
          const previousMonth = await getMonthStats(previousMonthNumber);

          const changeRate =
            ((Number(currentMonth.total_revenue) - Number(previousMonth.total_revenue)) /
              Number(previousMonth.total_revenue)) * 100;

          previousText = `
    Doanh thu tháng ${previousMonthNumber}: ${formatVND(previousMonth.total_revenue)}
    Mức thay đổi so với tháng ${previousMonthNumber}: ${changeRate.toFixed(2)}%
    `;
        }
        dataForAI = `
    Doanh thu tháng ${monthNumber}: ${formatVND(currentMonth.total_revenue)}
    Số giao dịch tháng ${monthNumber}: ${Number(currentMonth.transaction_count).toLocaleString("vi-VN")}
    ${previousText}
    `;
      }
    }

        else {
      const totalRows = await getTotalRows();

      dataForAI = `
      Tổng số dòng dữ liệu ước tính: ${totalRows.toLocaleString("vi-VN")}

      Câu hỏi này chưa khớp với nhóm phân tích số liệu cụ thể.
      Hãy ưu tiên dùng kiến thức RAG nếu có liên quan.
      `;
          }

    let ragContext = "";
    if (intent === "general" || intent === "forecast") {
      ragContext = await searchRAG(userMessage);
    }

    const prompt = `
    Bạn là chatbot phân tích dữ liệu CGV/VNPAY trong đề tài ứng dụng BI hỗ trợ ra quyết định kinh doanh.

    Kiến thức từ file tài liệu Markdown:
    ${docsContent}
    
    Kiến thức từ hệ thống RAG:
    ${ragContext}

    Dữ liệu hiện có:
    ${dataForAI}

    Câu hỏi người dùng:
    ${userMessage}

    Yêu cầu trả lời:
    - Trả lời hoàn toàn bằng tiếng Việt.
    - Bắt đầu bằng cụm: "Theo dữ liệu hiện có, ..."
    - Trả lời ngắn gọn, rõ ràng, tự nhiên.
    - Mỗi ý chính xuống dòng riêng.
    - Nếu có danh sách top, trình bày dạng từng dòng hoặc đánh số.
    - Nếu là câu hỏi kinh doanh, trình bày theo 2 phần: "Nhận xét:" và "Gợi ý:".
    - Không dùng tiếng Anh.
    - Không lặp lại cùng một ý.
    - Không dùng từ "Ví dụ" nếu không thật sự đưa ví dụ.
    - Không tự suy đoán ngoài dữ liệu.
    - Không khẳng định nguyên nhân nếu dữ liệu chưa chứng minh.
    - Nếu dữ liệu không đủ để kết luận, hãy nói: "Dữ liệu hiện tại chưa đủ để kết luận."
    - Không dùng LaTeX.
    - Không dùng ký hiệu \\boxed{}.
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
};

module.exports = {
  chat,
};