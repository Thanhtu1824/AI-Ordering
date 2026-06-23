# AI-First Ordering Platform

Đây là dự án Monorepo xây dựng một hệ thống đặt hàng ứng dụng AI (Generative UI) kết hợp Chatbot.

## 🏗 Công nghệ sử dụng
- **Frontend**: Next.js (App Router), Tailwind CSS, shadcn/ui, socket.io-client
- **Backend**: NestJS, TypeScript, Socket.IO
- **Database**: PostgreSQL (quản lý bằng Prisma ORM), Redis
- **AI Core** (Sắp tích hợp): LangGraph, Google GenAI
- **Infrastructure**: Docker Compose

---

## 🚀 Các lệnh cơ bản trong dự án (Commands Guide)

Dưới đây là danh sách các lệnh quan trọng để vận hành dự án, được chia theo từng mục đích:

### 1. Cài đặt và Quản lý Packages (Monorepo)
Dự án sử dụng tính năng **npm workspaces** để quản lý nhiều ứng dụng trong cùng một thư mục.
- `npm install` : Cài đặt toàn bộ thư viện cho cả Frontend và Backend.
- `npm install <tên-gói> --workspace=frontend` : Cài đặt một gói NPM riêng cho Frontend.
- `npm install <tên-gói> --workspace=backend` : Cài đặt một gói NPM riêng cho Backend.

### 2. Infrastructure (Docker)
Cơ sở dữ liệu (PostgreSQL) và bộ nhớ đệm (Redis) được chạy bằng Docker để đảm bảo tính cô lập.
- `docker-compose up -d` : Khởi động các Container (Database, Redis) chạy ngầm dưới nền.
- `docker-compose down` : Dừng các Container.
- `docker-compose down -v` : Dừng Container và **xóa toàn bộ dữ liệu** (Dùng khi muốn reset DB làm lại từ đầu).

### 3. Database (Prisma ORM)
Các thao tác liên quan tới cơ sở dữ liệu được thực hiện trong thư mục `apps/backend`.
- `cd apps/backend && npx prisma migrate dev` : Đồng bộ các bảng từ file `schema.prisma` vào trong PostgreSQL và tự động tạo Prisma Client.
- `cd apps/backend && npx prisma studio` : Mở giao diện Web (trên trình duyệt) để xem, thêm, sửa, xóa dữ liệu trong Database một cách trực quan.

### 4. Khởi chạy Ứng dụng
Để chạy dự án, bạn cần khởi động cả 2 service song song ở 2 Terminal khác nhau:
- **Chạy Frontend (Port 3000):**
  ```bash
  npm run dev --workspace=frontend
  ```
- **Chạy Backend (Port 3001):**
  ```bash
  npm run start:dev --workspace=backend
  ```

---

## 📝 Tóm tắt tiến độ (Những gì chúng ta đã làm)
1. **Khởi tạo Monorepo**: Cấu hình không gian làm việc chứa cả ứng dụng Next.js và NestJS.
2. **Thiết kế UI (Frontend)**: Xây dựng Layout chia đôi màn hình 50/50:
   - Cột trái: Khung chat dính (Sticky Chat) với giao diện tiếng Việt, tự động cuộn (Auto-scroll).
   - Cột phải: Khung hiển thị Generative UI động (Ví dụ: Bảng báo giá chi tiết - QuoteSummary).
3. **Kết nối Real-time**: Thiết lập WebSocket Gateway (NestJS) và kết nối với Frontend qua `socket.io-client`. Nhập tin nhắn sẽ được truyền 2 chiều ngay lập tức.
4. **Cấu hình Infrastructure & Database**:
   - Viết cấu hình `docker-compose.yml` cho Postgres 18 và Redis. Khắc phục lỗi volume của Postgres 18 và lỗi đụng Port 5432 trên Windows.
   - Thiết lập Prisma ORM (v5), tạo các Schema ban đầu (`User`, `Product`, `Order`, `OrderItem`) và chạy lệnh Migration đồng bộ thành công vào DB.
