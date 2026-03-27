# API: Filter Articles

## Endpoint

```
POST /api/v1/articles/filter
```

## Headers

| Header     | Required | Default | Description                  |
|------------|----------|---------|------------------------------|
| `language` | No       | `en`    | Ngôn ngữ của response message |

---

## Request Body

**Content-Type:** `application/json`

| Field          | Type      | Required | Description                          |
|----------------|-----------|----------|--------------------------------------|
| `page`         | `Integer` | No       | Số trang (bắt đầu từ 0)              |
| `size`         | `Integer` | No       | Số phần tử mỗi trang                 |
| `keyword`      | `String`  | No       | Từ khóa tìm kiếm (title, description)|
| `topic_id`     | `Long`    | No       | ID của topic cần lọc                 |
| `source_id`    | `Long`    | No       | ID của nguồn tin cần lọc             |
| `from_pub_date`| `String`  | No       | Ngày bắt đầu, định dạng `DD/MM/YYYY` |
| `to_pub_date`  | `String`  | No       | Ngày kết thúc, định dạng `DD/MM/YYYY`|

### Ví dụ Request

```json
{
  "page": 0,
  "size": 10,
  "keyword": "công nghệ",
  "topic_id": 1,
  "source_id": 2,
  "from_pub_date": "01/01/2025",
  "to_pub_date": "31/03/2025"
}
```

---

## Response

**HTTP Status:** `200 OK`

### Cấu trúc Response

| Field       | Type     | Description                          |
|-------------|----------|--------------------------------------|
| `status`    | `int`    | HTTP status code (`200`)             |
| `message`   | `String` | Thông báo kết quả                    |
| `data`      | `Object` | Dữ liệu trả về (PageResponse)        |
| `timestamp` | `String` | Thời gian xử lý request              |

### Cấu trúc `data` (PageResponse)

| Field     | Type            | Description                     |
|-----------|-----------------|---------------------------------|
| `content` | `Array<Object>` | Danh sách bài viết              |
| `amount`  | `int`           | Tổng số bài viết thỏa điều kiện |

### Cấu trúc từng phần tử trong `content` (ArticleFilterResponse)

| Field        | Type     | Description                              |
|--------------|----------|------------------------------------------|
| `id`         | `Long`   | ID bài viết                              |
| `title`      | `String` | Tiêu đề bài viết                         |
| `link`       | `String` | URL gốc của bài viết                     |
| `guid`       | `String` | GUID định danh duy nhất từ nguồn RSS     |
| `description`| `String` | Mô tả / tóm tắt nội dung bài viết       |
| `pub_date`   | `Long`   | Ngày đăng (Unix timestamp, milliseconds) |
| `image_link` | `String` | URL ảnh đại diện                         |
| `topic_id`   | `Long`   | ID của topic                             |
| `topic_name` | `String` | Tên topic                                |
| `created_by` | `String` | Người tạo bài viết                       |
| `created_at` | `Long`   | Thời điểm tạo (Unix timestamp, ms)       |
| `source_name`| `String` | Tên nguồn tin                            |

### Ví dụ Response

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": 101,
        "title": "Công nghệ AI thay đổi thế giới",
        "link": "https://example.com/ai-article",
        "guid": "abc123-guid",
        "description": "Tóm tắt về sự phát triển của AI...",
        "pub_date": 1742860800000,
        "image_link": "https://example.com/images/ai.jpg",
        "topic_id": 1,
        "topic_name": "Công nghệ",
        "created_by": "admin",
        "created_at": 1742860900000,
        "source_name": "VnExpress"
      }
    ],
    "amount": 50
  },
  "timestamp": "2026-03-25 10:00:00"
}
```

---

## Lưu ý

- Tất cả các field trong request đều là **optional**. Nếu không truyền, API sẽ trả về toàn bộ bài viết theo phân trang mặc định.
- `pub_date` và `created_at` trả về dưới dạng **Unix timestamp (milliseconds)**.
- `amount` là tổng số bài viết thỏa điều kiện lọc (dùng để tính tổng số trang ở phía client).
- Các field trong request/response sử dụng định dạng **snake_case**.
