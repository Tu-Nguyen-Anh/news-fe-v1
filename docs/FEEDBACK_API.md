# Feedback (Góp ý) API Documentation

Base URL: `/api/v1/feedbacks` (User) · `/api/v1/admin/feedbacks` (Admin)

---

## Tổng quan

Chức năng **Góp ý / Đóng góp ý kiến** cho phép người dùng:
- Gửi góp ý kèm ảnh (paste hoặc chọn file)
- Xem danh sách góp ý của mình
- Xóa góp ý (ảnh cũng bị xóa khỏi storage)

Admin có thể:
- Xem tất cả góp ý, lọc theo trạng thái
- Cập nhật trạng thái xử lý

---

## Authentication

Tất cả endpoint đều yêu cầu JWT Bearer token.

```
Authorization: Bearer <access_token>
```

---

## Common Headers

| Header | Required | Default | Mô tả |
|--------|----------|---------|-------|
| `Authorization` | Yes | — | `Bearer <access_token>` |
| `Accept-Language` | No | `en` | Ngôn ngữ thông báo (`en` / `vi`) |
| `Content-Type` | Yes (POST/PUT) | — | `application/json` |

---

## Trạng thái góp ý (Status)

| Giá trị | Label | Ý nghĩa |
|---------|-------|---------|
| `0` | `PENDING` | Mới gửi, chưa xem xét |
| `1` | `IN_REVIEW` | Đang xem xét |
| `2` | `RESOLVED` | Đã xử lý xong |
| `3` | `REJECTED` | Từ chối / không thực hiện |

---

## Error Responses

| HTTP | Error Code | Mô tả |
|------|-----------|-------|
| `404` | `org.oplearn.project.exception.base.feedback.FeedbackNotFoundException` | Góp ý không tồn tại |
| `403` | `org.oplearn.project.exception.base.feedback.FeedbackNotOwnerException` | Không có quyền thao tác góp ý này |
| `401` | — | Chưa đăng nhập |
| `400` | — | Dữ liệu không hợp lệ (validation error) |

---

## Luồng tạo góp ý có ảnh

```
1. User chọn / paste ảnh
      ↓
2. POST /api/v1/upload/images  →  [{ url, original_name, ... }]
      ↓
3. Lưu url[] vào state, hiển thị preview
      ↓
4. User nhập tiêu đề + nội dung, bấm Gửi
      ↓
5. POST /api/v1/feedbacks  →  { content, title, image_urls: [url1, url2] }
```

> Xem chi tiết bước 2 tại [UPLOAD_STORAGE_API.md](./UPLOAD_STORAGE_API.md)

---

## Endpoints — User

---

### 1. Tạo góp ý

**POST** `/api/v1/feedbacks`

**Request Body:**
```json
{
  "title": "Lỗi hiển thị màn hình chat",
  "content": "Khi mở nhóm chat có hơn 100 thành viên, danh sách bị lag và không load được avatar.",
  "image_urls": [
    "http://vps-ip:9008/oplearn/feedbacks/uuid1.jpg",
    "http://vps-ip:9008/oplearn/feedbacks/uuid2.png"
  ]
}
```

| Field | Type | Required | Ràng buộc |
|-------|------|----------|----------|
| `title` | string | No | Tối đa 255 ký tự |
| `content` | string | **Yes** | Không để trống, tối đa 5000 ký tự |
| `image_urls` | string[] | No | Tối đa 10 URL — phải là URL lấy từ `/upload/images` |

**Response:** `201 Created`
```json
{
  "message": "success",
  "data": {
    "id": 15,
    "user_id": 42,
    "user_full_name": "Nguyễn Văn A",
    "user_avatar": "http://vps-ip:9008/oplearn/avatars/uuid.jpg",
    "title": "Lỗi hiển thị màn hình chat",
    "content": "Khi mở nhóm chat có hơn 100 thành viên...",
    "status": 0,
    "status_label": "PENDING",
    "created_at": 1744251600000,
    "updated_at": 1744251600000,
    "images": [
      {
        "id": 31,
        "image_url": "http://vps-ip:9008/oplearn/feedbacks/uuid1.jpg",
        "original_name": "screenshot.jpg",
        "uploaded_at": 1744251500000
      },
      {
        "id": 32,
        "image_url": "http://vps-ip:9008/oplearn/feedbacks/uuid2.png",
        "original_name": "bug.png",
        "uploaded_at": 1744251510000
      }
    ]
  }
}
```

**Response fields:**

| Field | Type | Mô tả |
|-------|------|-------|
| `id` | number | ID của góp ý |
| `user_id` | number | ID người gửi |
| `user_full_name` | string | Tên đầy đủ người gửi |
| `user_avatar` | string \| null | Avatar người gửi |
| `title` | string \| null | Tiêu đề (nếu có) |
| `content` | string | Nội dung góp ý |
| `status` | number | Trạng thái (0–3) |
| `status_label` | string | Nhãn trạng thái (`PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`) |
| `created_at` | number | Thời gian tạo (epoch ms) |
| `updated_at` | number | Thời gian cập nhật lần cuối (epoch ms) |
| `images` | array | Danh sách ảnh đính kèm (có thể rỗng) |
| `images[].id` | number | ID ảnh |
| `images[].image_url` | string | URL xem ảnh |
| `images[].original_name` | string \| null | Tên file gốc |
| `images[].uploaded_at` | number | Thời gian upload (epoch ms) |

---

### 2. Danh sách góp ý của tôi

**GET** `/api/v1/feedbacks`

**Query Params:**

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | number | `0` | Trang (bắt đầu từ 0) |
| `size` | number | `10` | Số item mỗi trang |

**Response:** `200 OK`
```json
{
  "message": "success",
  "data": {
    "items": [
      {
        "id": 15,
        "user_id": 42,
        "user_full_name": "Nguyễn Văn A",
        "user_avatar": null,
        "title": "Lỗi hiển thị màn hình chat",
        "content": "Khi mở nhóm chat...",
        "status": 1,
        "status_label": "IN_REVIEW",
        "created_at": 1744251600000,
        "updated_at": 1744265000000,
        "images": [
          {
            "id": 31,
            "image_url": "http://vps-ip:9008/oplearn/feedbacks/uuid1.jpg",
            "original_name": "screenshot.jpg",
            "uploaded_at": 1744251500000
          }
        ]
      }
    ],
    "total": 3
  }
}
```

| Field | Type | Mô tả |
|-------|------|-------|
| `items` | array | Danh sách góp ý (sắp xếp mới nhất lên đầu) |
| `total` | number | Tổng số góp ý của user (dùng để tính phân trang) |

---

### 3. Chi tiết góp ý

**GET** `/api/v1/feedbacks/{feedbackId}`

> Chỉ xem được góp ý của chính mình. Nếu xem góp ý của người khác → `403 Forbidden`.

**Path Params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `feedbackId` | number | ID góp ý |

**Response:** `200 OK`
```json
{
  "message": "success",
  "data": {
    "id": 15,
    "user_id": 42,
    "user_full_name": "Nguyễn Văn A",
    "user_avatar": null,
    "title": "Lỗi hiển thị",
    "content": "Nội dung chi tiết...",
    "status": 0,
    "status_label": "PENDING",
    "created_at": 1744251600000,
    "updated_at": 1744251600000,
    "images": []
  }
}
```

---

### 4. Xóa góp ý

**DELETE** `/api/v1/feedbacks/{feedbackId}`

> Xóa mềm góp ý. Ảnh đính kèm cũng bị xóa khỏi storage.
> Chỉ chủ sở hữu mới được xóa.

**Path Params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `feedbackId` | number | ID góp ý cần xóa |

**Response:** `200 OK`
```json
{
  "message": "success",
  "data": null
}
```

**Errors:**

| HTTP | Nguyên nhân |
|------|-------------|
| `403` | Xóa góp ý của người khác |
| `404` | Góp ý không tồn tại |

---

## Endpoints — Admin

> Các endpoint admin không cần thêm quyền đặc biệt ngoài JWT token hiện tại.
> Cần cân nhắc bổ sung RBAC nếu cần phân quyền admin chặt hơn.

---

### 5. [Admin] Tất cả góp ý

**GET** `/api/v1/admin/feedbacks`

**Query Params:**

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `status` | number | — | Lọc theo trạng thái: `0`, `1`, `2`, `3`. Bỏ trống → tất cả |
| `page` | number | `0` | Trang |
| `size` | number | `10` | Số item/trang |

**Ví dụ:**
```
GET /api/v1/admin/feedbacks?status=0&page=0&size=20
# → Tất cả góp ý PENDING, trang đầu, 20 item
```

**Response:** `200 OK`
```json
{
  "message": "success",
  "data": {
    "items": [
      {
        "id": 15,
        "user_id": 42,
        "user_full_name": "Nguyễn Văn A",
        "user_avatar": null,
        "title": "Lỗi hiển thị màn hình chat",
        "content": "Khi mở nhóm chat...",
        "status": 0,
        "status_label": "PENDING",
        "created_at": 1744251600000,
        "updated_at": 1744251600000,
        "images": [
          {
            "id": 31,
            "image_url": "http://vps-ip:9008/oplearn/feedbacks/uuid1.jpg",
            "original_name": "screenshot.jpg",
            "uploaded_at": 1744251500000
          }
        ]
      }
    ],
    "total": 27
  }
}
```

---

### 6. [Admin] Cập nhật trạng thái góp ý

**PUT** `/api/v1/admin/feedbacks/{feedbackId}/status`

**Path Params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `feedbackId` | number | ID góp ý |

**Request Body:**
```json
{
  "status": 1
}
```

| Field | Type | Required | Ràng buộc |
|-------|------|----------|----------|
| `status` | number | **Yes** | `0`, `1`, `2`, hoặc `3` |

**Response:** `200 OK`
```json
{
  "message": "success",
  "data": {
    "id": 15,
    "user_id": 42,
    "user_full_name": "Nguyễn Văn A",
    "user_avatar": null,
    "title": "Lỗi hiển thị",
    "content": "...",
    "status": 1,
    "status_label": "IN_REVIEW",
    "created_at": 1744251600000,
    "updated_at": 1744265000000,
    "images": []
  }
}
```

---

## Gợi ý thiết kế UI

### Form góp ý

```
┌─────────────────────────────────────────────┐
│ Gửi góp ý                                   │
├─────────────────────────────────────────────┤
│ Tiêu đề (tuỳ chọn)                         │
│ ┌───────────────────────────────────────┐   │
│ │                                       │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Nội dung *                                  │
│ ┌───────────────────────────────────────┐   │
│ │                                       │   │
│ │  (có thể paste ảnh vào đây)          │   │
│ │                                       │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Ảnh đính kèm (tối đa 10)                   │
│ ┌──────┐ ┌──────┐ ┌──────────────────┐     │
│ │ img1 │ │ img2 │ │  + Thêm ảnh      │     │
│ └──────┘ └──────┘ └──────────────────┘     │
│ (drag & drop, click, hoặc paste Ctrl+V)     │
│                                             │
│              [Huỷ]  [Gửi góp ý]            │
└─────────────────────────────────────────────┘
```

### Badge trạng thái

```javascript
const STATUS_CONFIG = {
  0: { label: 'Chờ xử lý',    color: 'gray'   },
  1: { label: 'Đang xem xét', color: 'blue'   },
  2: { label: 'Đã xử lý',     color: 'green'  },
  3: { label: 'Từ chối',      color: 'red'    },
};
```

### Xử lý paste ảnh vào textarea

```javascript
const handlePaste = async (e) => {
  const files = Array.from(e.clipboardData.items)
    .filter(item => item.type.startsWith('image/'))
    .map(item => item.getAsFile());

  if (files.length === 0) return;
  e.preventDefault();

  // Upload ngay
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  try {
    const { data } = await api.post('/api/v1/upload/images', formData);
    const newUrls = data.data.map(r => ({ url: r.url, name: r.original_name }));
    setImages(prev => [...prev, ...newUrls].slice(0, 10)); // giới hạn 10
  } catch (err) {
    toast.error('Upload ảnh thất bại, vui lòng thử lại');
  }
};
```

### Submit form

```javascript
const handleSubmit = async () => {
  if (!content.trim()) {
    toast.error('Vui lòng nhập nội dung góp ý');
    return;
  }

  const payload = {
    title: title.trim() || undefined,
    content: content.trim(),
    image_urls: images.map(img => img.url),
  };

  try {
    await api.post('/api/v1/feedbacks', payload);
    toast.success('Gửi góp ý thành công!');
    onClose();
  } catch (err) {
    toast.error('Gửi thất bại, vui lòng thử lại');
  }
};
```

### Danh sách góp ý (trang "Góp ý của tôi")

```
┌─────────────────────────────────────────────────┐
│ Lỗi hiển thị màn hình chat     [Đang xem xét]  │
│ 10/04/2026 · 2 ảnh                              │
│ Khi mở nhóm chat có hơn 100 thành viên...       │
├─────────────────────────────────────────────────┤
│ Tính năng dark mode             [Chờ xử lý]     │
│ 09/04/2026 · Không có ảnh                       │
│ Mong muốn có thêm chế độ tối cho ứng dụng...   │
└─────────────────────────────────────────────────┘
```

---

## Định dạng thời gian

Các trường `created_at`, `updated_at`, `uploaded_at` đều là **epoch milliseconds** (Unix timestamp × 1000).

```javascript
// Hiển thị
const formatDate = (epochMs) => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(epochMs));
};
// → "10/04/2026, 09:30"
```
