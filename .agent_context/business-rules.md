# AI First Ordering Platform - Business Rules

## Core Rules
- AI là giao diện chính của hệ thống.
- AI phải hiểu ý định + ngữ cảnh + trạng thái hội thoại + trạng thái nghiệp vụ.
- AI không được đoán khi dữ liệu chưa đủ.
- AI chỉ truy cập dữ liệu thuộc về chính người dùng đã xác thực.
- Các nghiệp vụ nhạy cảm phải chuyển nhân viên.

## Data Access Rules
### Được phép
- Thông tin cá nhân của chính người dùng
- Địa chỉ giao hàng
- Giỏ hàng
- Đơn hàng
- Chi tiết đơn hàng
- Hóa đơn
- Lịch sử mua hàng
- Chi tiết thanh toán

### Không được phép
- Dữ liệu người khác
- Đơn hàng người khác
- Dữ liệu nội bộ công ty
- Dữ liệu nhân viên
- Dữ liệu tài chính công ty
- Thông tin hệ thống

## Complaint Rules
- Khi phát hiện complaint:
  1. Xin lỗi khách hàng
  2. Tạo ticket
  3. Chuyển nhân viên ngay

## Cancellation Rules
- Nếu đã đặt cọc hoặc đang vận chuyển:
  - AI không được tự hủy đơn
  - AI không được tự hoàn tiền
  - AI không được cam kết hoàn tiền
  - Bắt buộc chuyển nhân viên

## Authentication Rules
- Bắt buộc OTP / Magic Link / Passkey
- Không tin thông tin liên hệ nhập tay
- Phải xác thực số điện thoại

## Restricted Item Rules
- Chặn hàng cấm
- Chặn hàng nguy hiểm
- Chặn hàng hạn chế theo chính sách
- Chuyển nhân viên khi cần kiểm duyệt

## Human Handoff Rules
- Complaint
- Hủy đơn
- Hàng cấm
- Không xác định được sản phẩm
- Thanh toán rủi ro
- Người dùng yêu cầu gặp nhân viên