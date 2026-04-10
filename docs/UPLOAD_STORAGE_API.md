# Upload & Storage API Documentation

Base URL: `/api/v1/upload`

Storage backend: **RustFS** (S3-compatible), endpoint được cấu hình qua biến môi trường.

---

## Tổng quan

File upload được tách thành **2 bước riêng biệt**:

```
Bước 1  →  POST /api/v1/upload/images   →  nhận về URL[]
Bước 2  →  POST /api/v1/feedbacks       →  gửi kèm URL[] đã có
```

Thiết kế này giúp:
- Preview ảnh ngay sau khi chọn (trước khi submit form)
- Retry riêng từng ảnh nếu upload lỗi
- Tái sử dụng endpoint upload cho nhiều tính năng (feedback, avatar, ...)

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

---

## Giới hạn file

| Thuộc tính | Giá trị |
|-----------|---------|
| Định dạng cho phép | `image/jpeg`, `image/png`, `image/gif`, `image/webp` |
| Kích thước tối đa / ảnh | **10 MB** |
| Số ảnh tối đa / request | **10 ảnh** |
| Kích thước request tối đa | 500 MB (cấu hình server) |

---

## Endpoint

### POST `/api/v1/upload/images`

Upload một hoặc nhiều ảnh lên RustFS storage.

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `files` | `File[]` | Yes | Danh sách file ảnh (field name phải là `files`) |

**Ví dụ request (fetch):**
```javascript
const formData = new FormData();
formData.append('files', file1);       // File object
formData.append('files', file2);       // nhiều file cùng key

const response = await fetch('/api/v1/upload/images', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData
});
```

**Ví dụ request (axios):**
```javascript
const formData = new FormData();
files.forEach(file => formData.append('files', file));

const { data } = await axios.post('/api/v1/upload/images', formData, {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

**Response:** `200 OK`
```json
{
  "message": "success",
  "data": [
    {
      "url": "http://vps-ip:9008/oplearn/feedbacks/a1b2c3d4-uuid.jpg",
      "original_name": "screenshot.jpg",
      "size": 204800,
      "content_type": "image/jpeg"
    },
    {
      "url": "http://vps-ip:9008/oplearn/feedbacks/e5f6g7h8-uuid.png",
      "original_name": "bug-report.png",
      "size": 512000,
      "content_type": "image/png"
    }
  ]
}
```

**Response fields:**

| Field | Type | Mô tả |
|-------|------|-------|
| `url` | string | URL công khai để truy cập ảnh — dùng để hiển thị preview và gửi khi tạo góp ý |
| `original_name` | string | Tên file gốc |
| `size` | number | Kích thước file (bytes) |
| `content_type` | string | MIME type của ảnh |

---

## Error Responses

| HTTP | Error Code | Nguyên nhân |
|------|-----------|-------------|
| `400` | `org.oplearn.project.exception.base.storage.InvalidFileTypeException` | File không phải ảnh hợp lệ (sai định dạng) |
| `400` | `org.oplearn.project.exception.base.storage.FileTooLargeException` | File vượt quá 10 MB |
| `400` | `org.oplearn.project.exception.base.storage.UploadFailedException` | Lỗi kết nối storage, thử lại sau |
| `413` | — | Request vượt quá 500 MB (giới hạn server) |
| `401` | — | Chưa đăng nhập |

---

## Lưu ý Frontend

### Paste ảnh từ clipboard

```javascript
document.addEventListener('paste', async (event) => {
  const items = Array.from(event.clipboardData.items);
  const imageItems = items.filter(item => item.type.startsWith('image/'));
  
  if (imageItems.length === 0) return;

  const files = imageItems.map(item => item.getAsFile());
  
  // Upload ngay khi paste
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  
  const { data } = await axios.post('/api/v1/upload/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  // Lưu URL để gắn vào form
  setUploadedUrls(prev => [...prev, ...data.data.map(r => r.url)]);
});
```

### Validate phía client trước khi upload

```javascript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 10;

function validateImage(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Chỉ chấp nhận ảnh JPEG, PNG, GIF, WebP';
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `Ảnh không được vượt quá ${MAX_SIZE_MB} MB`;
  }
  return null; // valid
}
```

### Hiển thị progress upload

```javascript
const { data } = await axios.post('/api/v1/upload/images', formData, {
  onUploadProgress: (progressEvent) => {
    const percent = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    setUploadProgress(percent);
  }
});
```

---

## Cấu hình RustFS (dành cho DevOps / Backend)

### Biến môi trường

```env
# Endpoint nội bộ server dùng để upload/delete
RUSTFS_ENDPOINT=http://<VPS_IP>:9008

# Credentials — lấy từ RustFS console (port 9009)
RUSTFS_ACCESS_KEY=<access_key>
RUSTFS_SECRET_KEY=<secret_key>

# Tên bucket (phải tạo trước trong console)
RUSTFS_BUCKET=oplearn

# Region (dùng mặc định với RustFS)
RUSTFS_REGION=us-east-1

# URL mà browser/app dùng để xem ảnh
# Nếu có domain public thì dùng domain, không thì dùng IP:port
RUSTFS_PUBLIC_URL=http://<VPS_IP>:9008
```

### Tạo bucket trong RustFS console

1. Mở `http://<VPS_IP>:9009` trong trình duyệt
2. Đăng nhập bằng access key / secret key
3. Tạo bucket tên `oplearn`
4. Set policy bucket là **Public** (để ảnh truy cập không cần auth)
