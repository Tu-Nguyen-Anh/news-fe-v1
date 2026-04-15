# Phân quyền (RBAC) – Tài liệu API

> **Cập nhật:** 2026-04-10
> **Base URL:** `http://localhost:8188/api/v1`
> **Auth header:** `Authorization: Bearer <access_token>`

Tất cả response dùng wrapper chung:
```json
{
  "message": "success",
  "data": { ... }
}
```
Tất cả field JSON dùng **snake_case**.

---

## 1. Hệ thống Role

Hệ thống có **3 role**:

| Role | Mô tả |
|------|-------|
| `ADMIN` | Toàn quyền tất cả màn hình |
| `AUTHOR` | Toàn quyền USER + tạo/sửa/xóa bài báo (Articles) |
| `USER` | Xem nội dung, nhắn tin (Chat), đăng bài cộng đồng (Blog Posts) |

Role được lưu trong bảng `users`, cột `role VARCHAR(20)` với enum `ADMIN | AUTHOR | USER`.  
Default khi tạo user mới: **`USER`**.

---

## 2. Ma trận phân quyền

| Module / Hành động | ADMIN | AUTHOR | USER |
|--------------------|:-----:|:------:|:----:|
| **Users** | | | |
| Tạo user | ✅ | ❌ | ❌ |
| Sửa user (bao gồm đổi role) | ✅ | ❌ | ❌ |
| Xóa user | ✅ | ❌ | ❌ |
| Xem chi tiết user | ✅ | ✅ | ✅ |
| Filter danh sách user | ✅ | ❌ | ❌ |
| Xem lịch sử user | ✅ | ❌ | ❌ |
| Reset password | ✅ | ❌ | ❌ |
| Đổi mật khẩu (chỉ của mình) | ✅ | ✅ | ✅ |
| Tìm kiếm user (mention) | ✅ | ✅ | ✅ |
| **Articles (Bài báo)** | | | |
| Tạo bài báo | ✅ | ✅ | ❌ |
| Sửa bài báo | ✅ | ✅ | ❌ |
| Xóa bài báo | ✅ | ✅ | ❌ |
| Xem / Filter bài báo | ✅ | ✅ | ✅ |
| Yêu thích / Lịch sử đọc | ✅ | ✅ | ✅ |
| Bình luận bài báo | ✅ | ✅ | ✅ |
| **Blog Posts (Cộng đồng)** | | | |
| Tạo / Sửa / Xóa bài đăng | ✅ | ✅ | ✅ |
| Xem / Like / Share / Comment | ✅ | ✅ | ✅ |
| **Topics (Chủ đề)** | | | |
| Tạo / Sửa / Xóa topic | ✅ | ❌ | ❌ |
| Xem / Filter / Follow topic | ✅ | ✅ | ✅ |
| **Sources (Nguồn tin)** | | | |
| Tạo / Sửa / Xóa source | ✅ | ❌ | ❌ |
| Xem / Filter source | ✅ | ✅ | ✅ |
| **Chat (Tin nhắn)** | | | |
| Tất cả chức năng chat | ✅ | ✅ | ✅ |
| **Dashboard** | | | |
| Xem thống kê | ✅ | ❌ | ❌ |
| **Feedback (Góp ý)** | | | |
| Gửi / Xem / Xóa góp ý của mình | ✅ | ✅ | ✅ |
| Xem tất cả góp ý (admin) | ✅ | ❌ | ❌ |
| Cập nhật trạng thái góp ý | ✅ | ❌ | ❌ |
| **Upload** | | | |
| Upload ảnh | ✅ | ✅ | ✅ |

---

## 3. HTTP Error khi thiếu quyền

| Tình huống | HTTP Code | Mô tả |
|-----------|-----------|-------|
| Chưa đăng nhập / token hết hạn | `401 Unauthorized` | Cần gửi Bearer token hợp lệ |
| Đã đăng nhập nhưng role không đủ | `403 Forbidden` | Role không có quyền truy cập endpoint này |

```json
{
  "status": 403,
  "message": "Access Denied",
  "data": null
}
```

---

## 4. Module: Người dùng (User)

### Common Headers

| Header | Required | Mô tả |
|--------|----------|-------|
| `Authorization` | Yes | `Bearer <token>` |
| `Accept-Language` | No (default `en`) | Ngôn ngữ thông báo |

---

### 4.1 Tạo người dùng

```
POST /api/v1/users
```

**Role:** `ADMIN`

**Request Body:**
```json
{
  "username": "john_doe",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone_number": "0901234567",
  "status": 0,
  "role": "USER"
}
```

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `username` | string | Yes | 3–50 ký tự, không chứa ký tự đặc biệt |
| `full_name` | string | No | Tối đa 50 ký tự |
| `email` | string | Yes | Email hợp lệ, unique |
| `phone_number` | string | Yes | SĐT hợp lệ, unique |
| `status` | int | Yes | `0` = ACTIVE, `1` = INACTIVE |
| `role` | string | No | `ADMIN` \| `AUTHOR` \| `USER` (default `USER`) |

**Response `201 Created`:**
```json
{
  "message": "success",
  "data": {
    "id": 10,
    "username": "john_doe",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_number": "0901234567",
    "status": 0,
    "role": "USER"
  }
}
```

**Errors:**

| HTTP | Mô tả |
|------|-------|
| `401` | Chưa xác thực |
| `403` | Không phải ADMIN |
| `409` | Email / username / SĐT đã tồn tại |
| `400` | Dữ liệu không hợp lệ |

---

### 4.2 Cập nhật người dùng

```
PUT /api/v1/users/{id}
```

**Role:** `ADMIN`

**Path Param:** `id` – ID user cần cập nhật.

**Request Body:** Tương tự tạo mới. Có thể đổi `role` của user.

**Response `200 OK`:**
```json
{
  "message": "success",
  "data": {
    "id": 10,
    "username": "john_doe",
    "full_name": "John Doe Updated",
    "email": "john@example.com",
    "phone_number": "0901234567",
    "status": 0,
    "role": "AUTHOR"
  }
}
```

---

### 4.3 Xóa người dùng

```
DELETE /api/v1/users/{id}
```

**Role:** `ADMIN`

Xóa mềm (`deleted = true`). Không thể xóa user có username là `admin`.

**Response `200 OK`:**
```json
{ "message": "success", "data": null }
```

---

### 4.4 Chi tiết người dùng

```
GET /api/v1/users/{id}
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

**Response `200 OK`:**
```json
{
  "message": "success",
  "data": {
    "id": 10,
    "username": "john_doe",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_number": "0901234567",
    "avatar": "https://cdn.example.com/avatar.jpg",
    "status": 0,
    "role": "USER"
  }
}
```

---

### 4.5 Lịch sử người dùng

```
GET /api/v1/users/{id}/histories?page=0&size=10
```

**Role:** `ADMIN`

**Query Params:**

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | int | `0` | Trang (0-indexed) |
| `size` | int | `10` | Số bản ghi mỗi trang |

**Response `200 OK`:**
```json
{
  "message": "success",
  "data": {
    "content": [
      {
        "id": 1,
        "user_id": 10,
        "message": "Tạo mới người dùng",
        "created_by": "admin",
        "created_at": 1745000000000
      }
    ],
    "total_elements": 5
  }
}
```

---

### 4.6 Kiểm tra email / username / SĐT tồn tại

```
GET /api/v1/users/exist-email?email=john@example.com
GET /api/v1/users/check-username?username=john_doe
GET /api/v1/users/exist-phone?phone_number=0901234567
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

| Response | Ý nghĩa |
|----------|---------|
| `200 OK` | Giá trị chưa tồn tại (có thể dùng) |
| `409 Conflict` | Giá trị đã tồn tại |

---

### 4.7 Reset mật khẩu

```
PUT /api/v1/users/reset-password/{id}
```

**Role:** `ADMIN`

Hệ thống sinh mật khẩu ngẫu nhiên (8 ký tự, gồm chữ hoa, thường, số, ký tự đặc biệt) và lưu vào DB. Mật khẩu mới không trả về trong response.

**Response `200 OK`:**
```json
{ "message": "success", "data": null }
```

---

### 4.8 Đổi mật khẩu

```
PUT /api/v1/users/{id}/password
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

> Service kiểm tra chỉ cho phép đổi mật khẩu của chính mình (`currentUser.id == id`).

**Request Body:**
```json
{
  "old_password": "News@2025",
  "new_password": "NewPass@2026",
  "confirm_password": "NewPass@2026"
}
```

**Errors:**

| HTTP | Mô tả |
|------|-------|
| `403` | Đang cố đổi mật khẩu của người khác |
| `400` | Mật khẩu cũ sai / mật khẩu mới trùng cũ / confirm không khớp |

---

### 4.9 Tìm kiếm user (mention)

```
GET /api/v1/users/mention-search?keyword=john&page=0&size=10
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

**Response `200 OK`:**
```json
{
  "message": "success",
  "data": {
    "content": [
      {
        "id": 10,
        "username": "john_doe",
        "full_name": "John Doe",
        "avatar": "https://cdn.example.com/avatar.jpg"
      }
    ],
    "total_elements": 1
  }
}
```

---

### 4.10 Filter danh sách user

```
POST /api/v1/users/filter
```

**Role:** `ADMIN`

**Request Body:**
```json
{
  "keyword": "john",
  "status": [0, 1],
  "page": 0,
  "size": 10
}
```

| Field | Type | Mô tả |
|-------|------|-------|
| `keyword` | string | Tìm theo username / full_name / email / SĐT |
| `status` | int[] | Lọc theo status. Bỏ trống = lấy tất cả |
| `page` | int | Trang (0-indexed) |
| `size` | int | Số bản ghi |

**Response `200 OK`:**
```json
{
  "message": "success",
  "data": {
    "content": [
      {
        "id": 10,
        "username": "john_doe",
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone": "0901234567",
        "status": 0,
        "role": "USER",
        "created_by": "admin",
        "created_at": 1745000000000
      }
    ],
    "total_elements": 1
  }
}
```

---

## 5. Module: Bài viết (Article)

> Các endpoint **GET** (xem, filter, yêu thích, lịch sử đọc, bình luận) mở cho tất cả role.
> Các endpoint **write** (tạo, sửa, xóa bài báo) chỉ dành cho `ADMIN` và `AUTHOR`.

---

### 5.1 Tạo bài viết

```
POST /api/v1/articles
```

**Role:** `ADMIN`, `AUTHOR`

**Request Body:**
```json
{
  "title": "Tiêu đề bài viết",
  "link": "https://vnexpress.net/bai-viet-1",
  "guid": "unique-guid-001",
  "description": "Mô tả ngắn bài viết",
  "pub_date": 1745000000000,
  "image_link": "https://cdn.example.com/img.jpg",
  "topic_id": 1
}
```

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `title` | string | Yes | Tiêu đề bài viết |
| `link` | string | Yes | URL bài viết (unique) |
| `guid` | string | Yes | GUID từ RSS feed (unique) |
| `description` | string | No | Mô tả / tóm tắt |
| `pub_date` | long | No | Ngày đăng (Unix milliseconds) |
| `image_link` | string | No | URL ảnh đại diện |
| `topic_id` | long | Yes | ID chủ đề |

**Response `201 Created`:**
```json
{
  "message": "success",
  "data": {
    "id": 100,
    "title": "Tiêu đề bài viết",
    "link": "https://vnexpress.net/bai-viet-1",
    "guid": "unique-guid-001",
    "description": "Mô tả ngắn bài viết",
    "pub_date": 1745000000000,
    "image_link": "https://cdn.example.com/img.jpg",
    "topic_id": 1
  }
}
```

**Errors:**

| HTTP | Mô tả |
|------|-------|
| `403` | Không phải ADMIN hoặc AUTHOR |
| `409` | `link` hoặc `guid` đã tồn tại |
| `404` | `topic_id` không tồn tại |

---

### 5.2 Cập nhật bài viết

```
PUT /api/v1/articles/{id}
```

**Role:** `ADMIN`, `AUTHOR`

**Path Param:** `id` – ID bài viết.

**Request Body:** Tương tự tạo mới.

**Response `200 OK`:** Thông tin bài viết đã cập nhật.

---

### 5.3 Xóa bài viết

```
DELETE /api/v1/articles/{id}
```

**Role:** `ADMIN`, `AUTHOR`

Xóa mềm (`deleted = true`).

**Response `200 OK`:**
```json
{ "message": "success", "data": null }
```

---

### 5.4 Chi tiết bài viết

```
GET /api/v1/articles/{id}
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

---

### 5.5 Filter bài viết

```
POST /api/v1/articles/filter
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

**Request Body:**
```json
{
  "keyword": "công nghệ",
  "topic_ids": [1, 2],
  "source_ids": [1],
  "page": 0,
  "size": 10
}
```

---

### 5.6 Kiểm tra link tồn tại

```
GET /api/v1/articles/exist-link?link=https://...
```

**Role:** `ADMIN`, `AUTHOR`

| Response | Ý nghĩa |
|----------|---------|
| `200 OK` | Link chưa tồn tại |
| `409 Conflict` | Link đã tồn tại |

---

### 5.7 Yêu thích

```
POST   /api/v1/articles/{articleId}/favorites
DELETE /api/v1/articles/{articleId}/favorites
GET    /api/v1/articles/favorites?page=0&size=10
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

**Response GET `200 OK`:**
```json
{
  "data": {
    "content": [
      {
        "article_id": 100,
        "title": "Tiêu đề bài viết",
        "image_link": "...",
        "pub_date": 1745000000000,
        "topic_id": 1,
        "favorited_at": 1745100000000
      }
    ],
    "total_elements": 5
  }
}
```

---

### 5.8 Lịch sử đọc

```
POST /api/v1/articles/{articleId}/view
GET  /api/v1/articles/view-history?page=0&size=10
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

---

### 5.9 Bình luận bài viết

```
POST   /api/v1/articles/{articleId}/comments
DELETE /api/v1/articles/comments/{commentId}
GET    /api/v1/articles/{articleId}/comments?page=0&size=10
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

**Request Body (POST):**
```json
{
  "content": "Bình luận hay!",
  "parent_comment_id": null
}
```

**Response POST `201 Created`:**
```json
{
  "message": "success",
  "data": {
    "id": 1,
    "article_id": 100,
    "user_id": 10,
    "username": "john_doe",
    "full_name": "John Doe",
    "avatar": "...",
    "content": "Bình luận hay!",
    "parent_comment_id": null,
    "created_at": 1745000000000
  }
}
```

---

## 6. Module: Nguồn tin (Source)

> Tạo / Sửa / Xóa: chỉ `ADMIN`. Xem / Filter: tất cả role.

---

### 6.1 Tạo nguồn tin

```
POST /api/v1/sources
```

**Role:** `ADMIN`

**Request Body:**
```json
{
  "name": "VnExpress",
  "url": "https://vnexpress.net",
  "avatar": "https://cdn.vnexpress.net/logo.png",
  "description": "Báo điện tử VnExpress"
}
```

**Response `201 Created`:**
```json
{
  "message": "success",
  "data": {
    "id": 1,
    "name": "VnExpress",
    "url": "https://vnexpress.net",
    "avatar": "https://cdn.vnexpress.net/logo.png",
    "description": "Báo điện tử VnExpress"
  }
}
```

---

### 6.2 Cập nhật nguồn tin

```
PUT /api/v1/sources/{id}
```

**Role:** `ADMIN`

**Request Body:** Tương tự tạo mới.

---

### 6.3 Xóa nguồn tin

```
DELETE /api/v1/sources/{id}
```

**Role:** `ADMIN`

**Response `200 OK`:**
```json
{ "message": "success", "data": null }
```

---

### 6.4 Chi tiết nguồn tin

```
GET /api/v1/sources/{id}
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

---

### 6.5 Filter nguồn tin

```
POST /api/v1/sources/filter
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

**Request Body:**
```json
{
  "keyword": "vnexpress",
  "page": 0,
  "size": 10
}
```

---

### 6.6 Tất cả nguồn tin kèm chủ đề

```
GET /api/v1/sources/all-with-topics
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

---

### 6.7 Kiểm tra tên / URL tồn tại

```
GET /api/v1/sources/exist-name?name=VnExpress
GET /api/v1/sources/exist-url?url=https://vnexpress.net
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

---

## 7. Module: Chủ đề (Topic)

> Tạo / Sửa / Xóa: chỉ `ADMIN`. Xem / Filter / Follow: tất cả role.

---

### 7.1 Tạo chủ đề

```
POST /api/v1/topics
```

**Role:** `ADMIN`

**Request Body:**
```json
{
  "name": "Công nghệ",
  "url": "https://vnexpress.net/cong-nghe",
  "rss_url": "https://vnexpress.net/rss/cong-nghe.rss",
  "source_id": 1,
  "description": "Tin tức công nghệ"
}
```

**Response `201 Created`:**
```json
{
  "message": "success",
  "data": {
    "id": 5,
    "name": "Công nghệ",
    "url": "https://vnexpress.net/cong-nghe",
    "rss_url": "https://vnexpress.net/rss/cong-nghe.rss",
    "source_id": 1,
    "description": "Tin tức công nghệ"
  }
}
```

---

### 7.2 Cập nhật chủ đề

```
PUT /api/v1/topics/{id}
```

**Role:** `ADMIN`

---

### 7.3 Xóa chủ đề

```
DELETE /api/v1/topics/{id}
```

**Role:** `ADMIN`

**Response `200 OK`:**
```json
{ "message": "success", "data": null }
```

---

### 7.4 Chi tiết / Filter chủ đề

```
GET  /api/v1/topics/{id}
POST /api/v1/topics/filter
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

**Request Body (filter):**
```json
{
  "keyword": "công nghệ",
  "source_id": 1,
  "page": 0,
  "size": 10
}
```

---

### 7.5 Kiểm tra tên / URL tồn tại

```
GET /api/v1/topics/exist-name?name=Công nghệ
GET /api/v1/topics/exist-url?url=https://vnexpress.net/cong-nghe
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

---

### 7.6 Follow / Unfollow chủ đề

```
POST   /api/v1/topics/{topicId}/follow
DELETE /api/v1/topics/{topicId}/follow
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

**Response `201 Created` (follow):**
```json
{ "message": "success", "data": null }
```

---

### 7.7 Danh sách chủ đề đang follow

```
GET /api/v1/topics/following?page=0&size=10
```

**Role:** `ADMIN`, `AUTHOR`, `USER`

**Response `200 OK`:**
```json
{
  "data": {
    "content": [
      {
        "topic_id": 5,
        "topic_name": "Công nghệ",
        "source_name": "VnExpress",
        "followed_at": 1745000000000
      }
    ],
    "total_elements": 3
  }
}
```

---

## 8. Module: Dashboard

```
GET /api/v1/dashboard/articles/growth?year=2026
GET /api/v1/dashboard/articles/daily?year=2026&month=4
GET /api/v1/dashboard/articles/by-source?year=2026
```

**Role:** `ADMIN` only

> Xem chi tiết response ở [DASHBOARD_API.md](./DASHBOARD_API.md).

---

## 9. Module: Góp ý (Feedback) – Admin Endpoints

> Endpoints người dùng (`/api/v1/feedbacks`) mở cho tất cả role đã đăng nhập.
> Endpoints admin (`/api/v1/admin/feedbacks`) chỉ dành cho `ADMIN`.

---

### 9.1 [Admin] Danh sách tất cả góp ý

```
GET /api/v1/admin/feedbacks?status=0&page=0&size=10
```

**Role:** `ADMIN`

**Query Params:**

| Param | Type | Required | Mô tả |
|-------|------|----------|-------|
| `status` | int | No | `0`=PENDING, `1`=IN_REVIEW, `2`=RESOLVED, `3`=REJECTED. Bỏ trống = tất cả |
| `page` | int | No (default `0`) | Trang |
| `size` | int | No (default `10`) | Số bản ghi |

**Response `200 OK`:**
```json
{
  "message": "success",
  "data": {
    "content": [
      {
        "id": 1,
        "user_id": 10,
        "title": "Lỗi hiển thị trang",
        "content": "Trang chủ bị lỗi trên mobile",
        "status": 0,
        "status_label": "PENDING",
        "image_urls": ["https://cdn.example.com/screenshot.jpg"],
        "created_at": 1745000000000
      }
    ],
    "total_elements": 25
  }
}
```

---

### 9.2 [Admin] Cập nhật trạng thái góp ý

```
PUT /api/v1/admin/feedbacks/{feedbackId}/status
```

**Role:** `ADMIN`

**Path Param:** `feedbackId` – ID góp ý.

**Request Body:**
```json
{
  "status": 2
}
```

| `status` | Label | Mô tả |
|---------|-------|-------|
| `0` | PENDING | Chờ xử lý |
| `1` | IN_REVIEW | Đang xem xét |
| `2` | RESOLVED | Đã giải quyết |
| `3` | REJECTED | Từ chối |

**Response `200 OK`:**
```json
{
  "message": "success",
  "data": {
    "id": 1,
    "user_id": 10,
    "title": "Lỗi hiển thị trang",
    "content": "Trang chủ bị lỗi trên mobile",
    "status": 2,
    "status_label": "RESOLVED",
    "image_urls": ["https://cdn.example.com/screenshot.jpg"],
    "created_at": 1745000000000,
    "updated_at": 1745100000000
  }
}
```

**Errors:**

| HTTP | Mô tả |
|------|-------|
| `404` | Góp ý không tồn tại |
| `400` | `status` không hợp lệ (ngoài 0–3) |
| `403` | Không phải ADMIN |

---

## 10. Data Model: User (sau khi thêm Role)

```json
{
  "id": 10,
  "username": "john_doe",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone_number": "0901234567",
  "avatar": "https://cdn.example.com/avatar.jpg",
  "status": 0,
  "role": "USER"
}
```

| Field | Type | Mô tả |
|-------|------|-------|
| `id` | long | ID user |
| `username` | string | Tên đăng nhập (unique) |
| `full_name` | string | Họ tên đầy đủ |
| `email` | string | Email (unique) |
| `phone_number` | string | Số điện thoại (unique) |
| `avatar` | string | URL ảnh đại diện |
| `status` | int | `0`=ACTIVE, `1`=INACTIVE |
| `role` | string | `ADMIN` \| `AUTHOR` \| `USER` |

### UserRole Enum

| Giá trị | Spring Authority | Mô tả |
|---------|-----------------|-------|
| `ADMIN` | `ROLE_ADMIN` | Quản trị viên |
| `AUTHOR` | `ROLE_AUTHOR` | Tác giả |
| `USER` | `ROLE_USER` | Người dùng thông thường |

### ActiveStatus

| Giá trị | Mô tả |
|---------|-------|
| `0` | ACTIVE |
| `1` | INACTIVE |
| `-1` | UNKNOWN |

---

## 11. Database Migration

File: `db/changelog/20260410-0003-users-add-role.xml`

```sql
-- Thêm cột role với default USER
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Set admin user thành ADMIN
UPDATE users SET role = 'ADMIN' WHERE username = 'admin';
```

Thứ tự migration (trong `master.xml`):
```
...
20260410-0001-feedbacks.xml
20260410-0002-feedback_images.xml
20260410-0003-users-add-role.xml   ← mới thêm
data/data.xml
```
