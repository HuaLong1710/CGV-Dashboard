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

  if (text.includes("doanh thu tăng") || text.includes("do giá tăng") || text.includes("do số vé tăng") || text.includes("giá bán trung bình tăng") || text.includes("tăng do giá") || text.includes("tăng do số vé")) {
    return "growth_driver";
  }

  if ((text.includes("giá bán trung bình") && text.includes("giá niêm yết trung bình")) || (text.includes("giá bán") && text.includes("giá niêm yết") && (text.includes("biến động") || text.includes("cùng chiều") || text.includes("ngược chiều")))) {
    return "price_trend_compare";
  }

  if (text.includes("thời lượng phim") || text.includes("runtime") || (text.includes("thời lượng") && text.includes("doanh thu"))) {
    return "runtime_analysis";
  }

  if ((text.includes("normal") || text.includes("resell") || text.includes("promotion") || text.includes("khuyến mãi")) && (text.includes("nhóm phim") || text.includes("thể loại") || text.includes("genre") || text.includes("phim"))) {
    return "ticket_genre_analysis";
  }

  if (text.includes("độ tuổi") || text.includes("phân loại độ tuổi") || text.includes("age")) {
    return "age_rating_analysis";
  }

  if (text.includes("chiết khấu trung bình") || text.includes("mức giảm giá trung bình") || (text.includes("chiết khấu") && text.includes("hợp lý"))) {
    return "avg_discount";
  }

  if ((text.includes("giá bán trung bình") || text.includes("giá trung bình") || text.includes("giá vé trung bình") || text.includes("mức giá")) && (text.includes("khu vực") || text.includes("vùng") || text.includes("vùng miền") || text.includes("miền"))) {
    return "price_region_analysis";
  }

  if ((text.includes("giá bán trung bình") || text.includes("giá trung bình") || text.includes("giá vé trung bình")) && (text.includes("tỉnh") || text.includes("thành phố"))) {
    return "province_price_analysis";
  }

  if (text.includes("ổn định giá") || text.includes("ổn định nhất") || text.includes("mức giá ổn định") || text.includes("phân tán giá") || text.includes("độ phân tán") || text.includes("biến động giá") || text.includes("giá trị bất thường") || text.includes("chiến lược giá") || text.includes("áp dụng giá khác nhau") || text.includes("giá theo khu vực")) {
    return "price_region_analysis";
  }

  if (text.includes("rạp nào") || text.includes("rạp có doanh thu") || text.includes("rạp nổi bật") || text.includes("số vé bán nổi bật") || text.includes("rạp bán tốt nhất") || text.includes("top rạp")) {
    return "cinema_analysis";
  }

  if (text.includes("phim") && (text.includes("ở") || text.includes("tại")) && containsProvince(text)) {
    return "top_movie_by_province";
  }

  if (text.includes("rạp") && (text.includes("ở") || text.includes("tại")) && containsProvince(text)) {
    return "top_cinema_by_province";
  }

  if (text.includes("loại vé") && (text.includes("theo tháng") || text.includes("từng giai đoạn") || text.includes("giai đoạn") || text.includes("theo thời gian") || text.includes("tăng mạnh"))) {
    return "ticket_month_analysis";
  }

  if (text.includes("loại vé nào được dùng chủ đạo") || text.includes("loại vé chủ đạo") || text.includes("loại vé theo tỉnh") || text.includes("loại vé theo khu vực")) {
    return "ticket_region_analysis";
  }

  if (text.includes("loại vé") && (text.includes("doanh thu tốt nhất") || text.includes("hiệu quả nhất") || text.includes("tạo doanh thu tốt"))) {
    return "ticket_business_value";
  }

  if (text.includes("loại vé") && (text.includes("phổ biến") || text.includes("nhiều nhất") || text.includes("top"))) {
    return "top_ticket_types";
  }

  if (text.includes("ngày nào") && (text.includes("nhu cầu cao") || text.includes("bán vé cao") || text.includes("nhiều vé") || text.includes("cao nhất"))) {
    return "highest_weekday";
  }

  if (text.includes("ngày nào") && (text.includes("nhu cầu thấp") || text.includes("bán vé thấp") || text.includes("ít vé") || text.includes("thấp nhất"))) {
    return "lowest_weekday";
  }

  if (text.includes("ngày trong tuần") || text.includes("theo thứ") || text.includes("theo ngày")) {
    return "weekday_analysis";
  }

  if (text.includes("cao điểm") || text.includes("tháng cao nhất") || text.includes("giai đoạn cao điểm")) {
    return "highest_month";
  }

  if (text.includes("thấp điểm") || text.includes("tháng thấp nhất") || text.includes("giai đoạn thấp điểm")) {
    return "lowest_month";
  }

  if (text.includes("tháng") && text.includes("doanh thu") && !text.includes("phim nào") && !text.includes("của phim")) {
    return "monthly_revenue";
  }

  if (text.includes("phim") && text.includes("tháng")) {
    return "movie_month_trend";
  }

  if (text.includes("tỷ trọng") && text.includes("phim")) {
    return "movie_revenue_share";
  }

  if (text.includes("doanh thu/ngày") || text.includes("doanh thu mỗi ngày") || text.includes("ngày chiếu") || text.includes("chiếu ngắn") || text.includes("chiếu dài")) {
    return "movie_efficiency";
  }

  if (text.includes("đặt vé sớm") || text.includes("tỷ lệ đặt vé sớm") || text.includes("đặt trước")) {
    return "early_booking";
  }

  if (text.includes("phim việt nam") || text.includes("phim việt") || text.includes("phim nước ngoài") || text.includes("nước ngoài")) {
    return "movie_category_analysis";
  }

  if (text.includes("ngoại lệ") || text.includes("outlier") || text.includes("bất thường")) {
    return "movie_outlier";
  }

  if (text.includes("nhóm phim") || text.includes("phim nào đang mang lại doanh thu") || text.includes("phim nên tập trung")) {
    return "movie_business_focus";
  }

  if (text.includes("phim") && text.includes("doanh thu")) {
    return "revenue_by_movie";
  }

  if (text.includes("phim") && (text.includes("phổ biến") || text.includes("nhiều nhất") || text.includes("top"))) {
    return "top_movies";
  }

  if (text.includes("khu vực") && text.includes("doanh thu lớn nhất")) {
    return "top_region";
  }

  if (text.includes("miền nào doanh thu cao nhất")) {
    return "top_region";
  }

  if (text.includes("miền") && (text.includes("doanh thu") || text.includes("vùng"))) {
    return "region_analysis";
  }

  if ((text.includes("tỉnh") || text.includes("thành phố")) && text.includes("doanh thu")) {
    return "revenue_by_province";
  }

  if ((text.includes("tỉnh") || text.includes("thành phố")) && (text.includes("nhiều giao dịch") || text.includes("nhiều nhất") || text.includes("top") || text.includes("phổ biến"))) {
    return "top_provinces";
  }

  if (text.includes("rạp") && (text.includes("nhiều nhất") || text.includes("top") || text.includes("phổ biến"))) {
    return "top_cinemas";
  }

  if (text.includes("ưu tiên marketing") || text.includes("tập trung marketing") || text.includes("chiến dịch marketing")) {
    return "marketing_priority";
  }

  if (text.includes("marketing") || text.includes("nên quảng bá ở đâu") || text.includes("nên đầu tư ở đâu")) {
    return "marketing_opportunity";
  }

  if (text.includes("tiềm năng mở rộng rạp") || text.includes("mở rộng rạp") || text.includes("mở thêm rạp")) {
    return "cinema_expansion";
  }

  if (text.includes("doanh thu cao") && (text.includes("giao dịch thấp") || text.includes("lượng giao dịch thấp"))) {
    return "high_revenue_low_transaction";
  }

  if (text.includes("săn deal") || text.includes("khuyến mãi") || text.includes("promotion") || text.includes("promo")) {
    return "promotion_analysis";
  }

  if (text.includes("vnpay") && text.includes("giá niêm yết")) {
    return "price_compare";
  }

  if (text.includes("giá trung bình") || text.includes("giá vé trung bình") || text.includes("vnpay trung bình") || text.includes("giá bán trung bình") || text.includes("giá bán trên vnpay") || text.includes("giá trung bình trên vnpay") || text.includes("giá bán vnpay") || (text.includes("vnpay") && text.includes("mức nào"))) {
    return "average_price";
  }

  if (text.includes("chiết khấu") || text.includes("giảm giá") || text.includes("khuyến mãi")) {
    return "discount";
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

  return "general";
}

module.exports = detectIntent;