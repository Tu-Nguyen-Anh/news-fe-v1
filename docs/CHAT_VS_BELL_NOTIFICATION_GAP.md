# Khoảng trống: Thông báo chuông vs tin nhắn chat

Tài liệu này mô tả vấn đề đã xác định, bằng chứng từ code/log, và **các câu hỏi cần trả lời** trước khi sửa (cho agent hoặc team backend/frontend).

---

## 1. Vấn đề (Problem statement)

- **Triệu chứng:** Khi có tin nhắn chat mới, người dùng **không** thấy toast / badge trên **icon chuông thông báo** (notification bell) giống như khi bị @mention trong bình luận bài viết.
- **Kỳ vọng nghiệp vụ (cần xác nhận):** Có tin nhắn mới (đặc biệt khi **không** đang mở đúng phòng chat) thì vẫn có tín hiệu trên chuông (hoặc cơ chế tương đương), hoặc ít nhất hành vi cần được định nghĩa rõ.

---

## 2. Kiến trúc hiện tại (Frontend — đã rà soát trong repo)

| Kênh | Topic / API | Ảnh hưởng tới chuông? |
|------|-------------|------------------------|
| Thông báo hệ thống (mention, …) | STOMP: `/topic/notifications/{userId}` + REST `GET /notifications`, `GET /notifications/unread-count` | **Có** — `ChatNotificationProvider` tăng cache `unread-count`; `NotificationBell` hiện toast khi `unreadCount` tăng. |
| Tin chat realtime | STOMP: `/topic/chat/{groupId}` | **Không** — chỉ cập nhật tin trong cache, `chatStore.incrementUnread` cho sidebar chat, **không** cập nhật `notifications/unread-count`. |

File tham chiếu:

- `src/components/chat/ChatNotificationProvider.tsx` — subscribe notifications vs chat.
- `src/components/layout/NotificationBell.tsx` — toast/badge gắn với `useUnreadCount()` (notification API).

**Kết luận phía FE:** Chuông chỉ phản ứng với **notification topic + REST notification**, không tự nối từ sự kiện `/topic/chat/...`.

---

## 3. Bằng chứng phía Backend (log mẫu)

Trong luồng `sendMessage` (group chat, WebSocket/STOMP):

- Có `ChatController (sendMessage)` và `insert into chat_messages`.
- **Không** thấy `insert`/`update` liên quan bảng **notifications** (hoặc service tương đương) trong cùng luồng.
- Gần đó có **hai** request REST `markAsRead` cho cùng `groupId` (hai user khác nhau) — khớp với việc mỗi client gọi đánh dấu đã đọc khi vào phòng chat; **không** giải thích việc thiếu chuông nếu hệ thống chuông không dùng chat read.

Ngoài ra trên thread xử lý tin có log kiểu **Authentication: null** (Auditor / SecurityContext) — có thể là rủi ro nếu sau này thêm logic tạo notification phụ thuộc context bảo mật trên cùng thread.

---

## 4. Câu hỏi cần trả lời (cho agent backend / product)

### 4.1 Nghiệp vụ

1. **Sản phẩm có yêu cầu** tin nhắn chat mới phải xuất hiện trong **danh sách thông báo chuông** (cùng API `/notifications`) không, hay chỉ cần badge unread trên **icon/menu Chat**?
2. Khi user **đang mở đúng** phòng chat đó, có cần **không** tạo thông báo chuông (tránh spam) không?
3. Với **nhóm nhiều người**, mỗi tin mới có tạo **một** notification cho từng thành viên (trừ người gửi), hay gộp theo nhóm / theo khoảng thời gian?

### 4.2 Backend

4. Hiện tại khi `sendMessage` thành công, backend có **broadcast** thêm message lên `/topic/notifications/{userId}` cho người nhận không? Nếu có, **payload** có đúng schema mà FE đang `JSON.parse` như `Notification` (flat object) hay bọc `{ data: ... }`?
5. Có **lưu DB** bản ghi notification cho loại “tin nhắn mới” không? Nếu không, `GET /notifications/unread-count` sau F5 có **không** bao giờ tăng vì chat — đúng không?
6. `userId` trong destination `/topic/notifications/{userId}` dùng **kiểu gì** (Long numeric) và có **khớp** với `user.id` mà JWT/REST trả về cho frontend không?
7. Luồng STOMP có thread **không** có `SecurityContext`: khi implement tạo notification, sẽ lấy **sender/recipient** từ đâu (payload tin, lookup DB) để tránh phụ thuộc `Authentication` trên thread đó?

### 4.3 Frontend (nếu backend chỉ bổ sung REST mà chưa push WS)

8. Nếu backend chỉ ghi DB nhưng **chưa** push WebSocket, FE có chấp nhận **polling** hoặc `invalidateQueries` khi nhận `/topic/chat/...` (tin từ người khác + không đang focus phòng) để refetch `unread-count` không? (Cần đồng bộ với câu 5: unread-count có phải bao gồm chat không.)

### 4.4 Tương thích UI

9. `NotificationBell` hiện điều hướng click tới `/articles/{article_id}` — với notification loại chat, **đích điều hướng** mong muốn là gì (`/chat` với `groupId`, query param, …)? Có cần mở rộng type `Notification` (ví dụ `group_id`, `message_id`) không?

---

## 5. Hướng xử lý gợi ý (không bắt buộc — phụ thuộc câu trả lời trên)

- **Backend:** Trong luồng lưu tin nhắn, với mỗi người nhận hợp lệ: tạo notification (nếu nghiệp vụ cần) + `SimpMessagingTemplate.convertAndSend("/topic/notifications/" + recipientId, payload)` với body **cùng định dạng** các loại notification hiện có (hoặc mở rộng schema có version/type).
- **Frontend:** Khi có field mới (`group_id`, …), cập nhật `types/index.ts`, `handleNotificationClick` trong `NotificationBell.tsx`, và tài liệu API.

---

## 6. Tiêu chí chấp nhận (Acceptance criteria) — draft

- [ ] Định nghĩa rõ: chat mới có/không xuất hiện trong chuông.
- [ ] Nếu có: unread chuông tăng realtime (WS hoặc cơ chế thay thế đã thống nhất); sau F5 vẫn khớp DB.
- [ ] Click một thông báo loại chat dẫn đúng tới màn hình hội thoại liên quan.
- [ ] Không regression: @mention / thông báo bài viết vẫn hoạt động như cũ.

---

*Tài liệu tổng hợp từ rà soát frontend (`netapp_fe-main`) và log backend mẫu; cập nhật khi có quyết định nghiệp vụ và hợp đồng API cuối cùng.*
