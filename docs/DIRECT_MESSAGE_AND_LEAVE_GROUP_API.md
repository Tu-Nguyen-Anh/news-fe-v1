# Direct Message (1-1) & Leave Group API

Tài liệu này mô tả 2 tính năng mới:
1. **Tạo / mở cuộc trò chuyện riêng 1-1** (Direct Message)
2. **Rời nhóm**

---

## 1. Direct Message — Tạo hoặc mở cuộc trò chuyện 1-1

### Endpoint

```
POST /api/v1/chat/groups/direct/{targetUserId}
```

**Header:** `Authorization: Bearer {accessToken}`

### Mô tả

- Nếu **đã tồn tại** cuộc trò chuyện riêng giữa bạn và `targetUserId` → trả về cuộc trò chuyện đó (không tạo mới).
- Nếu **chưa có** → tạo mới và trả về.
- Response nhận được có `is_direct: true` để phân biệt với nhóm chat thông thường.
- Cả hai người đều có role `ADMIN` trong DM (bình đẳng, không cần phân quyền).

### Request

Không có request body.

```
POST /api/v1/chat/groups/direct/7
Authorization: Bearer eyJhbGci...
```

### Response

```json
{
  "timestamp": 1711500000000,
  "status": 200,
  "message": "success",
  "data": {
    "id": 42,
    "name": null,
    "avatar": null,
    "member_count": 2,
    "my_role": "ADMIN",
    "is_direct": true,
    "created_at": 1711500000000
  }
}
```

**Các trường:**
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | Long | ID nhóm/cuộc trò chuyện (dùng để subscribe WebSocket và gọi API) |
| `name` | String \| null | Luôn `null` với DM — frontend tự hiển thị tên người kia |
| `avatar` | String \| null | Luôn `null` với DM — frontend dùng avatar người kia |
| `member_count` | int | Luôn = 2 với DM |
| `my_role` | String | `ADMIN` |
| `is_direct` | Boolean | `true` = DM, `false` = nhóm thông thường |
| `created_at` | Long | Timestamp milliseconds |

### Error cases

| HTTP | Trường hợp |
|------|-----------|
| 401 | Chưa đăng nhập |
| 404 | `targetUserId` không tồn tại |

### Flow UI đề xuất

```
User click vào profile của người khác
        ↓
Hiển thị nút "Nhắn tin"
        ↓
Gọi POST /api/v1/chat/groups/direct/{targetUserId}
        ↓
Nhận groupId từ response
        ↓
Navigate đến trang chat với groupId đó
Subscribe WebSocket: /topic/chat/{groupId}
        ↓
Hiển thị tên/avatar của người kia (không dùng group.name)
```

---

## 2. Leave Group — Rời nhóm

### Endpoint

```
DELETE /api/v1/chat/groups/{groupId}/leave
```

**Header:** `Authorization: Bearer {accessToken}`

### Mô tả

- Thành viên bất kỳ (kể cả admin) có thể tự rời khỏi nhóm.
- **Ngoại lệ:** Nếu bạn là **admin duy nhất** và vẫn còn thành viên khác → không thể rời. Phải chỉ định admin mới trước (`PUT /api/v1/chat/groups/{groupId}/members/{userId}/admin`), rồi mới rời.
- Nếu bạn là **thành viên cuối cùng** → nhóm sẽ tự động bị xóa (soft delete).
- Hành động được ghi vào lịch sử nhóm với action `LEAVE_GROUP`.

### Request

Không có request body.

```
DELETE /api/v1/chat/groups/15/leave
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

| HTTP | Code | Trường hợp |
|------|------|-----------|
| 400 | `org.oplearn.project.exception.base.chat.CannotLeaveGroupException` | Bạn là admin duy nhất, nhóm còn thành viên khác |
| 401 | — | Chưa đăng nhập |
| 403 | `org.oplearn.project.exception.base.chat.NotGroupMemberException` | Bạn không thuộc nhóm này |
| 404 | `org.oplearn.project.exception.base.chat.ChatGroupNotFoundException` | Nhóm không tồn tại |

### Flow UI đề xuất

```
User click "Rời nhóm" trong settings của nhóm
        ↓
Hiện confirm dialog: "Bạn có chắc muốn rời nhóm?"
        ↓
Gọi DELETE /api/v1/chat/groups/{groupId}/leave
        ↓
Nếu thành công (200):
    → Xóa nhóm khỏi danh sách chat
    → Navigate về trang danh sách chat
    → Ngắt WebSocket subscription cho groupId đó
        ↓
Nếu lỗi 400 (CannotLeaveGroupException):
    → Hiện thông báo: "Bạn là admin duy nhất của nhóm.
       Hãy chỉ định admin mới trước khi rời nhóm."
    → Gợi ý: Mở danh sách thành viên → chọn admin mới
```

### Quy tắc phân quyền

```
Thành viên thường    → Luôn có thể rời
Admin + còn admin khác → Có thể rời
Admin duy nhất + còn thành viên khác → KHÔNG THỂ rời (phải chỉ định admin mới)
Thành viên cuối cùng → Rời được, nhóm tự xóa
```

---

## 3. Tương tác với WebSocket sau khi có groupId

Sau khi có `groupId` từ DM API, dùng WebSocket để chat real-time (giống nhóm thông thường):

```javascript
// Subscribe nhận tin nhắn
stompClient.subscribe(`/topic/chat/${groupId}`, (frame) => {
  const message = JSON.parse(frame.body);
  appendMessage(message);
});

// Gửi tin nhắn qua REST (không dùng WebSocket để gửi)
fetch(`/api/v1/chat/groups/${groupId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ content: 'Hello!', message_type: 'TEXT' })
});
```

Xem thêm chi tiết WebSocket trong [CHAT_API.md](./CHAT_API.md).

---

## 4. Phân biệt DM vs Nhóm trong danh sách chat

Khi gọi `GET /api/v1/chat/groups` để lấy danh sách, mỗi item đều có `is_direct`:

```json
[
  {
    "id": 42,
    "name": null,
    "is_direct": true,
    "member_count": 2
  },
  {
    "id": 10,
    "name": "Nhóm Backend Team",
    "is_direct": false,
    "member_count": 8
  }
]
```

**Logic hiển thị tên phòng chat:**
```javascript
function getGroupDisplayName(group, members) {
  if (group.is_direct) {
    // Lấy tên người kia (không phải mình)
    const other = members.find(m => m.user_id !== currentUserId);
    return other?.full_name ?? 'Direct Message';
  }
  return group.name;
}
```

> Để lấy thông tin người kia trong DM, gọi `GET /api/v1/chat/groups/{groupId}` — lấy `members[]` và lọc ra người không phải mình.

---

## 5. Tóm tắt các endpoint liên quan

| Method | URL | Mô tả | Auth |
|--------|-----|-------|------|
| `POST` | `/api/v1/chat/groups/direct/{targetUserId}` | Tạo/mở DM với user | Required |
| `DELETE` | `/api/v1/chat/groups/{groupId}/leave` | Rời nhóm | Required |
| `GET` | `/api/v1/chat/groups` | Danh sách nhóm + DM của mình | Required |
| `GET` | `/api/v1/chat/groups/{groupId}` | Chi tiết nhóm (xem members) | Required |
| `PUT` | `/api/v1/chat/groups/{groupId}/members/{userId}/admin` | Chỉ định admin mới (trước khi rời) | Required (Admin only) |
