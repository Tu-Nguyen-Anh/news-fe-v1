# Dashboard API — Tài liệu thống kê bài viết

**Base URL:** `http://localhost:8188`  
**Prefix:** `/api/v1/dashboard`  
**Quyền truy cập:** Tất cả API trong nhóm này đều yêu cầu role **ADMIN** và **Bearer JWT token**.

---

## Xác thực (Authentication)

Mọi request phải gửi kèm header:

```
Authorization: Bearer <access_token>
```

Nếu thiếu token hoặc token không hợp lệ → `401 Unauthorized`.  
Nếu token hợp lệ nhưng không phải ADMIN → `403 Forbidden`.

---

## Cấu trúc Response chung

Tất cả API trả về cấu trúc `ResponseGeneral<T>`:

```json
{
  "status": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-04-30T10:00:00"
}
```

| Trường      | Kiểu   | Mô tả                                |
|-------------|--------|--------------------------------------|
| `status`    | int    | HTTP status code                     |
| `message`   | string | Thông báo kết quả                    |
| `data`      | object | Payload chính (xem từng API bên dưới)|
| `timestamp` | string | Thời điểm response được tạo          |

---

## 1. Thống kê bài viết theo tháng

### `GET /api/v1/dashboard/articles/growth`

Trả về số lượng bài viết được tạo trong **từng tháng** của một năm.  
Luôn trả đủ 12 tháng — tháng không có bài viết nào sẽ có `count = 0`.

#### Query Parameters

| Tham số | Bắt buộc | Kiểu    | Mô tả                                              |
|---------|----------|---------|----------------------------------------------------|
| `year`  | Không    | integer | Năm thống kê (ví dụ: `2026`). Mặc định: năm hiện tại |

#### Ví dụ Request

```
GET /api/v1/dashboard/articles/growth?year=2026
Authorization: Bearer eyJhbGci...
```

#### Ví dụ Response `200 OK`

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "year": 2026,
    "months": [
      { "month": 1, "month_name": "January",  "count": 45 },
      { "month": 2, "month_name": "February", "count": 62 },
      { "month": 3, "month_name": "March",    "count": 0  },
      { "month": 4, "month_name": "April",    "count": 88 },
      { "month": 5, "month_name": "May",      "count": 0  },
      { "month": 6, "month_name": "June",     "count": 0  },
      { "month": 7, "month_name": "July",     "count": 0  },
      { "month": 8, "month_name": "August",   "count": 0  },
      { "month": 9, "month_name": "September","count": 0  },
      { "month": 10,"month_name": "October",  "count": 0  },
      { "month": 11,"month_name": "November", "count": 0  },
      { "month": 12,"month_name": "December", "count": 0  }
    ],
    "total": 195
  },
  "timestamp": "2026-04-30T10:00:00"
}
```

#### Mô tả trường `data`

| Trường       | Kiểu            | Mô tả                              |
|--------------|-----------------|------------------------------------|
| `year`       | int             | Năm thống kê                       |
| `months`     | array           | Danh sách 12 tháng                 |
| `months[].month`      | int    | Số tháng (1–12)                    |
| `months[].month_name` | string | Tên tháng tiếng Anh                |
| `months[].count`      | long   | Số bài viết tạo trong tháng đó     |
| `total`      | long            | Tổng bài viết trong cả năm         |

---

## 2. Thống kê bài viết theo ngày

### `GET /api/v1/dashboard/articles/daily`

Trả về số lượng bài viết được tạo trong **từng ngày** của một tháng.  
Trả đủ số ngày trong tháng — ngày không có bài viết sẽ có `count = 0`.

#### Query Parameters

| Tham số | Bắt buộc | Kiểu    | Mô tả                                                  |
|---------|----------|---------|--------------------------------------------------------|
| `year`  | Không    | integer | Năm thống kê (ví dụ: `2026`). Mặc định: năm hiện tại  |
| `month` | Không    | integer | Tháng thống kê, từ `1`–`12`. Mặc định: tháng hiện tại |

#### Ví dụ Request

```
GET /api/v1/dashboard/articles/daily?year=2026&month=4
Authorization: Bearer eyJhbGci...
```

#### Ví dụ Response `200 OK`

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "year": 2026,
    "month": 4,
    "total_days": 30,
    "days": [
      { "day": 1,  "count": 5  },
      { "day": 2,  "count": 0  },
      { "day": 3,  "count": 12 },
      { "day": 4,  "count": 7  },
      { "day": 30, "count": 3  }
    ],
    "total": 27
  },
  "timestamp": "2026-04-30T10:00:00"
}
```

#### Mô tả trường `data`

| Trường        | Kiểu   | Mô tả                                      |
|---------------|--------|--------------------------------------------|
| `year`        | int    | Năm thống kê                               |
| `month`       | int    | Tháng thống kê (1–12)                      |
| `total_days`  | int    | Số ngày của tháng (28, 29, 30, hoặc 31)    |
| `days`        | array  | Danh sách từng ngày                        |
| `days[].day`  | int    | Số ngày trong tháng (1 – `total_days`)     |
| `days[].count`| long   | Số bài viết tạo trong ngày đó              |
| `total`       | long   | Tổng bài viết trong tháng                  |

---

## 3. Thống kê bài viết theo nguồn tin

### `GET /api/v1/dashboard/articles/by-source`

Trả về số lượng bài viết theo **từng nguồn tin (source)**, phân theo tháng trong năm.  
Mỗi source có danh sách 12 tháng, tháng không có bài viết trả về `count = 0`.

#### Query Parameters

| Tham số | Bắt buộc | Kiểu    | Mô tả                                              |
|---------|----------|---------|----------------------------------------------------|
| `year`  | Không    | integer | Năm thống kê (ví dụ: `2026`). Mặc định: năm hiện tại |

#### Ví dụ Request

```
GET /api/v1/dashboard/articles/by-source?year=2026
Authorization: Bearer eyJhbGci...
```

#### Ví dụ Response `200 OK`

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "year": 2026,
    "sources": [
      {
        "source_id": 1,
        "source_name": "VnExpress",
        "monthly_data": [
          { "month": 1, "count": 30 },
          { "month": 2, "count": 0  },
          { "month": 3, "count": 15 },
          { "month": 4, "count": 22 },
          { "month": 5, "count": 0  },
          { "month": 6, "count": 0  },
          { "month": 7, "count": 0  },
          { "month": 8, "count": 0  },
          { "month": 9, "count": 0  },
          { "month": 10,"count": 0  },
          { "month": 11,"count": 0  },
          { "month": 12,"count": 0  }
        ],
        "total": 67
      },
      {
        "source_id": 2,
        "source_name": "Dân Trí",
        "monthly_data": [
          { "month": 1, "count": 10 },
          { "month": 2, "count": 18 },
          { "month": 3, "count": 5  },
          { "month": 4, "count": 0  },
          { "month": 5, "count": 0  },
          { "month": 6, "count": 0  },
          { "month": 7, "count": 0  },
          { "month": 8, "count": 0  },
          { "month": 9, "count": 0  },
          { "month": 10,"count": 0  },
          { "month": 11,"count": 0  },
          { "month": 12,"count": 0  }
        ],
        "total": 33
      }
    ]
  },
  "timestamp": "2026-04-30T10:00:00"
}
```

#### Mô tả trường `data`

| Trường                           | Kiểu   | Mô tả                                   |
|----------------------------------|--------|-----------------------------------------|
| `year`                           | int    | Năm thống kê                            |
| `sources`                        | array  | Danh sách nguồn tin                     |
| `sources[].source_id`            | long   | ID nguồn tin                            |
| `sources[].source_name`          | string | Tên nguồn tin                           |
| `sources[].monthly_data`         | array  | 12 tháng của nguồn tin đó               |
| `sources[].monthly_data[].month` | int    | Số tháng (1–12)                         |
| `sources[].monthly_data[].count` | long   | Số bài viết tháng đó                    |
| `sources[].total`                | long   | Tổng bài viết của nguồn tin trong năm   |

---

## 4. Thống kê bài viết theo chủ đề

### `GET /api/v1/dashboard/articles/by-topic`

Trả về số lượng bài viết theo **từng chủ đề (topic)**, phân theo tháng trong năm.  
Mỗi topic có danh sách 12 tháng, tháng không có bài viết trả về `count = 0`.  
Chỉ tính topic và bài viết chưa bị xoá (`deleted = false`).  
`grand_total` là tổng bài viết của tất cả topic trong năm.

#### Query Parameters

| Tham số | Bắt buộc | Kiểu    | Mô tả                                              |
|---------|----------|---------|----------------------------------------------------|
| `year`  | Không    | integer | Năm thống kê (ví dụ: `2026`). Mặc định: năm hiện tại |

#### Ví dụ Request

```
GET /api/v1/dashboard/articles/by-topic?year=2026
Authorization: Bearer eyJhbGci...
```

#### Ví dụ Response `200 OK`

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "year": 2026,
    "topics": [
      {
        "topic_id": 1,
        "topic_name": "Thời sự",
        "monthly_data": [
          { "month": 1,  "month_name": "Jan", "count": 20 },
          { "month": 2,  "month_name": "Feb", "count": 35 },
          { "month": 3,  "month_name": "Mar", "count": 0  },
          { "month": 4,  "month_name": "Apr", "count": 18 },
          { "month": 5,  "month_name": "May", "count": 0  },
          { "month": 6,  "month_name": "Jun", "count": 0  },
          { "month": 7,  "month_name": "Jul", "count": 0  },
          { "month": 8,  "month_name": "Aug", "count": 0  },
          { "month": 9,  "month_name": "Sep", "count": 0  },
          { "month": 10, "month_name": "Oct", "count": 0  },
          { "month": 11, "month_name": "Nov", "count": 0  },
          { "month": 12, "month_name": "Dec", "count": 0  }
        ],
        "total": 73
      },
      {
        "topic_id": 2,
        "topic_name": "Kinh doanh",
        "monthly_data": [
          { "month": 1,  "month_name": "Jan", "count": 10 },
          { "month": 2,  "month_name": "Feb", "count": 8  },
          { "month": 3,  "month_name": "Mar", "count": 14 },
          { "month": 4,  "month_name": "Apr", "count": 6  },
          { "month": 5,  "month_name": "May", "count": 0  },
          { "month": 6,  "month_name": "Jun", "count": 0  },
          { "month": 7,  "month_name": "Jul", "count": 0  },
          { "month": 8,  "month_name": "Aug", "count": 0  },
          { "month": 9,  "month_name": "Sep", "count": 0  },
          { "month": 10, "month_name": "Oct", "count": 0  },
          { "month": 11, "month_name": "Nov", "count": 0  },
          { "month": 12, "month_name": "Dec", "count": 0  }
        ],
        "total": 38
      }
    ],
    "grand_total": 111
  },
  "timestamp": "2026-04-30T10:00:00"
}
```

#### Mô tả trường `data`

| Trường                           | Kiểu   | Mô tả                                  |
|----------------------------------|--------|----------------------------------------|
| `year`                           | int    | Năm thống kê                           |
| `topics`                         | array  | Danh sách chủ đề                       |
| `topics[].topic_id`              | long   | ID chủ đề                              |
| `topics[].topic_name`            | string | Tên chủ đề                             |
| `topics[].monthly_data`          | array  | 12 tháng của chủ đề đó                 |
| `topics[].monthly_data[].month`  | int    | Số tháng (1–12)                        |
| `topics[].monthly_data[].month_name` | string | Tên tháng viết tắt (Jan, Feb, ...)  |
| `topics[].monthly_data[].count`  | long   | Số bài viết tháng đó                   |
| `topics[].total`                 | long   | Tổng bài viết của chủ đề trong năm     |
| `grand_total`                    | long   | Tổng bài viết của **tất cả** chủ đề    |

---

## Mã lỗi chung

| HTTP Status | Ý nghĩa                                          | Khi nào xảy ra                              |
|-------------|--------------------------------------------------|---------------------------------------------|
| `200`       | Thành công                                       | Request hợp lệ, trả dữ liệu bình thường     |
| `401`       | Chưa xác thực (Unauthorized)                     | Thiếu header `Authorization` hoặc token hết hạn |
| `403`       | Không có quyền (Forbidden)                       | Token hợp lệ nhưng user không có role ADMIN |
| `500`       | Lỗi server                                       | Lỗi nội bộ không xác định                  |

---

## Ghi chú

- Tất cả timestamp trong hệ thống (createdAt, pubDate, ...) được lưu theo **milliseconds** kể từ Unix epoch.
- Khi `year` không được truyền, hệ thống tự lấy **năm hiện tại** theo giờ máy chủ.
- Khi `month` không được truyền (API daily), hệ thống tự lấy **tháng hiện tại**.
- Dữ liệu được tính dựa trên trường `created_at` của bài viết, không phải `pub_date`.
- Bài viết đã xoá mềm (`deleted = true`) **không** được tính vào thống kê.
- Topic đã xoá mềm (`deleted = true`) **không** xuất hiện trong kết quả `by-topic`.
- Swagger UI có thể truy cập tại: `http://localhost:8188/swagger-ui/index.html`
