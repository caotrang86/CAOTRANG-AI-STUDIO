# CAOTRANG AI STUDIO

Ứng dụng web tạo ảnh AI chuyên nghiệp, giao diện Neon Dark Mode.

## 1. Cài đặt và chạy Local

Yêu cầu: Đã cài đặt Node.js (v18 trở lên).

```bash
# 1. Cài đặt thư viện
npm install

# 2. Chạy server phát triển
npm run dev
```
Mở trình duyệt tại `http://localhost:5173`.

> **Lưu ý:** Ở môi trường local, nếu không có Netlify CLI, bạn sẽ không gọi được backend function thực sự. Ứng dụng sẽ tự động chạy chế độ DEMO (trả về ảnh ngẫu nhiên) nếu backend phát hiện thiếu API Key.

## 2. Cấu hình API Key (Quan trọng)

Dự án này sử dụng kiến trúc Serverless (Netlify Functions) để bảo mật API Key.

1.  Bạn cần có API Key từ nhà cung cấp AI (Google Gemini, hoặc API Banana Pro giả định).
2.  Không sửa code để điền Key trực tiếp. Hãy dùng biến môi trường.

## 3. Deploy lên Netlify

Cách nhanh nhất để đưa web lên mạng:

1.  Đẩy code này lên **GitHub**.
2.  Đăng nhập **Netlify** -> "Add new site" -> "Import an existing project".
3.  Chọn repo GitHub của bạn.
4.  Netlify sẽ tự nhận diện cấu hình từ file `netlify.toml`.
    *   **Build command:** `npm run build`
    *   **Publish directory:** `dist`
5.  **Trước khi bấm Deploy (hoặc sau khi deploy xong), vào phần "Site configuration" -> "Environment variables"**:
    *   Thêm Key: `GEMINI_API_KEY` = `(Mã key của bạn)`
    *   Thêm Key: `GEMINI_API_URL` = `(Endpoint API thật, ví dụ https://api.banana.dev/v1/models/run)`
6.  Bấm **Deploy**.

## Cấu trúc dự án

*   `src/`: Chứa code Frontend (React).
*   `src/App.tsx`: Logic chính và giao diện.
*   `netlify/functions/generate.ts`: Backend xử lý gọi API (Node.js).
*   `netlify.toml`: File cấu hình build cho Netlify.
