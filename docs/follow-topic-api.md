# Follow Topic API

Cho phép người dùng theo dõi (follow) các topic theo từng source. Màn hình hiển thị cây source → topics để người dùng chọn follow. Bài báo ở màn articles có thể lọc chỉ hiển thị các bài từ topic đang follow.

---

## 1. Xem tất cả Source kèm Topics (có trạng thái followed)

**Endpoint:** `GET /api/v1/sources/all-with-topics`

**Auth:** Required (JWT Bearer Token)

**Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "VnExpress",
      "url": "https://vnexpress.net",
      "avatar": "https://...",
      "type": 1,
      "description": "Báo điện tử VnExpress",
      "topics": [
        {
          "id": 10,
          "name": "Thời sự",
          "url": "https://vnexpress.net/thoi-su",
          "rss_url": "https://vnexpress.net/rss/thoi-su.rss",
          "description": "Tin tức thời sự",
          "followed": true
        },
        {
          "id": 11,
          "name": "Thể thao",
          "url": "https://vnexpress.net/the-thao",
          "rss_url": "https://vnexpress.net/rss/the-thao.rss",
          "description": "Tin tức thể thao",
          "followed": false
        }
      ]
    }
  ]
}
```

> Trường `followed` trên mỗi topic cho biết user hiện tại có đang follow topic đó không. Dùng màn hình này để render cây source → topics với toggle follow.

---

## 2. Follow một Topic

**Endpoint:** `POST /api/v1/topics/{topicId}/follow`

**Auth:** Required

**Path Variable:** `topicId` — ID của topic muốn follow

**Response (201 Created):**
```json
{
  "status": 201,
  "message": "Success",
  "data": null
}
```

**Lỗi:**
| HTTP | Mô tả |
|------|-------|
| 404  | Topic không tồn tại |
| 409  | Đã follow topic này rồi |
| 401  | Chưa đăng nhập |

---

## 3. Unfollow một Topic

**Endpoint:** `DELETE /api/v1/topics/{topicId}/follow`

**Auth:** Required

**Path Variable:** `topicId` — ID của topic muốn unfollow

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Success",
  "data": null
}
```

**Lỗi:**
| HTTP | Mô tả |
|------|-------|
| 404  | Chưa follow topic này |
| 401  | Chưa đăng nhập |

---

## 4. Lấy danh sách Topics đang Follow

**Endpoint:** `GET /api/v1/topics/following`

**Auth:** Required

**Query Params:**
| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| page  | int  | 0       | Số trang (bắt đầu từ 0) |
| size  | int  | 10      | Số bản ghi mỗi trang |

**Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "data": [
      {
        "id": 5,
        "topic_id": 10,
        "topic_name": "Thời sự",
        "topic_url": "https://vnexpress.net/thoi-su",
        "rss_url": "https://vnexpress.net/rss/thoi-su.rss",
        "source_id": 1,
        "source_name": "VnExpress",
        "followed_at": 1712623200000
      }
    ],
    "total": 1
  }
}
```

---

## 5. Lọc Bài Báo Theo Topics Đang Follow

Thêm trường `followed_only: true` vào request body của filter articles.

**Endpoint:** `POST /api/v1/articles/filter`

**Auth:** Required (khi dùng `followed_only: true`)

**Request Body:**
```json
{
  "page": 0,
  "size": 10,
  "keyword": "",
  "followed_only": true,
  "from_pub_date": "01/01/2025",
  "to_pub_date": "31/12/2025"
}
```

> Khi `followed_only: true`, các trường `topic_id` và `source_id` bị bỏ qua — hệ thống tự động lấy danh sách topic IDs mà user đang follow và lọc theo đó.
>
> Nếu user chưa follow topic nào, kết quả trả về danh sách rỗng.

**Response:** Giống như filter thông thường.

---

## Luồng sử dụng (UX Flow)

```
1. User vào màn "Theo dõi"
   → Gọi GET /api/v1/sources/all-with-topics
   → Hiển thị cây: Source > [Topic1 (followed), Topic2, ...]

2. User click toggle Follow trên Topic
   → Gọi POST /api/v1/topics/{topicId}/follow
   → Cập nhật UI: followed = true

3. User click toggle Unfollow
   → Gọi DELETE /api/v1/topics/{topicId}/follow
   → Cập nhật UI: followed = false

4. User vào màn "Articles" và bật filter "Chỉ xem bài theo dõi"
   → Gọi POST /api/v1/articles/filter với followed_only: true
   → Hiển thị chỉ bài báo từ các topic đang follow

5. User xem danh sách topic đang follow
   → Gọi GET /api/v1/topics/following
```

---

## Database

Bảng `user_follow_topics`:

| Column         | Type    | Description             |
|----------------|---------|-------------------------|
| id             | BIGINT  | PK, auto increment      |
| user_id        | BIGINT  | FK → users.id           |
| topic_id       | BIGINT  | FK → topics.id          |
| deleted        | BOOLEAN | Soft delete             |
| created_at     | BIGINT  | Timestamp (ms) khi follow |
| created_by     | VARCHAR | Username người tạo      |
| last_updated_at| BIGINT  | Timestamp cập nhật cuối |
| last_updated_by| VARCHAR | Username cập nhật cuối  |
