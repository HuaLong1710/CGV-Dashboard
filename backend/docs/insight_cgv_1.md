
---

# BÁO CÁO INSIGHT PHÂN TÍCH DỮ LIỆU BÁN VÉ CGV (VNPAY)

## 1. Insight 1: Phân Tích Theo Tỉnh Thành

### Mô tả hình ảnh trong Dashboard:
*   **Biểu đồ Scatter (Biểu đồ phân tán):** Thể hiện mối tương quan giữa giá vé trung bình và doanh thu của từng rạp, được phân loại theo 3 nhóm: Hà Nội, TP.HCM và Tỉnh thành khác.
*   **Biểu đồ Boxplot (Biểu đồ hộp):** Hiển thị khoảng phân bố giá vé, giá trị trung vị (Median), trung bình (Mean) và các điểm ngoại lai (Outliers) trên 200.000đ của 3 khu vực.

### Phân tích chi tiết:
*   **Khu vực Hà Nội:** Là nơi có **doanh thu lớn nhất**, chủ yếu áp dụng chiến lược **vé Resell** (chiếm chủ đạo) với mức chiết khấu khoảng 26%. Giá vé tại đây khá đồng đều giữa các rạp, dù giá niêm yết trung bình cao (khoảng 120k cho vé Normal).
*   **Khu vực TP. Hồ Chí Minh:** Doanh thu đứng thứ hai sau Hà Nội. Tuy nhiên, giá bán trung bình của VNPAY tại đây cao hơn Hà Nội và có sự phân tán lớn về hiệu quả giữa các rạp. Tỷ trọng vé Normal vẫn còn cao rõ rệt so với Hà Nội.
*   **Khu vực khác:** Mức giá niêm yết thấp hơn. Chiến lược chủ yếu là **vé Normal**, ngoại trừ một số thành phố lớn như Hải Phòng, Đà Nẵng, Bình Dương có doanh thu tốt thì mới áp dụng vé Resell.
*   **Đặc điểm phân phối giá:** Hà Nội và TP.HCM có khoảng phân bố giá (IQR) rộng và nhiều giá trị ngoại lai cao trên 200k, cho thấy khả năng chấp nhận phân khúc giá đa tầng (vé đặc biệt, suất chiếu VIP). Các tỉnh khác có dải giá hẹp và ổn định hơn.

### Hành động (Action):
*   **Hà Nội:** Duy trì vé Resell làm chủ đạo với chiết khấu 20-30%, hạn chế vé Promotion để bảo vệ biên lợi nhuận.
*   **TP.HCM:** Tái cơ cấu bằng cách tăng tỷ trọng vé Resell tại các rạp có nhu cầu cao và giảm dần vé Normal.
*   **Tỉnh khác:** Giữ vé Normal là chủ đạo, chỉ dùng Promotion có chọn lọc vào giờ thấp điểm.

---

## 2. Insight 2: Phân Tích Theo Thời Gian

### Mô tả hình ảnh trong Dashboard:
*   **Biểu đồ Cột/Đường (Monthly Trend):** Thể hiện biến động doanh thu theo từng tháng trong năm.
*   **Biểu đồ Miền/Cột chồng (Ticket Type by Month):** Cho thấy sự thay đổi tỷ trọng giữa các loại vé (Normal, Resell, Promotion) qua các tháng.
*   **Biểu đồ Đường kép (Weekly Analysis):** So sánh giá niêm yết trung bình, giá bán VNPAY và sản lượng vé bán ra theo các thứ trong tuần (từ Thứ 2 đến Chủ Nhật).

### Phân tích chi tiết:
*   **Xu hướng tháng:** Doanh thu đạt đỉnh vào **tháng 2 (Tết)** và **tháng 8-9 (Mùa hè)**. Trong tháng 2, dù nhu cầu cao nhưng VNPAY ưu tiên vé Normal để tối ưu lợi nhuận. Ngược lại, vào tháng 8-9, khi giá rạp tăng, VNPAY đẩy mạnh vé Resell để giữ lợi thế cạnh tranh.
*   **Xu hướng tuần:** Nhu cầu tăng mạnh nhất vào các ngày cuối tuần (Thứ 6, 7, Chủ Nhật) và thấp nhất vào Thứ 4.
*   **Chiến lược điều tiết:** Vào Thứ 4 (nhu cầu thấp, giá rạp giảm sâu), VNPAY không tập trung vào Resell/Promotion. Vào cuối tuần, khi giá rạp lên đỉnh, VNPAY sử dụng **vé Resell là chủ đạo** kết hợp với Promotion để cân bằng giá và kéo sản lượng.

### Hành động (Action):
*   **Thứ 2, 3 & 4:** Ưu tiên vé Normal, giảm bớt Resell và không cần dùng Promotion.
*   **Thứ 5 & Cuối tuần:** Tăng mạnh tỷ trọng Resell. Đối với Promotion, nên ưu tiên bán theo dạng **Combo (Resell + Promotion)** để tối ưu số lượng vé bán ra thay vì tối ưu giá.

---

## 3. Insight 3: Phân Tích Các Đặc Trưng (Features) Ngoài

### Mô tả hình ảnh trong Dashboard:
*   **Biểu đồ Phân loại độ tuổi (Age-rate):** So sánh sản lượng và doanh thu giữa các nhóm P, K, T13, T16, T18.
*   **Biểu đồ Nguồn gốc phim:** So sánh hiệu quả giữa phim Việt Nam và phim Nước ngoài.
*   **Bảng/Biểu đồ Thời lượng phim:** Phân tích doanh thu theo 5 nhóm thời lượng từ "Rất ngắn" đến "Rất dài".

### Phân tích chi tiết:
*   **Độ tuổi (Age-rate):** Nhóm **T16** có lượng vé bán cao nhất và nhạy cảm về giá (ưa chuộng vé Resell). Nhóm **T13** mang lại doanh thu trung bình trên mỗi phim cao nhất và sẵn sàng mua vé Normal. Các nhóm P và T18 có quy mô khán giả hạn chế.
*   **Nguồn gốc:** Phim Việt Nam dù số lượng ít (55 phim so với 228 phim nước ngoài) nhưng lại có **tổng doanh thu cao hơn** và sức hút tập trung cực lớn trong thời gian ngắn.
*   **Thời lượng:** Phim có thời lượng **Dài (110-130 phút)** và **Rất dài (>130 phút)** đạt doanh thu trung bình trên mỗi phim cao vượt trội so với các phim ngắn.

### Hành động (Action):
*   **Theo độ tuổi:** Tập trung vé Normal cho phim T13; dùng Resell làm chủ lực cho phim T16; dùng Promotion để tối ưu công suất cho phim P và T18.
*   **Theo nguồn gốc:** Xem phim Việt Nam là trọng điểm doanh thu, ưu tiên bán vé Normal khi phim có tín hiệu tốt. Phim nước ngoài dùng để duy trì độ phủ với chiến lược giá Resell linh hoạt.
*   **Theo thời lượng:** Phim càng dài càng hạn chế dùng Promotion; nên dùng Normal và Resell để giữ vững doanh thu vì các phim này thường có sức hút lớn.