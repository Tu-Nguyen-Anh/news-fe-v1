# Chat — Advanced Features API

Tài liệu này mô tả 4 tính năng chat nâng cao:
1. [Xóa cuộc trò chuyện](#1-xóa-cuộc-trò-chuyện)
2. [Thu hồi tin nhắn](#2-thu-hồi-tin-nhắn)
3. [Gửi emoji / icon](#3-gửi-emoji--icon-làm-tin-nhắn)
4. [Xem danh sách ai đã xem tin nhắn](#4-xem-danh-sách-ai-đã-xem-tin-nhắn)

Tất cả REST endpoint yêu cầu: `Authorization: Bearer {accessToken}`

---

## 1. Xóa cuộc trò chuyện

### Endpoint

```
DELETE /api/v1/chat/groups/{groupId}
```

### Quy tắc phân quyền

| Loại | Ai có thể xóa |
|------|--------------|
| **DM (is_direct = true)** | Bất kỳ thành viên nào |
| **Nhóm (is_direct = false)** | Chỉ Admin |

### Request

Không có body.

```
DELETE /api/v1/chat/groups/42
Authorization: Bearer eyJhbGci...
```

### Response thành công

```json
{
  "timestamp": 1711500000000,
  "status": 200,
  "message": "success",
  "data": null
}
```

### Error cases

| HTTP | Trường hợp |
|------|-----------|
| 401 | Chưa đăng nhập |
| 403 | Không phải thành viên nhóm (DM) hoặc không phải Admin (nhóm) |
| 404 | Nhóm không tồn tại |

### UI Flow

```
User click "Xóa cuộc trò chuyện" / "Xóa nhóm"
        ↓
Hiện confirm dialog
        ↓
DELETE /api/v1/chat/groups/{groupId}
        ↓
200 OK:
  → Xóa khỏi danh sách chat
  → Ngắt WebSocket subscription /topic/chat/{groupId}
  → Navigate về trang danh sách
```

---

## 2. Thu hồi tin nhắn

### Endpoint

```
DELETE /api/v1/chat/groups/{groupId}/messages/{messageId}/recall
```

### Mô tả

- Chỉ người gửi mới có thể thu hồi tin nhắn của mình.
- Sau khi thu hồi: nội dung hiển thị là **"Tin nhắn đã bị thu hồi"**, các reaction và read receipts bị ẩn.
- Tin nhắn **không bị xóa** khỏi DB — vẫn hiện trên màn hình nhưng nội dung bị che.
- Backend broadcast WebSocket event về topic `/topic/chat/{groupId}/recall` để mọi người trong nhóm thấy ngay lập tức.

### Request

Không có body.

```
DELETE /api/v1/chat/groups/15/messages/88/recall
Authorization: Bearer eyJhbGci...
```

### Response

```json
{
  "timestamp": 1711500000000,
  "status": 200,
  "message": "success",
  "data": {
    "id": 88,
    "group_id": 15,
    "sender_id": 7,
    "sender_username": "nguyenvana",
    "sender_full_name": "Nguyễn Văn A",
    "sender_avatar": "https://...",
    "content": "Tin nhắn đã bị thu hồi",
    "message_type": null,
    "recalled": true,
    "created_at": 1711500000000,
    "readers": null,
    "reactions": null
  }
}
```

**Trường `recalled`:**
- `true` = tin nhắn đã bị thu hồi → frontend hiện nội dung đặc biệt (italic, màu xám)
- `false` / `null` = tin nhắn bình thường

### Error cases

| HTTP | Code | Trường hợp |
|------|------|-----------|
| 400 | `NotMessageSenderException` | Bạn không phải người gửi tin nhắn này |
| 403 | `NotGroupMemberException` | Bạn không thuộc nhóm này |
| 404 | `ChatMessageNotFoundException` | Tin nhắn không tồn tại |

---

### WebSocket — Sự kiện thu hồi tin nhắn

**Subscribe topic:**
```
/topic/chat/{groupId}/recall
```

**Payload nhận được:**
```json
{
  "message_id": 88,
  "group_id": 15,
  "recalled_by": 7,
  "recalled_at": 1711500000000
}
```

**Xử lý phía frontend khi nhận event:**

```javascript
stompClient.subscribe(`/topic/chat/${groupId}/recall`, (frame) => {
  const event = JSON.parse(frame.body);

  // Tìm message trong danh sách và cập nhật UI
  updateMessage(event.message_id, {
    content: 'Tin nhắn đã bị thu hồi',
    recalled: true,
    message_type: null,
    reactions: null,
    readers: null,
  });
});
```

**Hiển thị UI cho tin nhắn bị thu hồi:**

```jsx
// React example
function MessageBubble({ message }) {
  if (message.recalled) {
    return (
      <div className="message recalled">
        <i style={{ color: '#999' }}>Tin nhắn đã bị thu hồi</i>
      </div>
    );
  }
  return <div className="message">{message.content}</div>;
}
```

---

## 3. Gửi emoji / icon làm tin nhắn

Dùng `message_type = "EMOJI"` khi gửi tin nhắn qua REST hoặc WebSocket.

### Các loại `message_type` hợp lệ

| Giá trị | Mô tả |
|---------|-------|
| `TEXT` | Tin nhắn văn bản thông thường (mặc định) |
| `IMAGE` | Tin nhắn hình ảnh (content là URL ảnh) |
| `EMOJI` | Tin nhắn là emoji / icon (content là ký tự emoji) |

### Gửi qua REST

```
POST /api/v1/chat/groups/{groupId}/messages
```

Request body:
```json
{
  "content": "👍",
  "message_type": "EMOJI"
}
```

### Gửi qua WebSocket (STOMP)

```javascript
stompClient.publish({
  destination: `/app/chat/${groupId}`,
  body: JSON.stringify({
    content: '❤️',
    message_type: 'EMOJI',
  }),
});
```

### Response / Payload nhận được

```json
{
  "id": 101,
  "group_id": 15,
  "sender_id": 7,
  "sender_full_name": "Nguyễn Văn A",
  "content": "👍",
  "message_type": "EMOJI",
  "recalled": false,
  "created_at": 1711500000000
}
```

### Validation

Nếu `message_type` không hợp lệ, backend trả về:
```json
{
  "status": 400,
  "message": "message_type must be TEXT, IMAGE or EMOJI"
}
```

### UI Flow — Emoji picker

```
User click icon emoji trong chat input
        ↓
Hiện emoji picker (thư viện: emoji-mart, emoji-picker-react, ...)
        ↓
User chọn emoji (vd: 👍)
        ↓
Gửi: { content: "👍", message_type: "EMOJI" }
        ↓
Hiện tin nhắn với emoji lớn hơn text thường
```

**Tip hiển thị:** Khi `message_type === "EMOJI"`, render emoji với font-size lớn hơn:

```jsx
function MessageContent({ message }) {
  if (message.message_type === 'EMOJI') {
    return <span style={{ fontSize: '2rem' }}>{message.content}</span>;
  }
  if (message.message_type === 'IMAGE') {
    return <img src={message.content} alt="image" />;
  }
  return <span>{message.content}</span>;
}
```

---

## 4. Xem danh sách ai đã xem tin nhắn

### Endpoint

```
GET /api/v1/chat/groups/{groupId}/messages/{messageId}/reads
```

### Mô tả

- Trả về danh sách những người đã **đọc** tin nhắn cụ thể.
- Người gửi không tự đếm là "đã xem".
- "Đã xem" được tính khi user gọi `POST /api/v1/chat/groups/{groupId}/messages/read` (đánh dấu đã đọc toàn nhóm).

### Request

```
GET /api/v1/chat/groups/15/messages/88/reads
Authorization: Bearer eyJhbGci...
```

### Response

```json
{
  "timestamp": 1711500000000,
  "status": 200,
  "message": "success",
  "data": [
    {
      "user_id": 3,
      "username": "tranthib",
      "full_name": "Trần Thị B",
      "avatar": "https://...",
      "read_at": 1711500120000
    },
    {
      "user_id": 5,
      "username": "levanc",
      "full_name": "Lê Văn C",
      "avatar": "https://...",
      "read_at": 1711500180000
    }
  ]
}
```

**Trường `read_at`:** Timestamp milliseconds khi người đó đọc tin nhắn.

### Error cases

| HTTP | Trường hợp |
|------|-----------|
| 403 | Bạn không phải thành viên nhóm |
| 404 | Tin nhắn không thuộc nhóm này |

### UI Flow

```
User hover/click vào tin nhắn
        ↓
Hiện tooltip "X người đã xem" (từ readers[] trong ChatMessageResponse)
        ↓
User click để xem chi tiết
        ↓
GET /api/v1/chat/groups/{groupId}/messages/{messageId}/reads
        ↓
Hiện modal/popover danh sách avatar + tên + thời gian đọc
```

**Tối ưu:** `ChatMessageResponse` đã có sẵn `readers[]` khi load tin nhắn (`GET /messages`). Chỉ cần gọi endpoint `/reads` khi user click để xem chi tiết (lazy loading).

```jsx
function MessageReaders({ message, groupId }) {
  const [readers, setReaders] = useState(message.readers ?? []);
  const [loading, setLoading] = useState(false);

  const loadReaders = async () => {
    setLoading(true);
    const res = await fetch(
      `/api/v1/chat/groups/${groupId}/messages/${message.id}/reads`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setReaders(data.data);
    setLoading(false);
  };

  return (
    <button onClick={loadReaders}>
      {readers.length > 0 ? `${readers.length} người đã xem` : 'Chưa ai xem'}
    </button>
  );
}
```

---

## 5. Tổng hợp WebSocket topics

| Topic | Khi nào nhận | Payload |
|-------|-------------|---------|
| `/topic/chat/{groupId}` | Tin nhắn mới | `ChatMessageResponse` |
| `/topic/chat/{groupId}/recall` | Có tin nhắn bị thu hồi | `RecallEvent` |
| `/topic/chat/{groupId}/reaction` | Reaction thêm/xóa | `ReactionEvent` |
| `/topic/chat/{groupId}/read` | Có người đọc tin nhắn | `ReadReceiptEvent` |
| `/topic/chat/{groupId}/presence` | User online/offline | `PresenceEvent` |
| `/topic/notifications/{userId}` | Thông báo @mention | `NotificationResponse` |

---

## 6. Tổng hợp REST endpoints mới

| Method | URL | Mô tả | Auth |
|--------|-----|-------|------|
| `DELETE` | `/api/v1/chat/groups/{groupId}` | Xóa nhóm (admin) hoặc DM (any member) | Required |
| `DELETE` | `/api/v1/chat/groups/{groupId}/messages/{messageId}/recall` | Thu hồi tin nhắn (chỉ người gửi) | Required |
| `GET` | `/api/v1/chat/groups/{groupId}/messages/{messageId}/reads` | Xem ai đã đọc tin nhắn | Required |
