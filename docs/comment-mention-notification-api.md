# API: Bình Luận, Tag Người Dùng & Thông Báo

> **Yêu cầu xác thực:** Tất cả API (trừ đọc bình luận) đều yêu cầu JWT token trong header `Authorization: Bearer <token>`.
> User ID được lấy tự động từ token.

---

## Mục lục

1. [Đăng bình luận](#1-đăng-bình-luận)
2. [Xóa bình luận](#2-xóa-bình-luận)
3. [Xem bình luận của bài viết](#3-xem-bình-luận-của-bài-viết)
4. [Tìm kiếm user để tag @mention](#4-tìm-kiếm-user-để-tag-mention)
5. [Lấy danh sách thông báo](#5-lấy-danh-sách-thông-báo)
6. [Lấy số thông báo chưa đọc](#6-lấy-số-thông-báo-chưa-đọc)
7. [Đánh dấu một thông báo đã đọc](#7-đánh-dấu-một-thông-báo-đã-đọc)
8. [Đánh dấu tất cả thông báo đã đọc](#8-đánh-dấu-tất-cả-thông-báo-đã-đọc)
9. [Các API liên quan đã thay đổi](#9-các-api-liên-quan-đã-thay-đổi)
10. [Luồng nghiệp vụ Frontend](#10-luồng-nghiệp-vụ-frontend)
11. [Cấu trúc lỗi chung](#11-cấu-trúc-lỗi-chung)

---

## 1. Đăng bình luận

Tạo bình luận mới cho bài viết. Nếu có `mentioned_user_ids`, hệ thống sẽ tự động gửi thông báo đến từng người được tag.

### Endpoint

```
POST /api/v1/articles/{articleId}/comments
```

### Headers

| Header            | Required | Default | Description                   |
|-------------------|----------|---------|-------------------------------|
| `Authorization`   | **Yes**  | —       | `Bearer <jwt_token>`          |
| `Content-Type`    | **Yes**  | —       | `application/json`            |
| `Accept-Language` | No       | `en`    | Ngôn ngữ của response message |

### Path Parameters

| Tham số     | Type   | Required | Description          |
|-------------|--------|----------|----------------------|
| `articleId` | `Long` | **Yes**  | ID của bài viết      |

### Request Body

| Field                | Type           | Required | Mô tả                                         |
|----------------------|----------------|----------|-----------------------------------------------|
| `content`            | `String`       | **Yes**  | Nội dung bình luận (tối đa 2000 ký tự)        |
| `mentioned_user_ids` | `Array<Long>`  | No       | Danh sách ID user được tag @mention           |

#### Ví dụ Request — không tag

```json
{
  "content": "Bài viết rất hay!"
}
```

#### Ví dụ Request — có tag user

```json
{
  "content": "Bài này hay quá @nguyenvana @tranthib, mọi người nên đọc!",
  "mentioned_user_ids": [2, 5]
}
```

### Response thành công

**HTTP Status:** `201 Created`

#### Cấu trúc `data` (CommentResponse)

| Field              | Type                    | Mô tả                                        |
|--------------------|-------------------------|----------------------------------------------|
| `id`               | `Long`                  | ID bình luận                                 |
| `article_id`       | `Long`                  | ID bài viết                                  |
| `user_id`          | `Long`                  | ID người bình luận                           |
| `username`         | `String`                | Username người bình luận                     |
| `full_name`        | `String`                | Họ tên người bình luận                       |
| `avatar`           | `String` / `null`       | URL avatar người bình luận                   |
| `content`          | `String`                | Nội dung bình luận                           |
| `created_at`       | `Long`                  | Thời điểm tạo (Unix timestamp, ms)           |
| `mentioned_users`  | `Array<Object>` / `null`| Danh sách user được tag (null nếu không có)  |

#### Cấu trúc từng phần tử trong `mentioned_users`

| Field       | Type     | Mô tả              |
|-------------|----------|--------------------|
| `user_id`   | `Long`   | ID user được tag   |
| `username`  | `String` | Username           |
| `full_name` | `String` | Họ tên             |

#### Ví dụ Response

```json
{
  "status": 201,
  "message": "Success",
  "data": {
    "id": 42,
    "article_id": 101,
    "user_id": 1,
    "username": "admin",
    "full_name": "Quản trị viên",
    "avatar": null,
    "content": "Bài này hay quá @nguyenvana @tranthib, mọi người nên đọc!",
    "created_at": 1742862000000,
    "mentioned_users": [
      { "user_id": 2, "username": "nguyenvana", "full_name": "Nguyễn Văn A" },
      { "user_id": 5, "username": "tranthib", "full_name": "Trần Thị B" }
    ]
  },
  "timestamp": "2026-03-26 10:00:00"
}
```

### Response lỗi

| HTTP Status | Mô tả                                |
|-------------|--------------------------------------|
| `400`       | `content` bị thiếu hoặc rỗng        |
| `401`       | Chưa đăng nhập / token không hợp lệ |
| `404`       | Bài viết không tồn tại               |

---

## 2. Xóa bình luận

Chỉ **chủ sở hữu** bình luận mới có thể xóa. Thực hiện soft-delete.

### Endpoint

```
DELETE /api/v1/articles/comments/{commentId}
```

### Headers

| Header            | Required | Default | Description                   |
|-------------------|----------|---------|-------------------------------|
| `Authorization`   | **Yes**  | —       | `Bearer <jwt_token>`          |
| `Accept-Language` | No       | `en`    | Ngôn ngữ của response message |

### Path Parameters

| Tham số     | Type   | Required | Description         |
|-------------|--------|----------|---------------------|
| `commentId` | `Long` | **Yes**  | ID của bình luận    |

### Response thành công

**HTTP Status:** `200 OK`

```json
{
  "status": 200,
  "message": "Success",
  "data": null,
  "timestamp": "2026-03-26 10:05:00"
}
```

### Response lỗi

| HTTP Status | Mô tả                                            |
|-------------|--------------------------------------------------|
| `401`       | Chưa đăng nhập / token không hợp lệ             |
| `403`       | Không có quyền xóa bình luận của người khác     |
| `404`       | Bình luận không tồn tại                          |

---

## 3. Xem bình luận của bài viết

Lấy danh sách bình luận của một bài viết, sắp xếp theo thời gian **cũ nhất trước** (chronological).

### Endpoint

```
GET /api/v1/articles/{articleId}/comments
```

### Headers

| Header            | Required | Default | Description                   |
|-------------------|----------|---------|-------------------------------|
| `Authorization`   | No       | —       | Có thể xem không cần login    |
| `Accept-Language` | No       | `en`    | Ngôn ngữ của response message |

### Path Parameters

| Tham số     | Type   | Required | Description     |
|-------------|--------|----------|-----------------|
| `articleId` | `Long` | **Yes**  | ID của bài viết |

### Query Parameters

| Tham số | Type      | Required | Default | Description             |
|---------|-----------|----------|---------|-------------------------|
| `page`  | `Integer` | No       | `0`     | Số trang (bắt đầu từ 0) |
| `size`  | `Integer` | No       | `10`    | Số phần tử mỗi trang    |

### Response thành công

**HTTP Status:** `200 OK`

#### Cấu trúc `data` (PageResponse)

| Field     | Type            | Mô tả                        |
|-----------|-----------------|------------------------------|
| `content` | `Array<Object>` | Danh sách bình luận          |
| `amount`  | `int`           | Tổng số bình luận của bài viết |

#### Ví dụ Response

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": 10,
        "article_id": 101,
        "user_id": 3,
        "username": "tranthib",
        "full_name": "Trần Thị B",
        "avatar": "https://example.com/avatars/b.jpg",
        "content": "Cảm ơn đã chia sẻ bài viết thú vị!",
        "created_at": 1742861000000,
        "mentioned_users": null
      },
      {
        "id": 42,
        "article_id": 101,
        "user_id": 1,
        "username": "admin",
        "full_name": "Quản trị viên",
        "avatar": null,
        "content": "Bài này hay quá @nguyenvana, mọi người nên đọc!",
        "created_at": 1742862000000,
        "mentioned_users": [
          { "user_id": 2, "username": "nguyenvana", "full_name": "Nguyễn Văn A" }
        ]
      }
    ],
    "amount": 12
  },
  "timestamp": "2026-03-26 10:10:00"
}
```

---

## 4. Tìm kiếm user để tag @mention

Gọi API này khi người dùng gõ `@` trong ô bình luận để hiển thị danh sách gợi ý. Kết quả trả về thông tin tối thiểu cần thiết cho UI dropdown.

### Endpoint

```
GET /api/v1/users/mention-search
```

### Headers

| Header            | Required | Default | Description                   |
|-------------------|----------|---------|-------------------------------|
| `Authorization`   | **Yes**  | —       | `Bearer <jwt_token>`          |
| `Accept-Language` | No       | `en`    | Ngôn ngữ của response message |

### Query Parameters

| Tham số   | Type      | Required | Default | Description                                  |
|-----------|-----------|----------|---------|----------------------------------------------|
| `keyword` | `String`  | No       | `""`    | Từ khóa tìm theo username hoặc họ tên        |
| `page`    | `Integer` | No       | `0`     | Số trang                                     |
| `size`    | `Integer` | No       | `10`    | Số kết quả (khuyến nghị 5–10 cho dropdown)   |

### Response thành công

**HTTP Status:** `200 OK`

#### Cấu trúc từng phần tử trong `content` (UserMentionResponse)

| Field       | Type              | Mô tả                     |
|-------------|-------------------|---------------------------|
| `id`        | `Long`            | ID user (dùng làm mention) |
| `username`  | `String`          | Username                  |
| `full_name` | `String`          | Họ tên đầy đủ             |
| `avatar`    | `String` / `null` | URL avatar                |

#### Ví dụ Request

```
GET /api/v1/users/mention-search?keyword=nguyen&size=5
```

#### Ví dụ Response

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "content": [
      { "id": 2, "username": "nguyenvana", "full_name": "Nguyễn Văn A", "avatar": null },
      { "id": 7, "username": "nguyenthic", "full_name": "Nguyễn Thị C", "avatar": "https://example.com/avatars/c.jpg" }
    ],
    "amount": 2
  },
  "timestamp": "2026-03-26 10:15:00"
}
```

---

## 5. Lấy danh sách thông báo

Lấy tất cả thông báo của user hiện tại, sắp xếp **mới nhất trước**.

### Endpoint

```
GET /api/v1/notifications
```

### Headers

| Header            | Required | Default | Description                   |
|-------------------|----------|---------|-------------------------------|
| `Authorization`   | **Yes**  | —       | `Bearer <jwt_token>`          |
| `Accept-Language` | No       | `en`    | Ngôn ngữ của response message |

### Query Parameters

| Tham số | Type      | Required | Default | Description                             |
|---------|-----------|----------|---------|-----------------------------------------|
| `page`  | `Integer` | No       | `0`     | Số trang (bắt đầu từ 0)                |
| `size`  | `Integer` | No       | `20`    | Số phần tử mỗi trang                   |

### Response thành công

**HTTP Status:** `200 OK`

#### Cấu trúc từng phần tử trong `content` (NotificationResponse)

| Field              | Type      | Mô tả                                          |
|--------------------|-----------|------------------------------------------------|
| `id`               | `Long`    | ID thông báo                                   |
| `sender_user_id`   | `Long`    | ID người gửi/tạo hành động                    |
| `sender_full_name` | `String`  | Tên người gửi                                  |
| `type`             | `String`  | Loại thông báo (xem [Bảng loại thông báo](#bảng-loại-thông-báo)) |
| `message`          | `String`  | Nội dung thông báo đã dịch                     |
| `article_id`       | `Long`    | ID bài viết liên quan (dùng để điều hướng)    |
| `comment_id`       | `Long`    | ID bình luận liên quan                         |
| `is_read`          | `Boolean` | `false` = chưa đọc, `true` = đã đọc           |
| `created_at`       | `Long`    | Thời điểm tạo (Unix timestamp, ms)             |

#### Bảng loại thông báo

| `type`               | Ý nghĩa                              |
|----------------------|--------------------------------------|
| `MENTION_IN_COMMENT` | Có người tag @bạn trong bình luận    |

#### Ví dụ Response

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": 15,
        "sender_user_id": 1,
        "sender_full_name": "Quản trị viên",
        "type": "MENTION_IN_COMMENT",
        "message": "Quản trị viên đã nhắc đến bạn trong một bình luận",
        "article_id": 101,
        "comment_id": 42,
        "is_read": false,
        "created_at": 1742862000000
      },
      {
        "id": 8,
        "sender_user_id": 3,
        "sender_full_name": "Trần Thị B",
        "type": "MENTION_IN_COMMENT",
        "message": "Trần Thị B đã nhắc đến bạn trong một bình luận",
        "article_id": 88,
        "comment_id": 31,
        "is_read": true,
        "created_at": 1742750000000
      }
    ],
    "amount": 8
  },
  "timestamp": "2026-03-26 10:20:00"
}
```

---

## 6. Lấy số thông báo chưa đọc

Dùng để hiển thị **badge số** (chấm đỏ / con số) trên icon chuông ở gần nút đăng xuất. Gọi API này khi load trang hoặc theo polling định kỳ.

### Endpoint

```
GET /api/v1/notifications/unread-count
```

### Headers

| Header            | Required | Default | Description                   |
|-------------------|----------|---------|-------------------------------|
| `Authorization`   | **Yes**  | —       | `Bearer <jwt_token>`          |
| `Accept-Language` | No       | `en`    | Ngôn ngữ của response message |

### Response thành công

**HTTP Status:** `200 OK`

| Field          | Type   | Mô tả                    |
|----------------|--------|--------------------------|
| `unread_count` | `Long` | Số thông báo chưa đọc    |

#### Ví dụ Response

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "unread_count": 3
  },
  "timestamp": "2026-03-26 10:25:00"
}
```

---

## 7. Đánh dấu một thông báo đã đọc

Gọi khi người dùng **click vào một thông báo** trong danh sách.

### Endpoint

```
PATCH /api/v1/notifications/{notificationId}/read
```

### Headers

| Header            | Required | Default | Description                   |
|-------------------|----------|---------|-------------------------------|
| `Authorization`   | **Yes**  | —       | `Bearer <jwt_token>`          |
| `Accept-Language` | No       | `en`    | Ngôn ngữ của response message |

### Path Parameters

| Tham số          | Type   | Required | Description       |
|------------------|--------|----------|-------------------|
| `notificationId` | `Long` | **Yes**  | ID của thông báo  |

### Response thành công

**HTTP Status:** `200 OK`

```json
{
  "status": 200,
  "message": "Success",
  "data": null,
  "timestamp": "2026-03-26 10:30:00"
}
```

### Response lỗi

| HTTP Status | Mô tả                                |
|-------------|--------------------------------------|
| `401`       | Chưa đăng nhập / token không hợp lệ |

> **Lưu ý:** Nếu `notificationId` không thuộc về user hiện tại, API sẽ không làm gì (không trả lỗi). Thiết kế này an toàn — không leak thông tin thông báo của người khác.

---

## 8. Đánh dấu tất cả thông báo đã đọc

Gọi khi người dùng click **"Đánh dấu tất cả là đã đọc"** trong panel thông báo.

### Endpoint

```
PATCH /api/v1/notifications/read-all
```

### Headers

| Header            | Required | Default | Description                   |
|-------------------|----------|---------|-------------------------------|
| `Authorization`   | **Yes**  | —       | `Bearer <jwt_token>`          |
| `Accept-Language` | No       | `en`    | Ngôn ngữ của response message |

### Response thành công

**HTTP Status:** `200 OK`

```json
{
  "status": 200,
  "message": "Success",
  "data": null,
  "timestamp": "2026-03-26 10:35:00"
}
```

---

## 9. Các API liên quan đã thay đổi

### `GET /api/v1/users/mention-search` — API mới thêm vào UserController

API tìm kiếm user để tag. Xem chi tiết ở [mục 4](#4-tìm-kiếm-user-để-tag-mention).

> **Không có API nào cũ bị thay đổi.** Toàn bộ tính năng comment, mention, notification đều là endpoint **mới hoàn toàn**.

---

## 10. Luồng nghiệp vụ Frontend

### Luồng đăng bình luận có @mention

```
1. User gõ @ trong ô comment
        ↓
2. Frontend gọi GET /api/v1/users/mention-search?keyword={text_sau_@}&size=5
        ↓
3. Hiển thị dropdown danh sách user gợi ý (id, username, full_name, avatar)
        ↓
4. User chọn một người → frontend lưu userId vào mảng mentionedUserIds
        ↓
5. User bấm Gửi → frontend gọi POST /api/v1/articles/{articleId}/comments
   với body: { content: "...", mentioned_user_ids: [2, 5] }
        ↓
6. Backend tự động gửi thông báo đến user được tag
```

### Luồng hiển thị badge thông báo (icon chuông)

```
1. Khi load trang (sau khi login):
   → Gọi GET /api/v1/notifications/unread-count
   → Hiển thị số lên badge

2. Khi user click vào icon chuông:
   → Gọi GET /api/v1/notifications?page=0&size=20
   → Render danh sách (is_read=false → highlight chưa đọc)

3. Khi user click vào một thông báo:
   → Gọi PATCH /api/v1/notifications/{id}/read
   → Điều hướng đến bài viết: /articles/{article_id}#comment-{comment_id}
   → Cập nhật badge (unread_count - 1)

4. Khi user click "Đánh dấu tất cả đã đọc":
   → Gọi PATCH /api/v1/notifications/read-all
   → Cập nhật badge về 0
```

### Luồng render bình luận trong bài viết

```
1. Khi load trang chi tiết bài viết:
   → Gọi GET /api/v1/articles/{articleId}/comments?page=0&size=10

2. Với mỗi comment có mentioned_users != null:
   → Highlight @username trong nội dung content bằng cách match username
   → Ví dụ: "Bài hay @nguyenvana" → "Bài hay <span class='mention'>@nguyenvana</span>"

3. Phân trang comment: dùng `amount` để tính totalPages
```

---

## 11. Cấu trúc lỗi chung

```json
{
  "status": <http_status_code>,
  "message": "<mô tả lỗi>",
  "data": null,
  "timestamp": "2026-03-26 10:00:00"
}
```

### Bảng mã lỗi

| HTTP Status | Trường hợp                                                          |
|-------------|---------------------------------------------------------------------|
| `400`       | Request không hợp lệ (content rỗng, vượt 2000 ký tự...)           |
| `401`       | Chưa đăng nhập hoặc JWT token hết hạn / không hợp lệ              |
| `403`       | Không có quyền (xóa comment của người khác)                        |
| `404`       | Bài viết / bình luận không tồn tại                                  |
| `500`       | Lỗi server                                                          |

---

## Tổng hợp tất cả API mới

| # | Method   | Endpoint                                          | Auth | Mô tả                              |
|---|----------|---------------------------------------------------|------|------------------------------------|
| 1 | `POST`   | `/api/v1/articles/{articleId}/comments`           | Yes  | Đăng bình luận (có thể tag @user)  |
| 2 | `DELETE` | `/api/v1/articles/comments/{commentId}`           | Yes  | Xóa bình luận (chỉ chủ sở hữu)    |
| 3 | `GET`    | `/api/v1/articles/{articleId}/comments`           | No   | Xem danh sách bình luận bài viết   |
| 4 | `GET`    | `/api/v1/users/mention-search?keyword=`           | Yes  | Tìm kiếm user để tag @mention      |
| 5 | `GET`    | `/api/v1/notifications`                           | Yes  | Danh sách thông báo của tôi        |
| 6 | `GET`    | `/api/v1/notifications/unread-count`              | Yes  | Số thông báo chưa đọc (cho badge)  |
| 7 | `PATCH`  | `/api/v1/notifications/{notificationId}/read`     | Yes  | Đánh dấu một thông báo đã đọc     |
| 8 | `PATCH`  | `/api/v1/notifications/read-all`                  | Yes  | Đánh dấu tất cả thông báo đã đọc  |
