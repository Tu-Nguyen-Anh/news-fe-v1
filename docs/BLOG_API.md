# Blog Post API Documentation

Base URL: `/api/v1/posts`

All responses follow the standard `ResponseGeneral` wrapper:
```json
{
  "message": "success",
  "data": { ... }
}
```

All request/response JSON fields use **snake_case** naming.

---

## Authentication

Most write endpoints require a JWT Bearer token in the `Authorization` header.
Read endpoints (filter, getDetail, getComments, getReplies, getUserProfile) are accessible without authentication but may include personalized data (e.g. `liked` field) when authenticated.

---

## Common Headers

| Header | Required | Default | Description |
|--------|----------|---------|-------------|
| `Authorization` | Conditional | - | `Bearer <token>` for authenticated endpoints |
| `language` | No | `en` | Response message language |

---

## Endpoints

### 1. Create Post

**POST** `/api/v1/posts`

Requires authentication.

**Request Body:**
```json
{
  "title": "My First Blog Post",
  "content": "This is the content of the post.",
  "image_url": "https://example.com/image.jpg",
  "visibility": 0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Post title (not blank) |
| `content` | string | Yes | Post body content (not blank) |
| `image_url` | string | No | URL to the post cover image |
| `visibility` | integer | Yes | `0` = PUBLIC, `1` = PRIVATE |

**Response:** `201 Created`
```json
{
  "message": "success",
  "data": {
    "id": 1,
    "user_id": 42,
    "author_name": null,
    "author_avatar": null,
    "title": "My First Blog Post",
    "content": "This is the content of the post.",
    "image_url": "https://example.com/image.jpg",
    "visibility": 0,
    "created_at": 1711411200000,
    "like_count": 0,
    "comment_count": 0,
    "share_count": 0,
    "liked": false
  }
}
```

---

### 2. Update Post

**PUT** `/api/v1/posts/{id}`

Requires authentication. Only the post owner can update.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | Long | Post ID |

**Request Body:** Same as Create Post.

**Response:** `200 OK` — Updated `BlogPostFilterResponse`.

**Errors:**
- `403 Forbidden` — Not the post owner.
- `404 Not Found` — Post does not exist or is deleted.

---

### 3. Delete Post

**DELETE** `/api/v1/posts/{id}`

Requires authentication. Only the post owner can delete (soft delete).

**Response:** `200 OK`
```json
{ "message": "success", "data": null }
```

---

### 4. Get Post Detail

**GET** `/api/v1/posts/{id}`

Authentication optional (affects `liked` field).

**Response:** `200 OK` — `BlogPostFilterResponse` with counts populated.

---

### 5. Filter Posts

**POST** `/api/v1/posts/filter`

Searches PUBLIC posts only.

**Request Body:**
```json
{
  "page": 0,
  "size": 10,
  "keyword": "spring boot",
  "author_id": 42
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | integer | No | Page number (default: 0) |
| `size` | integer | No | Page size (default: 10) |
| `keyword` | string | No | Search in title and content |
| `author_id` | Long | No | Filter by author user ID |

**Response:** `200 OK`
```json
{
  "message": "success",
  "data": {
    "content": [ { ...BlogPostFilterResponse... } ],
    "amount": 25
  }
}
```

---

### 6. Like Post

**POST** `/api/v1/posts/{id}/like`

Requires authentication.

**Response:** `201 Created`

**Errors:**
- `409 Conflict` — Already liked.
- `404 Not Found` — Post not found.

---

### 7. Unlike Post

**DELETE** `/api/v1/posts/{id}/like`

Requires authentication.

**Response:** `200 OK`

**Errors:**
- `404 Not Found` — Like record not found.

---

### 8. Share Post

**POST** `/api/v1/posts/{id}/share`

Requires authentication.

**Request Body (optional):**
```json
{
  "content": "Check out this amazing post!"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | No | Optional caption when sharing |

**Response:** `201 Created`

---

### 9. Add Comment

**POST** `/api/v1/posts/{postId}/comments`

Requires authentication. Supports nested replies via `parent_comment_id`.

**Request Body:**
```json
{
  "content": "Great post!",
  "parent_comment_id": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Comment text (not blank) |
| `parent_comment_id` | Long | No | ID of parent comment for replies; omit for top-level |

**Response:** `201 Created`
```json
{
  "message": "success",
  "data": {
    "id": 10,
    "post_id": 1,
    "user_id": 42,
    "author_name": null,
    "author_avatar": null,
    "parent_comment_id": null,
    "content": "Great post!",
    "created_at": 1711411300000
  }
}
```

---

### 10. Delete Comment

**DELETE** `/api/v1/posts/{postId}/comments/{commentId}`

Requires authentication. Only the comment owner can delete (soft delete).

**Response:** `200 OK`

---

### 11. Get Comments (Top-Level)

**GET** `/api/v1/posts/{postId}/comments?page=0&size=10`

Returns only top-level comments (no parent). Use the Replies endpoint to fetch nested replies.

**Query Parameters:**
| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | 0 | Page number |
| `size` | 10 | Page size |

**Response:** `200 OK` — `PageResponse<BlogPostCommentResponse>`

---

### 12. Get Comment Replies

**GET** `/api/v1/posts/{postId}/comments/{commentId}/replies?page=0&size=10`

Returns replies to a specific comment.

**Response:** `200 OK` — `PageResponse<BlogPostCommentResponse>`

---

### 13. Get User Profile

**GET** `/api/v1/posts/profile/{userId}?page=0&size=10`

Returns user information along with their paginated posts (includes PRIVATE posts for own profile viewing).

**Query Parameters:**
| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | 0 | Page number for posts |
| `size` | 10 | Page size for posts |

**Response:** `200 OK`
```json
{
  "message": "success",
  "data": {
    "id": 42,
    "username": "johndoe",
    "full_name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "email": "john@example.com",
    "total_posts": 15,
    "posts": {
      "content": [ { ...BlogPostFilterResponse... } ],
      "amount": 15
    }
  }
}
```

---

## Response Models

### BlogPostFilterResponse

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Post ID |
| `user_id` | Long | Author's user ID |
| `author_name` | string | Author's full name |
| `author_avatar` | string | Author's avatar URL |
| `title` | string | Post title |
| `content` | string | Post content |
| `image_url` | string | Cover image URL (nullable) |
| `visibility` | integer | `0` = PUBLIC, `1` = PRIVATE |
| `created_at` | Long | Unix timestamp (ms) of creation |
| `like_count` | Long | Total likes |
| `comment_count` | Long | Total non-deleted comments |
| `share_count` | Long | Total shares |
| `liked` | boolean | Whether the current user has liked the post (`false` when unauthenticated) |

### BlogPostCommentResponse

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Comment ID |
| `post_id` | Long | Parent post ID |
| `user_id` | Long | Commenter's user ID |
| `author_name` | string | Commenter's full name |
| `author_avatar` | string | Commenter's avatar URL |
| `parent_comment_id` | Long | Parent comment ID (null for top-level) |
| `content` | string | Comment text |
| `created_at` | Long | Unix timestamp (ms) of creation |

### UserProfileResponse

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | User ID |
| `username` | string | Username |
| `full_name` | string | Full display name |
| `avatar` | string | Avatar URL |
| `email` | string | Email address |
| `total_posts` | Long | Total number of non-deleted posts |
| `posts` | PageResponse | Paginated list of posts |

### PageResponse

| Field | Type | Description |
|-------|------|-------------|
| `content` | array | List of items |
| `amount` | integer | Total count of all matching records (not just current page) |

---

## Error Responses

All errors follow the standard error format:

```json
{
  "status": 404,
  "message": "Not Found",
  "errors": { ... }
}
```

| HTTP Status | When |
|-------------|------|
| `400 Bad Request` | Validation failed (missing required fields) |
| `401 Unauthorized` | Missing or invalid JWT token |
| `403 Forbidden` | Authenticated but not allowed (e.g. editing another user's post) |
| `404 Not Found` | Resource does not exist or is soft-deleted |
| `409 Conflict` | Duplicate action (e.g. liking an already liked post) |

---

## Frontend Integration Notes

### Pagination
Use `amount` from `PageResponse` to calculate total pages: `Math.ceil(amount / size)`.

### Visibility
- `0` = PUBLIC: visible to everyone in filter results
- `1` = PRIVATE: only visible to the owner (returned in `getUserProfile` regardless)

### Like Button State
Use the `liked` field in `BlogPostFilterResponse` to initialize the like button state. This field is `false` when the request is unauthenticated.

### Threaded Comments
- Fetch top-level comments with `GET /{postId}/comments`
- On demand, load replies for a comment using `GET /{postId}/comments/{commentId}/replies`
- To post a reply, include `parent_comment_id` in the comment request body

### Share Feature
Sharing records the share event. Optionally pass a `content` caption. There is no uniqueness constraint — a user can share the same post multiple times.

### Timestamps
All `created_at` / `last_updated_at` fields are Unix epoch milliseconds (Long). Convert using `new Date(timestamp)` in JavaScript.
