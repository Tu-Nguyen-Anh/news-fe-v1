






# news - Tài liệu API & Màn hình

> **Phiên bản:** 1.0.0
> **Cập nhật lần cuối:** 2026-03-25
> **Tác giả BA:** AI Business Analyst

---

## MỤC LỤC

1. [Thông tin chung](#1-thông-tin-chung)
2. [Cấu trúc Response chung](#2-cấu-trúc-response-chung)
3. [Xác thực & Phân quyền](#3-xác-thực--phân-quyền)
4. [Module: Xác thực (Authentication)](#4-module-xác-thực-authentication)
5. [Module: Người dùng (User)](#5-module-người-dùng-user)
6. [Module: Nguồn tin (Source)](#6-module-nguồn-tin-source)
7. [Module: Chủ đề (Topic)](#7-module-chủ-đề-topic)
8. [Module: Bài viết (Article)](#8-module-bài-viết-article)
9. [Bảng mã lỗi](#9-bảng-mã-lỗi)
10. [Data Models tổng hợp](#10-data-models-tổng-hợp)

---

## 1. THÔNG TIN CHUNG

### Thông tin kết nối

| Thông số | Giá trị |
|---|---|
| **Base URL** | `http://localhost:8188` |
| **API Prefix** | `/api/v1` |
| **Full Base URL** | `http://localhost:8188/api/v1` |
| **Swagger UI** | `http://localhost:8188/swagger-ui.html` |
| **API Docs (JSON)** | `http://localhost:8188/v3/api-docs` |
| **Content-Type** | `application/json` |
| **Encoding** | `UTF-8` |

### Môi trường

| Môi trường | URL | Ghi chú |
|---|---|---|
| Local (dev-local) | `http://localhost:8188` | Cho phép tất cả CORS origin |
| Development (dev) | `http://localhost:8188` | CORS chỉ cho `https://soar-fe.lab.ncc.local` |
| Production | Cấu hình qua biến môi trường `PORT_INTERNAL` | CORS restricted |

### Công nghệ

- **Framework:** Spring Boot 3.2.2
- **Java:** 17
- **Database:** PostgreSQL (port 5432, database: `news_db`)
- **Cache:** Redis (port 6379)
- **Authentication:** JWT (Bearer Token)
- **Migration:** Liquibase

---

## 2. CẤU TRÚC RESPONSE CHUNG

### Response bao ngoài (ResponseGeneral)

Mọi API đều trả về định dạng sau:

```json
{
  "status": 200,
  "message": "Success",
  "data": <payload>,
  "timestamp": "2026-03-25T10:00:00.000Z"
}
```

| Field | Type | Mô tả |
|---|---|---|
| `status` | `int` | HTTP status code (200, 201, 400, 401, 403, 404, 500) |
| `message` | `string` | Thông báo kết quả |
| `data` | `any` | Payload dữ liệu (null nếu không có) |
| `timestamp` | `string` | Thời gian xử lý request (ISO 8601) |

### Response phân trang (PageResponse)

Áp dụng cho tất cả API filter/danh sách:

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "content": [...],
    "amount": 100
  }
}
```

| Field | Type | Mô tả |
|---|---|---|
| `content` | `array` | Danh sách items của trang hiện tại |
| `amount` | `int` | Tổng số records (dùng để tính tổng số trang) |

> **Lưu ý phân trang:** `totalPages = Math.ceil(amount / size)`

---

## 3. XÁC THỰC & PHÂN QUYỀN

### Cơ chế JWT

- **Loại token:** Bearer Token
- **Access Token TTL:** 30 ngày (2,592,000,000 ms)
- **Refresh Token TTL:** ~41.5 ngày (3,592,000,000 ms)
- **Header:** `Authorization: Bearer <access_token>`

### Các endpoint KHÔNG cần đăng nhập (Public)

| Method | Endpoint |
|---|---|
| POST | `/api/v1/auth/login` |
| POST | `/api/v1/auth/refresh` |
| GET | `/api/v1/auth/get-session` |
| GET | `/api/v1/users/exist-email` |
| GET | `/api/v1/users/check-username` |
| GET | `/api/v1/users/exist-phone` |
| GET | `/api/v1/topics/exist-name` |
| GET | `/api/v1/topics/exist-url` |
| GET | `/api/v1/sources/exist-name` |
| GET | `/api/v1/sources/exist-url` |
| GET | `/api/v1/articles/exist-link` |
| GET | `/swagger-ui/**` |
| GET | `/v3/api-docs/**` |

### Tất cả endpoint khác cần header:

```
Authorization: Bearer <access_token>
```

---

## 4. MODULE: XÁC THỰC (AUTHENTICATION)

### Mô tả màn hình

#### Màn hình: Đăng nhập (Login Screen)

**Mục đích:** Cho phép người dùng đăng nhập vào hệ thống bằng tài khoản/mật khẩu.

**Luồng xử lý:**
1. Người dùng nhập `username` và `password`
2. Nhấn nút "Đăng nhập"
3. Gọi API `POST /api/v1/auth/login`
4. Nếu thành công: lưu `accessToken` và `refreshToken` vào localStorage/sessionStorage, chuyển hướng đến trang chủ
5. Nếu thất bại: hiển thị thông báo lỗi

**Các trường hiển thị:**
- Input: Tên đăng nhập (username)
- Input: Mật khẩu (password, type=password)
- Button: Đăng nhập
- Link: Quên mật khẩu (nếu có)

**Validation phía client:**
- Username: bắt buộc, không được để trống
- Password: bắt buộc, không được để trống

---

### API: Đăng nhập

```
POST /api/v1/auth/login
Content-Type: application/json
(Không cần Authorization header)
```

**Request Body:**

```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `username` | `string` | Có | Tên đăng nhập, không được để trống |
| `password` | `string` | Có | Mật khẩu, không được để trống |

**Response thành công (200):**

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "access_token": "eyJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
    "token_expired_seconds": 2592000,
    "refresh_expired_seconds": 3592000,
    "token_type": "Bearer"
  }
}
```

| Field | Type | Mô tả |
|---|---|---|
| `id` | `long` | ID của người dùng |
| `access_token` | `string` | JWT access token (dùng cho các request tiếp theo) |
| `refresh_token` | `string` | JWT refresh token (dùng để gia hạn access token) |
| `token_expired_seconds` | `long` | Thời gian sống của access token (giây) |
| `refresh_expired_seconds` | `long` | Thời gian sống của refresh token (giây) |
| `token_type` | `string` | Luôn là `"Bearer"` |

**Response lỗi (401):**

```json
{
  "status": 401,
  "message": "Unauthorized - Invalid credentials",
  "data": null,
  "timestamp": "2026-03-25T10:00:00.000Z"
}
```

---

### API: Làm mới token (Refresh Token)

```
POST /api/v1/auth/refresh
Content-Type: application/json
(Không cần Authorization header)
```

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Response thành công (200):** Trả về cùng cấu trúc với Login response.

**Khi nào gọi:** Khi nhận được lỗi 401 từ bất kỳ API nào, frontend nên tự động gọi API này để lấy access token mới, rồi retry request gốc.

---

### API: Đăng xuất

```
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Request Body:** Không có

**Response thành công (200):**

```json
{
  "status": 200,
  "message": "Success",
  "data": null
}
```

**Xử lý phía client:** Xóa `accessToken` và `refreshToken` khỏi storage, chuyển về trang đăng nhập.

---

### API: Kiểm tra phiên làm việc

```
GET /api/v1/auth/get-session
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "status": 200,
  "data": "ok"
}
```

**Mục đích:** Kiểm tra xem token hiện tại còn hợp lệ không. Dùng khi app khởi động để xác định user đã đăng nhập chưa.

---

## 5. MODULE: NGƯỜI DÙNG (USER)

### Mô tả màn hình

#### Màn hình: Danh sách người dùng (User List Screen)

**Mục đích:** Xem và quản lý danh sách tất cả người dùng trong hệ thống.

**Các thành phần giao diện:**
- **Search bar:** Tìm kiếm theo tên, email, username, số điện thoại
- **Filter:** Lọc theo trạng thái (Tất cả / Hoạt động / Vô hiệu hóa)
- **Bảng dữ liệu** với các cột:
  - STT
  - Username
  - Họ tên
  - Email
  - Số điện thoại
  - Trạng thái (badge: Hoạt động / Vô hiệu hóa)
  - Thao tác (Xem / Sửa / Xóa / Reset mật khẩu)
- **Phân trang:** Hiển thị tổng số, điều hướng trang
- **Nút:** "Thêm người dùng"

**Luồng xử lý:**
1. Khi vào màn hình, gọi API filter với page=0, size=10
2. Khi nhập keyword, debounce 500ms rồi gọi lại API với keyword mới
3. Khi thay đổi filter status, gọi lại API
4. Khi thay đổi trang, gọi lại API với page mới

**Trạng thái người dùng (User Status):**

| Giá trị | Nhãn | Màu badge |
|---|---|---|
| `0` | Hoạt động (Active) | Xanh lá |
| `1` | Vô hiệu hóa (Inactive) | Đỏ |
| `-1` | Không xác định (Unknown) | Xám |

---

#### Màn hình: Thêm/Sửa người dùng (User Form Screen)

**Mục đích:** Thêm mới hoặc chỉnh sửa thông tin người dùng.

**Các trường nhập liệu:**

| Field | Label | Type | Bắt buộc | Validation |
|---|---|---|---|---|
| `username` | Tên đăng nhập | text | Có | Tối đa 50 ký tự, unique - check realtime |
| `fullName` | Họ và tên | text | Có | Tối đa 50 ký tự |
| `email` | Email | email | Có | Tối đa 256 ký tự, đúng định dạng, unique - check realtime |
| `phoneNumber` | Số điện thoại | tel | Không | Đúng định dạng Việt Nam, unique - check realtime |
| `status` | Trạng thái | select | Có | 0=Hoạt động, 1=Vô hiệu hóa |

**Lưu ý UX:**
- Khi **thêm mới**: Hệ thống tự sinh mật khẩu mặc định hoặc gửi email đặt lại mật khẩu
- Khi **chỉnh sửa**: Không cho phép đổi `username`
- Validate realtime khi blur khỏi field

---

#### Màn hình: Chi tiết người dùng (User Detail Screen)

**Mục đích:** Xem chi tiết thông tin người dùng và lịch sử hoạt động.

**Các tab:**
1. **Thông tin chung:** Hiển thị toàn bộ thông tin profile
2. **Lịch sử hoạt động:** Danh sách các hành động của user theo thứ tự thời gian

---

#### Màn hình: Đổi mật khẩu (Change Password Screen)

**Mục đích:** Cho phép người dùng tự thay đổi mật khẩu của mình.

**Các trường:**
- Mật khẩu cũ (required)
- Mật khẩu mới (required, min 8 ký tự, có chữ hoa, số, ký tự đặc biệt)
- Xác nhận mật khẩu mới (phải khớp với mật khẩu mới)

---

### API: Tạo người dùng mới

```
POST /api/v1/users
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "username": "johndoe",
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "phone_number": "0901234567",
  "status": 0
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `username` | `string` | Có | Tối đa 50 ký tự |
| `full_name` | `string` | Có | Tối đa 50 ký tự |
| `email` | `string` | Có | Tối đa 256 ký tự, đúng định dạng email |
| `phone_number` | `string` | Không | Số điện thoại hợp lệ |
| `status` | `int` | Không | 0=Hoạt động (mặc định), 1=Vô hiệu hóa |

**Response thành công (201):**

```json
{
  "status": 201,
  "message": "Created",
  "data": {
    "id": 1,
    "username": "johndoe",
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "phone_number": "0901234567",
    "avatar": null,
    "status": 0
  }
}
```

---

### API: Cập nhật người dùng

```
PUT /api/v1/users/{id}
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameter:** `id` (Long) - ID người dùng cần cập nhật

**Request Body:** Tương tự Create (UserRequest)

**Response thành công (200):** Trả về UserResponse đã cập nhật

---

### API: Xóa người dùng

```
DELETE /api/v1/users/{id}
Authorization: Bearer <access_token>
```

**Path Parameter:** `id` (Long) - ID người dùng cần xóa

**Response thành công (200):**

```json
{
  "status": 200,
  "message": "Success",
  "data": null
}
```

> **Lưu ý:** Xóa mềm (soft delete) - không xóa vật lý khỏi database.

---

### API: Lấy chi tiết người dùng

```
GET /api/v1/users/{id}
Authorization: Bearer <access_token>
```

**Path Parameter:** `id` (Long)

**Response thành công (200):**

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "username": "johndoe",
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "phone_number": "0901234567",
    "avatar": "https://example.com/avatar.jpg",
    "status": 0
  }
}
```

---

### API: Tìm kiếm/Lọc người dùng

```
POST /api/v1/users/filter
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "page": 0,
  "size": 10,
  "keyword": "john",
  "status": [0, 1]
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `page` | `int` | Không | Số trang, bắt đầu từ 0 (mặc định: 0) |
| `size` | `int` | Không | Số record mỗi trang (mặc định: 10) |
| `keyword` | `string` | Không | Tìm kiếm theo username, email, họ tên, SĐT |
| `status` | `int[]` | Không | Lọc theo danh sách trạng thái. Null = tất cả |

**Response thành công (200):**

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": 1,
        "username": "johndoe",
        "full_name": "John Doe",
        "phone_number": "0901234567",
        "email": "john.doe@example.com",
        "status": 0
      }
    ],
    "amount": 1
  }
}
```

---

### API: Lấy lịch sử hoạt động người dùng

```
GET /api/v1/users/{id}/histories?page=0&size=10
Authorization: Bearer <access_token>
```

**Path Parameter:** `id` (Long)

**Query Parameters:**

| Param | Type | Mặc định | Mô tả |
|---|---|---|---|
| `page` | `int` | `0` | Số trang |
| `size` | `int` | `10` | Số record/trang |

**Response thành công (200):**

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": 1,
        "user_id": 1,
        "message": "Người dùng đã đăng nhập",
        "created_at": 1742893200000,
        "created_by": "system"
      }
    ],
    "amount": 5
  }
}
```

| Field | Type | Mô tả |
|---|---|---|
| `id` | `long` | ID bản ghi lịch sử |
| `user_id` | `long` | ID người dùng |
| `message` | `string` | Mô tả hành động |
| `created_at` | `long` | Timestamp milliseconds |
| `created_by` | `string` | Người thực hiện hành động |

---

### API: Reset mật khẩu (Admin)

```
PUT /api/v1/users/reset-password/{id}
Authorization: Bearer <access_token>
```

**Path Parameter:** `id` (Long) - ID người dùng cần reset

**Request Body:** Không có

**Response thành công (200):**

```json
{
  "status": 200,
  "message": "Success",
  "data": null
}
```

> **Mục đích:** Admin reset mật khẩu người dùng về mặc định hoặc gửi email reset.

---

### API: Đổi mật khẩu (User tự đổi)

```
PUT /api/v1/users/{id}/password
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameter:** `id` (Long) - ID của chính người dùng đang đăng nhập

**Request Body:**

```json
{
  "old_password": "OldPass@123",
  "new_password": "NewPass@123",
  "confirm_password": "NewPass@123"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `old_password` | `string` | Có | Mật khẩu hiện tại |
| `new_password` | `string` | Có | Mật khẩu mới (phải đủ mạnh) |
| `confirm_password` | `string` | Có | Xác nhận mật khẩu mới (phải khớp `new_password`) |

**Response thành công (200):**

```json
{
  "status": 200,
  "message": "Success",
  "data": null
}
```

---

### API: Kiểm tra email tồn tại

```
GET /api/v1/users/exist-email?email=john@example.com
(Không cần Authorization)
```

**Query Parameter:** `email` (string) - Email cần kiểm tra

**Response (200):** Nếu email chưa tồn tại, trả về 200 thành công
**Response (4xx):** Nếu email đã tồn tại, trả về lỗi

> **Dùng khi:** Validate realtime trong form thêm/sửa người dùng.

---

### API: Kiểm tra username tồn tại

```
GET /api/v1/users/check-username?username=johndoe
(Không cần Authorization)
```

**Query Parameter:** `username` (string)

---

### API: Kiểm tra số điện thoại tồn tại

```
GET /api/v1/users/exist-phone?phone_number=0901234567
(Không cần Authorization)
```

**Query Parameter:** `phone_number` (string)

---

## 6. MODULE: NGUỒN TIN (SOURCE)

### Mô tả màn hình

#### Màn hình: Danh sách nguồn tin (Source List Screen)

**Mục đích:** Quản lý danh sách các nguồn tin tức (VnExpress, Tuổi Trẻ, Thanh Niên, v.v.)

**Các thành phần giao diện:**
- **Search bar:** Tìm kiếm theo tên nguồn
- **Bảng dữ liệu** với các cột:
  - STT
  - Logo/Avatar (thumbnail)
  - Tên nguồn
  - URL
  - Loại (Type)
  - Mô tả
  - Thao tác (Xem / Sửa / Xóa)
- **Phân trang**
- **Nút:** "Thêm nguồn tin"

---

#### Màn hình: Thêm/Sửa nguồn tin (Source Form Screen)

**Các trường nhập liệu:**

| Field | Label | Type | Bắt buộc | Validation |
|---|---|---|---|---|
| `name` | Tên nguồn | text | Có | Tối đa 1024 ký tự, unique |
| `url` | URL website | url | Có | Tối đa 1024 ký tự, unique, đúng định dạng URL |
| `avatar` | URL Logo/Avatar | url | Không | Tối đa 1024 ký tự |
| `type` | Loại nguồn | select | Không | Số nguyên |
| `description` | Mô tả | textarea | Không | Tối đa 5000 ký tự |

**Loại nguồn (Source Type):** *(frontend tự định nghĩa nhãn cho phù hợp)*
- `0`: Báo điện tử
- `1`: Tạp chí
- `2`: Blog
- `3`: Khác

---

### API: Tạo nguồn tin mới

```
POST /api/v1/sources
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "VnExpress",
  "url": "https://vnexpress.net",
  "avatar": "https://vnexpress.net/logo.png",
  "type": 0,
  "description": "Báo điện tử VnExpress"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `name` | `string` | Có | Tối đa 1024 ký tự |
| `url` | `string` | Có | Tối đa 1024 ký tự |
| `avatar` | `string` | Không | URL ảnh logo, tối đa 1024 ký tự |
| `type` | `int` | Không | Loại nguồn tin |
| `description` | `string` | Không | Tối đa 5000 ký tự |

**Response thành công (201):**

```json
{
  "status": 201,
  "message": "Created",
  "data": {
    "id": 1,
    "name": "VnExpress",
    "url": "https://vnexpress.net",
    "avatar": "https://vnexpress.net/logo.png",
    "type": 0,
    "description": "Báo điện tử VnExpress"
  }
}
```

---

### API: Cập nhật nguồn tin

```
PUT /api/v1/sources/{id}
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameter:** `id` (Long)

**Request Body:** Tương tự Create (SourceRequest)

**Response (200):** Trả về SourceResponse đã cập nhật.

---

### API: Xóa nguồn tin

```
DELETE /api/v1/sources/{id}
Authorization: Bearer <access_token>
```

**Path Parameter:** `id` (Long)

**Response (200):** `data: null`

> **Lưu ý:** Khi xóa nguồn tin, các Topic và Article liên quan cũng sẽ bị ảnh hưởng (soft delete theo cascade hoặc báo lỗi nếu còn dữ liệu con - cần confirm với backend).

---

### API: Lấy chi tiết nguồn tin

```
GET /api/v1/sources/{id}
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "status": 200,
  "data": {
    "id": 1,
    "name": "VnExpress",
    "url": "https://vnexpress.net",
    "avatar": "https://vnexpress.net/logo.png",
    "type": 0,
    "description": "Báo điện tử VnExpress"
  }
}
```

---

### API: Tìm kiếm/Lọc nguồn tin

```
POST /api/v1/sources/filter
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "page": 0,
  "size": 10,
  "keyword": "vnexpress"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `page` | `int` | Không | Số trang (mặc định: 0) |
| `size` | `int` | Không | Số record/trang (mặc định: 10) |
| `keyword` | `string` | Không | Tìm theo tên, URL, mô tả |

**Response (200):**

```json
{
  "status": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "name": "VnExpress",
        "url": "https://vnexpress.net",
        "avatar": "https://vnexpress.net/logo.png",
        "type": 0,
        "description": "Báo điện tử VnExpress"
      }
    ],
    "amount": 1
  }
}
```

---

### API: Lấy tất cả nguồn tin kèm chủ đề

```
GET /api/v1/sources/all-with-topics
Authorization: Bearer <access_token>
```

**Mục đích:** Dùng cho dropdown/select chọn nguồn + chủ đề liên quan (dùng trong form tạo Topic).

**Response (200):**

```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "name": "VnExpress",
      "topics": [
        {
          "id": 1,
          "name": "Thời sự"
        },
        {
          "id": 2,
          "name": "Kinh doanh"
        }
      ]
    }
  ]
}
```

---

### API: Kiểm tra tên nguồn tồn tại

```
GET /api/v1/sources/exist-name?name=VnExpress
(Không cần Authorization)
```

---

### API: Kiểm tra URL nguồn tồn tại

```
GET /api/v1/sources/exist-url?url=https://vnexpress.net
(Không cần Authorization)
```

---

## 7. MODULE: CHỦ ĐỀ (TOPIC)

### Mô tả màn hình

#### Màn hình: Danh sách chủ đề (Topic List Screen)

**Mục đích:** Quản lý các chủ đề/chuyên mục của các nguồn tin (Thời sự, Kinh doanh, Thể thao, v.v.)

**Mối quan hệ dữ liệu:** Mỗi Topic thuộc về một Source (nguồn tin).

**Các thành phần giao diện:**
- **Search bar:** Tìm kiếm theo tên chủ đề
- **Bảng dữ liệu** với các cột:
  - STT
  - Tên chủ đề
  - Nguồn tin (Source Name)
  - URL
  - RSS URL
  - Mô tả
  - Thao tác (Xem / Sửa / Xóa)
- **Phân trang**
- **Nút:** "Thêm chủ đề"

---

#### Màn hình: Thêm/Sửa chủ đề (Topic Form Screen)

**Các trường nhập liệu:**

| Field | Label | Type | Bắt buộc | Validation |
|---|---|---|---|---|
| `sourceId` | Nguồn tin | select | Có | Phải chọn từ danh sách nguồn tin có sẵn |
| `name` | Tên chủ đề | text | Có | Tối đa 1024 ký tự, unique |
| `url` | URL chủ đề | url | Có | Tối đa 1024 ký tự, unique, đúng định dạng URL |
| `rssUrl` | RSS URL | url | Không | Tối đa 1024 ký tự |
| `description` | Mô tả | textarea | Không | Tối đa 5000 ký tự |

**Lưu ý UX:**
- Dropdown `sourceId` load từ API `GET /api/v1/sources/all-with-topics`
- Validate tên và URL realtime khi blur

---

### API: Tạo chủ đề mới

```
POST /api/v1/topics
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Thời sự",
  "url": "https://vnexpress.net/thoi-su",
  "rss_url": "https://vnexpress.net/rss/thoi-su.rss",
  "description": "Tin tức thời sự trong nước và quốc tế",
  "source_id": 1
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `name` | `string` | Có | Tối đa 1024 ký tự |
| `url` | `string` | Có | Tối đa 1024 ký tự |
| `rss_url` | `string` | Không | URL RSS feed, tối đa 1024 ký tự |
| `description` | `string` | Không | Tối đa 5000 ký tự |
| `source_id` | `long` | Có | ID nguồn tin cha |

**Response thành công (201):**

```json
{
  "status": 201,
  "message": "Created",
  "data": {
    "id": 1,
    "name": "Thời sự",
    "url": "https://vnexpress.net/thoi-su",
    "rss_url": "https://vnexpress.net/rss/thoi-su.rss",
    "description": "Tin tức thời sự trong nước và quốc tế",
    "source_id": 1,
    "source_name": "VnExpress"
  }
}
```

---

### API: Cập nhật chủ đề

```
PUT /api/v1/topics/{id}
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameter:** `id` (Long)

**Request Body:** Tương tự Create (TopicRequest)

**Response (200):** Trả về TopicResponse đã cập nhật.

---

### API: Xóa chủ đề

```
DELETE /api/v1/topics/{id}
Authorization: Bearer <access_token>
```

**Path Parameter:** `id` (Long)

**Response (200):** `data: null`

---

### API: Lấy chi tiết chủ đề

```
GET /api/v1/topics/{id}
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "status": 200,
  "data": {
    "id": 1,
    "name": "Thời sự",
    "url": "https://vnexpress.net/thoi-su",
    "rss_url": "https://vnexpress.net/rss/thoi-su.rss",
    "description": "Tin tức thời sự",
    "source_id": 1,
    "source_name": "VnExpress"
  }
}
```

---

### API: Tìm kiếm/Lọc chủ đề

```
POST /api/v1/topics/filter
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "page": 0,
  "size": 10,
  "keyword": "thời sự"
}
```

**Response (200):**

```json
{
  "status": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "name": "Thời sự",
        "url": "https://vnexpress.net/thoi-su",
        "rss_url": "https://vnexpress.net/rss/thoi-su.rss",
        "description": "Tin tức thời sự",
        "source_id": 1,
        "source_name": "VnExpress"
      }
    ],
    "amount": 1
  }
}
```

---

### API: Kiểm tra tên chủ đề tồn tại

```
GET /api/v1/topics/exist-name?name=Thời sự
(Không cần Authorization)
```

---

### API: Kiểm tra URL chủ đề tồn tại

```
GET /api/v1/topics/exist-url?url=https://vnexpress.net/thoi-su
(Không cần Authorization)
```

---

## 8. MODULE: BÀI VIẾT (ARTICLE)

### Mô tả màn hình

#### Màn hình: Danh sách bài viết (Article List Screen)

**Mục đích:** Quản lý toàn bộ bài viết đã thu thập từ các nguồn tin tức.

**Mối quan hệ dữ liệu:** Mỗi Article thuộc về một Topic, Topic thuộc về một Source.

**Các thành phần giao diện:**
- **Search bar:** Tìm kiếm theo tiêu đề bài viết
- **Filter:** Lọc theo chủ đề (Topic)
- **Bảng dữ liệu** với các cột:
  - STT
  - Ảnh thumbnail
  - Tiêu đề (title) - có thể click để mở link gốc
  - Chủ đề (Topic Name)
  - Ngày xuất bản (pub_date - format datetime)
  - Thao tác (Xem / Sửa / Xóa)
- **Phân trang**
- **Nút:** "Thêm bài viết"

**Format ngày giờ:** `pubDate` là timestamp milliseconds, hiển thị dạng `dd/MM/yyyy HH:mm`

---

#### Màn hình: Thêm/Sửa bài viết (Article Form Screen)

**Mục đích:** Thêm mới hoặc chỉnh sửa thông tin bài viết.

**Các trường nhập liệu:**

| Field | Label | Type | Bắt buộc | Validation |
|---|---|---|---|---|
| `topicId` | Chủ đề | select | Có | Phải chọn từ danh sách chủ đề |
| `title` | Tiêu đề | text | Có | Tối đa 1024 ký tự |
| `link` | URL bài viết | url | Có | Tối đa 1024 ký tự, unique, đúng định dạng URL |
| `guid` | GUID | text | Không | Tối đa 1024 ký tự (ID duy nhất từ RSS feed) |
| `pubDate` | Ngày xuất bản | datetime | Không | Timestamp milliseconds |
| `imageLink` | URL ảnh đại diện | url | Không | Tối đa 5000 ký tự |
| `description` | Mô tả / Tóm tắt | textarea | Không | Tối đa 5000 ký tự |

**Lưu ý UX:**
- Dropdown `topicId` load từ API filter topics
- `pubDate` ở backend là Unix timestamp ms, frontend dùng date picker rồi convert sang timestamp
- Validate link realtime

---

#### Màn hình: Chi tiết bài viết (Article Detail Screen)

**Hiển thị:**
- Ảnh bìa (imageLink)
- Tiêu đề (title) - có link ra bài gốc
- Chủ đề / Nguồn tin
- Ngày xuất bản
- Mô tả / Tóm tắt (description)
- Nút "Xem bài viết gốc" → mở link trong tab mới

---

### API: Tạo bài viết mới

```
POST /api/v1/articles
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Kinh tế Việt Nam tăng trưởng mạnh năm 2026",
  "link": "https://vnexpress.net/kinh-te-viet-nam-tang-truong-2026-123456.html",
  "guid": "guid-123456",
  "description": "GDP Việt Nam tăng trưởng 7.5% trong quý đầu năm 2026...",
  "pub_date": 1742893200000,
  "image_link": "https://i1-vneconomy.vnecdn.net/example.jpg",
  "topic_id": 2
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `title` | `string` | Có | Tiêu đề bài viết, tối đa 1024 ký tự |
| `link` | `string` | Có | URL gốc bài viết, unique, tối đa 1024 ký tự |
| `guid` | `string` | Không | ID duy nhất từ RSS feed, tối đa 1024 ký tự |
| `description` | `string` | Không | Tóm tắt nội dung, tối đa 5000 ký tự |
| `pub_date` | `long` | Không | Ngày đăng bài (Unix timestamp milliseconds) |
| `image_link` | `string` | Không | URL ảnh thumbnail, tối đa 5000 ký tự |
| `topic_id` | `long` | Có | ID chủ đề |

**Response thành công (201):**

```json
{
  "status": 201,
  "message": "Created",
  "data": {
    "id": 1,
    "title": "Kinh tế Việt Nam tăng trưởng mạnh năm 2026",
    "link": "https://vnexpress.net/kinh-te-viet-nam-tang-truong-2026-123456.html",
    "guid": "guid-123456",
    "description": "GDP Việt Nam tăng trưởng 7.5% trong quý đầu năm 2026...",
    "pub_date": 1742893200000,
    "image_link": "https://i1-vneconomy.vnecdn.net/example.jpg",
    "topic_id": 2,
    "topic_name": "Kinh doanh"
  }
}
```

---

### API: Cập nhật bài viết

```
PUT /api/v1/articles/{id}
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameter:** `id` (Long)

**Request Body:** Tương tự Create (ArticleRequest)

**Response (200):** Trả về ArticleResponse đã cập nhật.

---

### API: Xóa bài viết

```
DELETE /api/v1/articles/{id}
Authorization: Bearer <access_token>
```

**Path Parameter:** `id` (Long)

**Response (200):** `data: null`

---

### API: Lấy chi tiết bài viết

```
GET /api/v1/articles/{id}
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "status": 200,
  "data": {
    "id": 1,
    "title": "Kinh tế Việt Nam tăng trưởng mạnh năm 2026",
    "link": "https://vnexpress.net/kinh-te-2026-123456.html",
    "guid": "guid-123456",
    "description": "GDP Việt Nam tăng trưởng 7.5%...",
    "pub_date": 1742893200000,
    "image_link": "https://example.com/img.jpg",
    "topic_id": 2,
    "topic_name": "Kinh doanh"
  }
}
```

---

### API: Tìm kiếm/Lọc bài viết

```
POST /api/v1/articles/filter
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "page": 0,
  "size": 10,
  "keyword": "kinh tế"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `page` | `int` | Không | Số trang (mặc định: 0) |
| `size` | `int` | Không | Số record/trang (mặc định: 10) |
| `keyword` | `string` | Không | Tìm theo tiêu đề, mô tả |

**Response (200):**

```json
{
  "status": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "title": "Kinh tế Việt Nam tăng trưởng mạnh năm 2026",
        "link": "https://vnexpress.net/kinh-te-2026.html",
        "guid": "guid-123456",
        "description": "Tóm tắt bài viết...",
        "pub_date": 1742893200000,
        "image_link": "https://example.com/img.jpg",
        "topic_id": 2,
        "topic_name": "Kinh doanh"
      }
    ],
    "amount": 50
  }
}
```

---

### API: Kiểm tra link bài viết tồn tại

```
GET /api/v1/articles/exist-link?link=https://vnexpress.net/example.html
(Không cần Authorization)
```

---

## 9. BẢNG MÃ LỖI

| HTTP Status | Ý nghĩa | Trường hợp xảy ra |
|---|---|---|
| `200` | Thành công | Request xử lý thành công |
| `201` | Tạo mới thành công | POST tạo resource mới |
| `400` | Bad Request | Dữ liệu đầu vào không hợp lệ (validation failed) |
| `401` | Unauthorized | Thiếu token hoặc token hết hạn/không hợp lệ |
| `403` | Forbidden | Không có quyền thực hiện thao tác |
| `404` | Not Found | Resource không tồn tại (ID không tìm thấy) |
| `409` | Conflict | Dữ liệu trùng lặp (username/email/URL đã tồn tại) |
| `500` | Internal Server Error | Lỗi hệ thống |

### Cấu trúc lỗi

```json
{
  "status": 400,
  "message": "Validation failed: username must not be blank",
  "data": null,
  "timestamp": "2026-03-25T10:00:00.000Z"
}
```

### Xử lý lỗi phía client

```
401 → Gọi refresh token → Nếu refresh cũng fail → Đăng xuất, về trang login
403 → Hiển thị thông báo "Không có quyền thực hiện thao tác"
404 → Hiển thị thông báo "Không tìm thấy dữ liệu"
409 → Hiển thị thông báo lỗi cụ thể (vd: "Email đã được sử dụng")
500 → Hiển thị thông báo "Có lỗi xảy ra, vui lòng thử lại"
```

---

## 10. DATA MODELS TỔNG HỢP

### Sơ đồ quan hệ

```
Source (1) ──── (*) Topic (1) ──── (*) Article
User (1) ──── (*) UserHistory
```

### Enum: User Status

| Giá trị | Tên | Ý nghĩa |
|---|---|---|
| `0` | ACTIVE | Tài khoản đang hoạt động |
| `1` | INACTIVE | Tài khoản bị vô hiệu hóa |
| `-1` | UNKNOWN | Trạng thái không xác định |

### Tổng hợp tất cả API Endpoints

| # | Method | Endpoint | Auth | Mô tả |
|---|---|---|---|---|
| 1 | POST | `/api/v1/auth/login` | No | Đăng nhập |
| 2 | POST | `/api/v1/auth/logout` | Yes | Đăng xuất |
| 3 | POST | `/api/v1/auth/refresh` | No | Làm mới token |
| 4 | GET | `/api/v1/auth/get-session` | No | Kiểm tra phiên |
| 5 | POST | `/api/v1/users` | Yes | Tạo người dùng |
| 6 | PUT | `/api/v1/users/{id}` | Yes | Cập nhật người dùng |
| 7 | DELETE | `/api/v1/users/{id}` | Yes | Xóa người dùng |
| 8 | GET | `/api/v1/users/{id}` | Yes | Chi tiết người dùng |
| 9 | POST | `/api/v1/users/filter` | Yes | Lọc người dùng |
| 10 | GET | `/api/v1/users/{id}/histories` | Yes | Lịch sử người dùng |
| 11 | PUT | `/api/v1/users/reset-password/{id}` | Yes | Reset mật khẩu (Admin) |
| 12 | PUT | `/api/v1/users/{id}/password` | Yes | Đổi mật khẩu |
| 13 | GET | `/api/v1/users/exist-email` | No | Kiểm tra email |
| 14 | GET | `/api/v1/users/check-username` | No | Kiểm tra username |
| 15 | GET | `/api/v1/users/exist-phone` | No | Kiểm tra SĐT |
| 16 | POST | `/api/v1/sources` | Yes | Tạo nguồn tin |
| 17 | PUT | `/api/v1/sources/{id}` | Yes | Cập nhật nguồn tin |
| 18 | DELETE | `/api/v1/sources/{id}` | Yes | Xóa nguồn tin |
| 19 | GET | `/api/v1/sources/{id}` | Yes | Chi tiết nguồn tin |
| 20 | POST | `/api/v1/sources/filter` | Yes | Lọc nguồn tin |
| 21 | GET | `/api/v1/sources/all-with-topics` | Yes | Tất cả nguồn + chủ đề |
| 22 | GET | `/api/v1/sources/exist-name` | No | Kiểm tra tên nguồn |
| 23 | GET | `/api/v1/sources/exist-url` | No | Kiểm tra URL nguồn |
| 24 | POST | `/api/v1/topics` | Yes | Tạo chủ đề |
| 25 | PUT | `/api/v1/topics/{id}` | Yes | Cập nhật chủ đề |
| 26 | DELETE | `/api/v1/topics/{id}` | Yes | Xóa chủ đề |
| 27 | GET | `/api/v1/topics/{id}` | Yes | Chi tiết chủ đề |
| 28 | POST | `/api/v1/topics/filter` | Yes | Lọc chủ đề |
| 29 | GET | `/api/v1/topics/exist-name` | No | Kiểm tra tên chủ đề |
| 30 | GET | `/api/v1/topics/exist-url` | No | Kiểm tra URL chủ đề |
| 31 | POST | `/api/v1/articles` | Yes | Tạo bài viết |
| 32 | PUT | `/api/v1/articles/{id}` | Yes | Cập nhật bài viết |
| 33 | DELETE | `/api/v1/articles/{id}` | Yes | Xóa bài viết |
| 34 | GET | `/api/v1/articles/{id}` | Yes | Chi tiết bài viết |
| 35 | POST | `/api/v1/articles/filter` | Yes | Lọc bài viết |
| 36 | GET | `/api/v1/articles/exist-link` | No | Kiểm tra link bài viết |

**Tổng cộng: 36 endpoints**

---

## PHỤ LỤC: Gợi ý cấu trúc Frontend

### Cây màn hình đề xuất

```
/ (Root)
├── /login                          → Màn hình đăng nhập
├── /dashboard                      → Trang chủ (sau đăng nhập)
├── /users                          → Danh sách người dùng
│   ├── /users/create               → Tạo người dùng mới
│   ├── /users/:id                  → Chi tiết người dùng
│   ├── /users/:id/edit             → Sửa người dùng
│   └── /users/:id/histories        → Lịch sử người dùng
├── /profile                        → Hồ sơ cá nhân
│   └── /profile/change-password    → Đổi mật khẩu
├── /sources                        → Danh sách nguồn tin
│   ├── /sources/create             → Tạo nguồn tin
│   ├── /sources/:id                → Chi tiết nguồn tin
│   └── /sources/:id/edit           → Sửa nguồn tin
├── /topics                         → Danh sách chủ đề
│   ├── /topics/create              → Tạo chủ đề
│   ├── /topics/:id                 → Chi tiết chủ đề
│   └── /topics/:id/edit            → Sửa chủ đề
└── /articles                       → Danh sách bài viết
    ├── /articles/create            → Tạo bài viết
    ├── /articles/:id               → Chi tiết bài viết
    └── /articles/:id/edit          → Sửa bài viết
```

### Token Management

```javascript
// Lưu token sau đăng nhập
localStorage.setItem('access_token', data.access_token)
localStorage.setItem('refresh_token', data.refresh_token)

// Gửi kèm mọi request
headers: {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json'
}

// Interceptor: Tự động refresh khi nhận 401
// 1. Gọi POST /api/v1/auth/refresh với refresh_token
// 2. Lưu access_token mới
// 3. Retry request gốc
// 4. Nếu refresh cũng 401 → logout
```

### Công thức phân trang

```javascript
// Từ response:
const { content, amount } = response.data
const totalPages = Math.ceil(amount / pageSize)

// Khi gọi API:
body = { page: currentPage - 1, size: pageSize, keyword: searchText }
// (page bắt đầu từ 0 ở backend, nếu UI hiển thị từ 1 thì trừ 1 khi gửi)
```

---

*Tài liệu này được tạo từ mã nguồn backend. Mọi thay đổi API cần cập nhật lại tài liệu này.*
