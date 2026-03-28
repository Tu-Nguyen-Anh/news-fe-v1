# Badge số tin chưa đọc: API, phạm vi dữ liệu và vì sao chat mới không tăng count

Tài liệu dành cho **frontend** (và QA): map đúng **icon nào** với **nguồn dữ liệu nào**, endpoint nào dùng được, và **không phải lỗi API** khi nào.

**Liên quan:** [`CHAT_VS_BELL_NOTIFICATION_GAP.md`](./CHAT_VS_BELL_NOTIFICATION_GAP.md) (kiến trúc chat vs chuông), [`comment-mention-notification-api.md`](./comment-mention-notification-api.md) (REST thông báo), [`REALTIME_NOTIFICATION_WEBSOCKET.md`](./REALTIME_NOTIFICATION_WEBSOCKET.md) (STOMP chuông), [`CHAT_API.md`](./CHAT_API.md) (REST chat), [`CHAT_NOTIFICATION_INTEGRATION_SPEC.md`](./CHAT_NOTIFICATION_INTEGRATION_SPEC.md) (nếu sau này đưa chat vào chuông).

---

## 1. Hai khái niệm khác nhau (hay bị nhầm)

| UI | Ý nghĩa nghiệp vụ | Nguồn dữ liệu backend hiện tại |
|----|-------------------|----------------------------------|
| **Icon chuông** (thông báo) | Mention trong bình luận, v.v. — bảng `notifications` | `GET /api/v1/notifications/unread-count` + STOMP `/topic/notifications/{userId}` |
| **Icon tin nhắn / Chat** | Tin mới trong các nhóm chat | **Không** có endpoint “tổng unread chat toàn app”. Chat chỉ realtime qua STOMP `/topic/chat/{groupId}` và đọc/đánh dấu đã đọc qua REST chat |

**Triệu chứng thường gặp:** Có tin chat mới (WebSocket chat nhận được) nhưng **số trên icon tin nhắn hoặc icon chuông không tăng** — thường do client đang gắn badge vào **`notifications/unread-count`** hoặc **không có state unread chat** phía client/BE.

---

## 2. API badge cho icon CHUÔNG (thông báo) — đã có

### 2.1 Lấy số chưa đọc (REST)

```
GET /api/v1/notifications/unread-count
```

| Header | Bắt buộc | Ghi chú |
|--------|----------|---------|
| `Authorization` | Có | `Bearer <jwt>` |
| `Accept-Language` | Không | Mặc định `en` |

### 2.2 Response (envelope chuẩn dự án)

Cấu trúc `ResponseGeneral` dùng **snake_case**:

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "unread_count": 3
  },
  "timestamp": "2026-03-28 12:00:00"
}
```

| Field trong `data` | Kiểu | Ý nghĩa |
|--------------------|------|---------|
| `unread_count` | `number` (long) | Số bản ghi `notifications` với `is_read = false` của user hiện tại |

**Backend:** `NotificationController#getUnreadCount` → `NotificationServiceImpl#getUnreadCount` → `NotificationRepository#countByRecipientUserIdAndIsReadFalse`.

### 2.3 Phạm vi quan trọng (để debug)

- Chỉ đếm **bảng thông báo** (`Notification`), ví dụ loại `MENTION_IN_COMMENT`.
- **Gửi tin chat** (STOMP hoặc REST facade) **không** insert `Notification` và **không** push `/topic/notifications/{userId}`.
- Do đó: **`unread_count` sẽ không tăng khi chỉ có tin chat mới** — đây là **đúng với thiết kế hiện tại**, không phải lỗi endpoint.

### 2.4 Realtime tăng badge chuông

Subscribe STOMP (sau khi connect SockJS/WebSocket):

- Destination: `/topic/notifications/{recipientUserId}`  
- `recipientUserId`: **Long**, đúng `id` user đang đăng nhập.

Mỗi message = một `NotificationResponse` (JSON snake_case). Khi nhận được, client có thể `unread_count += 1` (hoặc refetch `GET .../unread-count` để đồng bộ DB).

Chi tiết payload và ví dụ client: [`REALTIME_NOTIFICATION_WEBSOCKET.md`](./REALTIME_NOTIFICATION_WEBSOCKET.md).

---

## 3. Icon TIN NHẮN (chat) — backend hiện tại cung cấp gì?

### 3.1 Danh sách nhóm

```
GET /api/v1/chat/groups
```

Response từng phần tử: `GroupResponse` gồm `id`, `name`, `avatar`, `member_count`, `my_role`, `is_direct`, `created_at`.

**Không có field** `unread_count` / `last_message` / `last_read_at` trên từng nhóm → **không thể** chỉ từ API này suy ra tổng badge tin chưa đọc toàn app nếu chưa có logic bổ sung phía client hoặc API mới.

### 3.2 Tin mới realtime (chat)

- Topic: `/topic/chat/{groupId}` (`groupId` là Long).
- Payload: `ChatMessageResponse` (xem `CHAT_API.md` / code `ChatController` / facade gửi tin).

**Không** có topic riêng kiểu “tổng unread user” — mỗi nhóm một topic.

### 3.3 Đánh dấu đã đọc trong nhóm

```
POST /api/v1/chat/groups/{groupId}/messages/read
```

Đánh dấu đã đọc các tin trong nhóm (theo `chat_message_reads`). Dùng khi user vào phòng / xem hội thoại.

### 3.4 Đọc lịch sử tin (để tự suy unread — nếu FE tự làm)

```
GET /api/v1/chat/groups/{groupId}/messages?page=&size=
```

(Đúng path theo `ChatGroupController` / routing trong project — tham chiếu `CHAT_API.md`.)

`ChatMessageResponse` có thể kèm `readers`; logic “tin này user hiện tại đã đọc chưa” có thể suy từ read receipts + `POST .../messages/read`, tùy cách app định nghĩa “unread”.

---

## 4. Phân tích lỗi / kỳ vọng: “Có tin mới mà không thấy +count”

### 4.1 Nếu badge gắn vào `GET /api/v1/notifications/unread-count` hoặc STOMP `/topic/notifications/...`

| Nguyên nhân | Cách xác nhận |
|-------------|----------------|
| Tin **chỉ** là chat | Gửi chat → DB `notifications` không có row mới → `unread_count` không đổi |
| Đúng thiết kế BE hiện tại | Xem [`CHAT_VS_BELL_NOTIFICATION_GAP.md`](./CHAT_VS_BELL_NOTIFICATION_GAP.md) mục 2.4–2.5 |

**Hướng xử lý theo nghiệp vụ:**

- Muốn **chuông** phản ánh chat → cần tính năng mới (spec: [`CHAT_NOTIFICATION_INTEGRATION_SPEC.md`](./CHAT_NOTIFICATION_INTEGRATION_SPEC.md)).
- Chỉ cần **icon Chat** có số → không dùng `notifications/unread-count`; cần chiến lược riêng (mục 5).

### 4.2 Nếu badge là “tin nhắn” nhưng chỉ refetch `unread-count` khi có sự kiện chat

→ Số sẽ **không** đổi vì hai pipeline độc lập (mục 1).

### 4.3 Nếu subscribe STOMP chat sai `groupId`

→ Không nhận tin; badge local cũng không cập nhật (vấn đề subscription, không phải unread-count API).

### 4.4 Nếu `userId` trong `/topic/notifications/{userId}` sai kiểu hoặc sai id

→ Không nhận push chuông; refetch `unread-count` vẫn đúng nếu có row trong DB (debug tách REST vs WS).

---

## 5. Gợi ý tích hợp FE cho badge **icon Chat** (trong phạm vi BE hiện tại)

Backend **chưa** cung cấp `GET .../chat/unread-total`. Các hướng khả thi:

1. **State local:** Khi subscribe `/topic/chat/{groupId}` và payload là tin từ **người khác** và user **không** đang focus phòng đó → tăng counter local (và lưu per-`groupId` nếu cần). Khi mở phòng → gọi `POST .../messages/read` và trừ counter nhóm tương ứng.
2. **Polling / refetch:** Sau sự kiện chat hoặc định kỳ, gọi lại các API cần thiết để tính unread (có thể tốn request nếu không có API tổng hợp).
3. **Đề xuất BE sau này:** Ví dụ `GET /api/v1/chat/unread-summary` trả về `{ total_unread, by_group_id: { ... } }` hoặc bổ sung `unread_count` vào `GET /api/v1/chat/groups` — cần story riêng và query rõ (tin của chính user có tính unread không, tin đã recall, v.v.).

---

## 6. Checklist nhanh cho frontend khi debug

1. Badge đang đọc field nào? `data.unread_count` từ **`/api/v1/notifications/unread-count`** chỉ phản ánh **chuông**, không phải chat.
2. Tin chat mới có đến qua **`/topic/chat/{groupId}`** không? (Network WS / log STOMP.)
3. Sau khi mở chat, có gọi **`POST /api/v1/chat/groups/{groupId}/messages/read`** không?
4. Product có yêu cầu **chat hiện trên chuông** không? Nếu có → không đủ với API hiện tại; cần spec tích hợp (file `CHAT_NOTIFICATION_INTEGRATION_SPEC.md`).

---

## 7. Tham chiếu mã nguồn (backend)

| Hạng mục | File gợi ý |
|----------|------------|
| REST unread chuông | `NotificationController.java` (`GET /unread-count`) |
| Đếm unread | `NotificationServiceImpl.java`, `NotificationRepository.java` |
| Gửi chat + broadcast | `ChatController.java`, `ChatGroupFacadeServiceImpl.java` (chỉ `CHAT_TOPIC`) |
| Tạo notification + push chuông | `NotificationServiceImpl.java` (ví dụ mention) |
| Danh sách nhóm chat | `ChatGroupController.java` → `getMyGroups` / `GroupResponse` |

---

*Tài liệu được tạo để đồng bộ kỳ vọng FE–BE về badge unread. Cập nhật khi có API unread chat mới hoặc khi chat được đưa vào luồng `notifications`.*
