# Thư viện diễn giải Pythagoras – Tiếng Việt (bản biên tập đầu)

- `contentVersion`: `v1.0.0-draft` – cần biên tập và kiểm thử trước khi phát hành.
- 9 file JSON với tổng số 99 bản diễn giải dự kiến; 6 chỉ số lõi có 1–9/11/22/33, 3 chỉ số (birthday, personalYear, personalMonth) có 1–9.
- Bộ nội dung là **văn bản soạn riêng cho sản phẩm**, nhưng được biên tập theo *khung cấu trúc chung*. Các đoạn diễn giải chưa được kiểm định độc lập về hiệu ứng cá nhân hóa; nên review từng bài trong app trước khi release.
- Không nên xem văn bản thần số học là đánh giá tính cách hay dự đoán khoa học.
- Không làm thay đổi công thức Calculation Engine. Hãy đối chiếu tập giá trị thực tế mà engine có thể trả về; bổ sung/bỏ những bản diễn giải không phù hợp.
- `baseValue` của master numbers: 11→2, 22→4, 33→6.
- Flutter nhận dữ liệu từ backend; không cần import JSON vào mobile.
