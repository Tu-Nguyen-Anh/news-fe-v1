# API: Bài Viết Yêu Thích & Lịch Sử Xem

> **Yêu cầu xác thực:** Tất cả các API trong tài liệu này đều yêu cầu JWT token hợp lệ trong header `Authorization: Bearer <token>`.
> User ID được lấy tự động từ token, **không cần truyền userId trong request**.

---

## Mục lục

1. [Thêm bài viết yêu thích](#1-thêm-bài-viết-yêu-thích)
2. [Xóa bài viết yêu thích](#2-xóa-bài-viết-yêu-thích)
3. [Danh sách bài viết yêu thích](#3-danh-sách-bài-viết-yêu-thích)
4. [Ghi nhận lượt xem bài viết](#4-ghi-nhận-lượt-xem-bài-viết)
5. [Lịch sử bài viết đã xem](#5-lịch-sử-bài-viết-đã-xem)
6. [Cấu trúc lỗi chung](#6-cấu-trúc-lỗi-chung)

---

## 1. Thêm bài viết yêu thích

### Endpoint

```
POST /api/v1/articles/{articleId}/favorites
```

### Headers

| Header          | Required | Default | Description                   |
|-----------------|----------|---------|-------------------------------|
| `Authorization` | **Yes**  | —       | `Bearer <jwt_token>`          |
| `Accept-Language` | No     | `en`    | Ngôn ngữ của response message |

### Path Parameters

| Tham số     | Type   | Required | Description          |
|-------------|--------|----------|----------------------|
| `articleId` | `Long` | **Yes**  | ID của bài viết      |

### Response thành công

**HTTP Status:** `201 Created`

```json
{
  "status": 201,
  "message": "Success",
  "data": null,
  "timestamp": "2026-03-26 10:00:00"
}
```

### Response lỗi

| HTTP Status | Mô tả                                          |
|-------------|------------------------------------------------|
| `401`       | Chưa đăng nhập / token không hợp lệ           |
| `404`       | Bài viết không tồn tại                         |
| `409`       | Bài viết đã được thêm vào yêu thích trước đó  |

**Ví dụ lỗi 409:**
```json
{
  "status": 409,
  "message": "Conflict occurred",
  "data": null,
  "timestamp": "2026-03-26 10:00:00"
}
```

---

## 2. Xóa bài viết yêu thích

### Endpoint

```
DELETE /api/v1/articles/{articleId}/favorites
```

### Headers

| Header          | Required | Default | Description                   |
|-----------------|----------|---------|-------------------------------|
| `Authorization` | **Yes**  | —       | `Bearer <jwt_token>`          |
| `Accept-Language` | No     | `en`    | Ngôn ngữ của response message |

### Path Parameters

| Tham số     | Type   | Required | Description     |
|-------------|--------|----------|-----------------|
| `articleId` | `Long` | **Yes**  | ID của bài viết |

### Response thành công

**HTTP Status:** `200 OK`

```json
{
  "status": 200,
  "message": "Success",
  "data": null,
  "timestamp": "2026-03-26 10:00:00"
}
```

### Response lỗi

| HTTP Status | Mô tả                                              |
|-------------|----------------------------------------------------|
| `401`       | Chưa đăng nhập / token không hợp lệ               |
| `404`       | Bài viết chưa được thêm vào yêu thích             |

---

## 3. Danh sách bài viết yêu thích

### Endpoint

```
GET /api/v1/articles/favorites
```

### Headers

| Header          | Required | Default | Description                   |
|-----------------|----------|---------|-------------------------------|
| `Authorization` | **Yes**  | —       | `Bearer <jwt_token>`          |
| `Accept-Language` | No     | `en`    | Ngôn ngữ của response message |

### Query Parameters

| Tham số | Type      | Required | Default | Description                  |
|---------|-----------|----------|---------|------------------------------|
| `page`  | `Integer` | No       | `0`     | Số trang (bắt đầu từ 0)      |
| `size`  | `Integer` | No       | `10`    | Số phần tử mỗi trang         |

### Response thành công

**HTTP Status:** `200 OK`

#### Cấu trúc `data` (PageResponse)

| Field     | Type            | Description                               |
|-----------|-----------------|-------------------------------------------|
| `content` | `Array<Object>` | Danh sách bài viết yêu thích             |
| `amount`  | `int`           | Tổng số bài viết yêu thích (để phân trang) |

#### Cấu trúc từng phần tử trong `content` (FavoriteArticleResponse)

| Field        | Type     | Description                                  |
|--------------|----------|----------------------------------------------|
| `id`         | `Long`   | ID bản ghi yêu thích                         |
| `user_id`    | `Long`   | ID người dùng                                |
| `article_id` | `Long`   | ID bài viết                                  |
| `title`      | `String` | Tiêu đề bài viết                             |
| `link`       | `String` | URL gốc của bài viết                         |
| `image_link` | `String` | URL ảnh đại diện bài viết                    |
| `pub_date`   | `Long`   | Ngày đăng bài (Unix timestamp, milliseconds) |
| `topic_name` | `String` | Tên topic                                    |
| `source_name`| `String` | Tên nguồn tin                                |
| `created_at` | `Long`   | Thời điểm thêm yêu thích (Unix timestamp, ms)|

#### Ví dụ Response

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": 5,
        "user_id": 1,
        "article_id": 101,
        "title": "Công nghệ AI thay đổi thế giới",
        "link": "https://example.com/ai-article",
        "image_link": "https://example.com/images/ai.jpg",
        "pub_date": 1742860800000,
        "topic_name": "Công nghệ",
        "source_name": "VnExpress",
        "created_at": 1742861000000
      },
      {
        "id": 3,
        "user_id": 1,
        "article_id": 88,
        "title": "Thị trường chứng khoán hôm nay",
        "link": "https://example.com/stocks",
        "image_link": "https://example.com/images/stocks.jpg",
        "pub_date": 1742770000000,
        "topic_name": "Tài chính",
        "source_name": "CafeF",
        "created_at": 1742860500000
      }
    ],
    "amount": 2
  },
  "timestamp": "2026-03-26 10:00:00"
}
```

### Response lỗi

| HTTP Status | Mô tả                                |
|-------------|--------------------------------------|
| `401`       | Chưa đăng nhập / token không hợp lệ |

---

## 4. Ghi nhận lượt xem bài viết

> Gọi API này mỗi khi người dùng **mở xem nội dung** một bài viết. Mỗi lần gọi sẽ tạo một bản ghi mới trong lịch sử (cho phép lịch sử trùng lặp để phản ánh số lần xem thực tế).

### Endpoint

```
POST /api/v1/articles/{articleId}/view
```

### Headers

| Header          | Required | Default | Description                   |
|-----------------|----------|---------|-------------------------------|
| `Authorization` | **Yes**  | —       | `Bearer <jwt_token>`          |
| `Accept-Language` | No     | `en`    | Ngôn ngữ của response message |

### Path Parameters

| Tham số     | Type   | Required | Description     |
|-------------|--------|----------|-----------------|
| `articleId` | `Long` | **Yes**  | ID của bài viết |

### Response thành công

**HTTP Status:** `201 Created`

```json
{
  "status": 201,
  "message": "Success",
  "data": null,
  "timestamp": "2026-03-26 10:05:00"
}
```

### Response lỗi

| HTTP Status | Mô tả                                |
|-------------|--------------------------------------|
| `401`       | Chưa đăng nhập / token không hợp lệ |
| `404`       | Bài viết không tồn tại               |

---

## 5. Lịch sử bài viết đã xem

### Endpoint

```
GET /api/v1/articles/view-history
```

### Headers

| Header          | Required | Default | Description                   |
|-----------------|----------|---------|-------------------------------|
| `Authorization` | **Yes**  | —       | `Bearer <jwt_token>`          |
| `Accept-Language` | No     | `en`    | Ngôn ngữ của response message |

### Query Parameters

| Tham số | Type      | Required | Default | Description             |
|---------|-----------|----------|---------|-------------------------|
| `page`  | `Integer` | No       | `0`     | Số trang (bắt đầu từ 0) |
| `size`  | `Integer` | No       | `10`    | Số phần tử mỗi trang    |

### Response thành công

**HTTP Status:** `200 OK`

#### Cấu trúc `data` (PageResponse)

| Field     | Type            | Description                                   |
|-----------|-----------------|-----------------------------------------------|
| `content` | `Array<Object>` | Danh sách bài viết đã xem                    |
| `amount`  | `int`           | Tổng số bản ghi lịch sử (để phân trang)      |

#### Cấu trúc từng phần tử trong `content` (ArticleViewHistoryResponse)

| Field        | Type     | Description                                  |
|--------------|----------|----------------------------------------------|
| `id`         | `Long`   | ID bản ghi lịch sử                           |
| `user_id`    | `Long`   | ID người dùng                                |
| `article_id` | `Long`   | ID bài viết                                  |
| `title`      | `String` | Tiêu đề bài viết                             |
| `link`       | `String` | URL gốc của bài viết                         |
| `image_link` | `String` | URL ảnh đại diện bài viết                    |
| `pub_date`   | `Long`   | Ngày đăng bài (Unix timestamp, milliseconds) |
| `topic_name` | `String` | Tên topic                                    |
| `source_name`| `String` | Tên nguồn tin                                |
| `viewed_at`  | `Long`   | Thời điểm xem bài viết (Unix timestamp, ms)  |

#### Ví dụ Response

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": 12,
        "user_id": 1,
        "article_id": 101,
        "title": "Công nghệ AI thay đổi thế giới",
        "link": "https://example.com/ai-article",
        "image_link": "https://example.com/images/ai.jpg",
        "pub_date": 1742860800000,
        "topic_name": "Công nghệ",
        "source_name": "VnExpress",
        "viewed_at": 1742862000000
      },
      {
        "id": 10,
        "user_id": 1,
        "article_id": 55,
        "title": "Dự báo thời tiết tuần tới",
        "link": "https://example.com/weather",
        "image_link": "https://example.com/images/weather.jpg",
        "pub_date": 1742700000000,
        "topic_name": "Xã hội",
        "source_name": "Tuổi Trẻ",
        "viewed_at": 1742855000000
      }
    ],
    "amount": 35
  },
  "timestamp": "2026-03-26 10:10:00"
}
```

### Response lỗi

| HTTP Status | Mô tả                                |
|-------------|--------------------------------------|
| `401`       | Chưa đăng nhập / token không hợp lệ |

---

## 6. Cấu trúc lỗi chung

Tất cả response lỗi đều theo cấu trúc sau:

```json
{
  "status": <http_status_code>,
  "message": "<mô tả lỗi>",
  "data": null,
  "timestamp": "2026-03-26 10:00:00"
}
```

### Bảng mã lỗi phổ biến

| HTTP Status | Trường hợp                                                      |
|-------------|-----------------------------------------------------------------|
| `400`       | Request không hợp lệ (sai định dạng tham số)                   |
| `401`       | Chưa đăng nhập hoặc JWT token hết hạn / không hợp lệ           |
| `403`       | Không có quyền thực hiện thao tác này                           |
| `404`       | Bài viết không tồn tại / bản ghi yêu thích không tìm thấy      |
| `409`       | Bài viết đã được thêm vào yêu thích (trùng lặp)                |
| `500`       | Lỗi server                                                      |

---

## Lưu ý khi tích hợp Frontend

1. **Authentication:** Lưu JWT token sau khi đăng nhập và đính kèm vào tất cả request dưới dạng `Authorization: Bearer <token>`.

2. **Ghi nhận lượt xem:** Gọi `POST /articles/{articleId}/view` ngay khi component chi tiết bài viết được mount/render (không cần chờ user scroll hết bài).

3. **Yêu thích:** Kiểm tra trạng thái yêu thích bằng cách gọi `GET /articles/favorites` và so sánh `article_id` với bài viết đang hiển thị. Nếu nhận `409` khi thêm, cập nhật UI sang trạng thái "đã yêu thích".

4. **Timestamp:** Tất cả các trường `pub_date`, `created_at`, `viewed_at` đều là **Unix timestamp tính bằng milliseconds**. Dùng `new Date(viewed_at)` (JavaScript) để chuyển đổi.

5. **Phân trang:** Dùng `amount` để tính tổng số trang: `totalPages = Math.ceil(amount / size)`.

6. **Kết quả sắp xếp:** Cả danh sách yêu thích và lịch sử xem đều được sắp xếp theo thời gian **mới nhất trước** (`ORDER BY ... DESC`).
