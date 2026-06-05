const PROVINCES = require("./provinces");

function containsProvince(text) {
  return PROVINCES.some((province) => text.includes(province));
}

/* Phân loại câu hỏi đơn giản */
function detectIntent(message) {
  const text = message.toLowerCase();

  if (text.includes("dự báo") || text.includes("forecast") || text.includes("năm sau")) {
    return "forecast";
  }

  if (text.includes("bao nhiêu dòng") || text.includes("số dòng") || text.includes("bao nhiêu giao dịch") || text.includes("số giao dịch") || text.includes("bao nhiêu vé") || text.includes("số vé")) {
    return "total_rows";
  }

  if (text.includes("giá trung bình") || text.includes("giá vé trung bình") || text.includes("vnpay trung bình")) {
    return "average_price";
  }

  if (text.includes("phim") && (text.includes("ở") || text.includes("tại")) && containsProvince(text)) {
    return "top_movie_by_province";
  }

  if (text.includes("rạp") && (text.includes("ở") || text.includes("tại")) && containsProvince(text)) {
    return "top_cinema_by_province";
  }

  if (text.includes("tháng") && text.includes("doanh thu") && !text.includes("phim nào") && !text.includes("của phim")) {
    return "monthly_revenue";
  }

  if (text.includes("phim") && text.includes("tháng")) {
    return "movie_month_trend";
  }

  if (text.includes("loại vé") && (text.includes("phổ biến") || text.includes("nhiều nhất") || text.includes("top"))) {
    return "top_ticket_types";
  }

  if (text.includes("phim") && text.includes("doanh thu")) {
    return "revenue_by_movie";
  }

  if ((text.includes("tỉnh") || text.includes("thành phố")) && text.includes("doanh thu")) {
    return "revenue_by_province";
  }

  if (text.includes("phim") && (text.includes("phổ biến") || text.includes("nhiều nhất") || text.includes("top"))) {
    return "top_movies";
  }

  if ((text.includes("tỉnh") || text.includes("thành phố")) && (text.includes("nhiều giao dịch") || text.includes("nhiều nhất") || text.includes("top") || text.includes("phổ biến"))) {
    return "top_provinces";
  }

  if (text.includes("rạp") && (text.includes("nhiều nhất") || text.includes("top") || text.includes("phổ biến"))) {
    return "top_cinemas";
  }

  if (text.includes("chiết khấu") || text.includes("giảm giá") || text.includes("khuyến mãi")) {
    return "discount";
  }

  if (text.includes("vnpay") && text.includes("giá niêm yết")) {
    return "price_compare";
  }

  if (text.includes("dashboard") || text.includes("biểu đồ") || text.includes("chỉ số")) {
    return "dashboard_explain";
  }

  if (text.includes("hỗ trợ ra quyết định") || text.includes("kinh doanh") || text.includes("đề xuất")) {
    return "business_insight";
  }

  if (text.includes("ngoài dữ liệu") || text.includes("giới hạn dữ liệu")) {
    return "data_limit";
  }

  if (text.includes("doanh thu")) {
    return "revenue";
  }

  if (text.includes("ưu tiên marketing") || text.includes("tập trung marketing") || text.includes("chiến dịch marketing")) {
    return "marketing_priority";
  }

  if (text.includes("nhóm phim") || text.includes("phim nào đang mang lại doanh thu") || text.includes("phim nên tập trung")) {
    return "movie_business_focus";
  }

  if (text.includes("tiềm năng mở rộng rạp") || text.includes("mở rộng rạp") || text.includes("mở thêm rạp")) {
    return "cinema_expansion";
  }

  if (text.includes("loại vé") && (text.includes("doanh thu tốt nhất") || text.includes("hiệu quả nhất") || text.includes("tạo doanh thu tốt")) ) {
    return "ticket_business_value";
  }

  if (text.includes("doanh thu cao") && (text.includes("giao dịch thấp") || text.includes("lượng giao dịch thấp")) ) {
    return "high_revenue_low_transaction";
  }

  if (text.includes("săn deal") || text.includes("khuyến mãi") || text.includes("promotion") || text.includes("promo")) {
    return "promotion_analysis";
  }

  return "general";
}

module.exports = detectIntent;