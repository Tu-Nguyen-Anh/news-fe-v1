# Đặc tả tích hợp: Thông báo chuông cho tin nhắn chat

Tài liệu **bổ sung** cho [`CHAT_VS_BELL_NOTIFICATION_GAP.md`](./CHAT_VS_BELL_NOTIFICATION_GAP.md).  
File kia tập trung **vấn đề + câu hỏi mở**; file này đưa **hướng kỹ thuật thống nhất** để backend/frontend cùng triển khai (có thể chỉnh sau khi product trả lời các câu hỏi nghiệp vụ).

---

## 1. Mục tiêu

Sau khi triển khai (nếu được duyệt nghiệp vụ):

1. Người nhận tin chat mới thấy **badge + toast chuông** realtime (giống luồng @mention), hoặc ít nhất **badge/unread** khớp REST sau khi refetch.
2. Một entry trong `GET /notifications` có thể điều hướng tới **đúng phòng chat** (không ép dùng `article_id` nếu không có bài viết).

---

## 2. Hợp đồng hiện tại (Frontend đang giả định)

### 2.1 STOMP

- Kết nối: SockJS tới `{API_ORIGIN}/ws` (suy ra từ `VITE_API_BASE_URL`, bỏ hậu tố `/api/v1`).
- Subscribe: `/topic/notifications/{userId}` — `userId` = id user đang đăng nhập (số).
- Body: **một object JSON duy nhất** (parse trực tiếp), không bọc `{ "data": ... }` ở lớp ngoài (nếu backend gửi khác, FE phải unwrap — nên tránh).

### 2.2 Type TypeScript (`src/types/index.ts`)

```ts
export interface Notification {
  id: number;
  sender_user_id: number;
  sender_full_name: string;
  type: string;
  message: string;
  article_id: number;
  comment_id: number;
  is_read: boolean;
  created_at: number;
}
```

### 2.3 Hành vi UI chuông hiện tại

- Click notification: `navigate` tới `/articles/$id` với `id = String(notif.article_id)` — **chỉ phù hợp mention/bài viết**.
- Toast: khi `unreadCount` (query key `["notifications", "unread-count"]`) **tăng**.

---

## 3. Đề xuất mở rộng (Backend + FE)

### 3.1 Loại thông báo mới (ví dụ)

| `type` (string)        | Ý nghĩa                          |
|------------------------|----------------------------------|
| `NEW_CHAT_MESSAGE`     | Có tin nhắn mới trong nhóm chat |

(Có thể đổi tên theo convention backend hiện có.)

### 3.2 Trường bổ sung (REST + WebSocket body)

Backend nên trả về **cùng shape** cho REST list và cho STOMP (để cache FE prepend đúng).

| Trường        | Kiểu    | Bắt buộc | Ghi chú |
|---------------|---------|----------|---------|
| `group_id`    | `long`  | Với type chat | ID nhóm chat; `0` hoặc `null` nếu backend không dùng nullable — FE cần thống nhất |
| `message_id`  | `long`  | Tuỳ chọn | Để deep-link / highlight tin |

Các trường cũ:

- `article_id`, `comment_id`: với chat có thể gửi **`0`** (hoặc null nếu API cho phép — FE cần optional type).

### 3.3 Ví dụ payload WebSocket (gợi ý)

```json
{
  "id": 9001,
  "sender_user_id": 12,
  "sender_full_name": "Nguyễn Văn A",
  "type": "NEW_CHAT_MESSAGE",
  "message": "Nguyễn Văn A đã gửi tin nhắn trong Nhóm X",
  "article_id": 0,
  "comment_id": 0,
  "group_id": 4,
  "message_id": 550,
  "is_read": false,
  "created_at": 1711598597105
}
```

### 3.4 Luồng backend (gợi ý)

Sau khi `chat_messages` insert thành công và đã biết `group_id`, `sender_id`, `message_id`:

1. Lấy danh sách `user_id` thành viên nhóm (trừ người gửi — hoặc theo rule product).
2. Với mỗi người nhận (và sau rule “đang xem phòng thì không tạo” nếu có):
   - Insert `notifications` (nếu dùng DB).
   - `convertAndSend("/topic/notifications/" + recipientId, notificationDto)`.
3. Đảm bảo thread STOMP có đủ dữ liệu (sender name, group display name cho `message`) **không** phụ thuộc `SecurityContext` nếu context trên thread đó là null — truyền từ payload/DB lookup.

### 3.5 Thay đổi Frontend (khi có `type` + `group_id`)

- Mở rộng `Notification` trong `types/index.ts` (`group_id?`, `message_id?`, `article_id?` nếu cần optional).
- `NotificationBell.handleNotificationClick`: nếu `type === 'NEW_CHAT_MESSAGE'` (hoặc tương đương) và có `group_id` → điều hướng tới route chat với `groupId` (đường dẫn cụ thể theo router hiện tại, ví dụ `/chat` + search param hoặc dynamic segment).
- (Tuỳ chọn) Icon/badge theo loại trong list chuông.

---

## 4. Checklist triển khai (copy cho PR)

**Backend**

- [ ] Quyết định nghiệp vụ: ai nhận notification, khi nào không tạo (đang mở room).
- [ ] DB + migration (nếu cần cột/type mới).
- [ ] REST `GET /notifications` và `unread-count` phản ánh đúng loại chat.
- [ ] STOMP push cùng DTO với REST element.
- [ ] Log/verify destination `/topic/notifications/{numericUserId}` khớp FE.

**Frontend**

- [ ] Type + click handler theo `type` / `group_id`.
- [ ] Không vỡ luồng `MENTION_IN_COMMENT` (điều hướng bài viết như cũ).
- [ ] Kiểm tra manual: nhận tin khi **không** mở phòng → toast + badge; mở chuông → item đúng; click → vào đúng nhóm.

---

## 5. Tham chiếu nhanh file trong repo

| Nội dung              | File |
|-----------------------|------|
| Subscribe WS + cache  | `src/components/chat/ChatNotificationProvider.tsx` |
| Toast / bell UI       | `src/components/layout/NotificationBell.tsx` |
| REST notification     | `src/services/notificationService.ts`, `src/hooks/useNotifications.ts` |
| Mention / API chung   | `docs/comment-mention-notification-api.md`, `docs/REALTIME_NOTIFICATION_WEBSOCKET.md` |

---

*Tài liệu đề xuất — điều chỉnh field names và route chat theo backend và router thực tế của dự án.*
