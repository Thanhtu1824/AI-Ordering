# AI First Ordering Platform - Business Logic

## Main Workflow
Need Discovery
→ Product Discovery
→ Product Resolution
→ Quote Generation
→ Deposit Payment
→ Purchase Execution
→ Warehouse Processing
→ International Shipping
→ Customs Clearance
→ Final Settlement
→ Delivery

## Intent Detection
Các intent chính:
- login
- register
- search_product
- view_detail
- create_order
- payment
- view_order
- cancel_request
- complaint

## Context Aware Intent
Ví dụ:
- 'chi tiết' khi đang xem sản phẩm => view_product_detail
- 'chi tiết' khi đang xem đơn => view_order_detail

## Entity Extraction
Trích xuất:
- Product
- Brand
- Model
- Color
- Size
- Quantity
- Phone
- Address

## Gap Filling
Nếu thiếu dữ liệu:
- Hỏi bổ sung
- Đề xuất lựa chọn
- Xác nhận

## Need Resolution
Dành cho khách hàng không biết tên sản phẩm.
Tập trung vào:
- Nhu cầu
- Mục đích sử dụng
- Ngân sách
- Hình ảnh tham khảo

## Product Discovery
Hỗ trợ tìm theo:
- Tên sản phẩm
- Thương hiệu
- Mô tả tự nhiên
- Ngân sách
- Hình ảnh
- Link
- Sản phẩm tương tự

## Product Resolution
Làm rõ sản phẩm tới mức có thể báo giá.

## Quote Logic
- Scraping
- Marketplace Search
- Supplier Search
- Tính phí
- Tính thuế
- Sinh báo giá

## Realtime Logic
- Quote updated
- Payment updated
- Shipping updated
- Complaint updated
- Human handoff updated

## Conversation State
Lưu:
- Current Context
- Current Workflow
- Focused Entity
- Authentication State