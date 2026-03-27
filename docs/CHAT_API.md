# Chat Group API Documentation

Base URL: `/api/v1/chat`

All responses follow the standard `ResponseGeneral` wrapper:
```json
{
  "status": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-03-27T10:30:00"
}
```

All request/response JSON fields use **snake_case** naming.

---

## Authentication

All endpoints require a JWT Bearer token in the `Authorization` header.

```
Authorization: Bearer <access_token>
```

---

## Common Headers

| Header | Required | Default | Description |
|--------|----------|---------|-------------|
| `Authorization` | Yes | - | `Bearer <access_token>` |
| `Accept-Language` | No | `en` | Response message language (`en` or `vi`) |
| `Content-Type` | Yes (POST/PUT) | - | `application/json` |

---

## Common Error Responses

| HTTP Status | Error Code | Message (EN) | Message (VI) |
|-------------|------------|--------------|--------------|
| 404 | `org.oplearn.project.exception.base.chat.ChatGroupNotFoundException` | Chat group not found | Nhóm chat không tồn tại |
| 400 | `org.oplearn.project.exception.base.chat.NotGroupMemberException` | You are not a member of this group | Bạn không phải thành viên của nhóm này |
| 400 | `org.oplearn.project.exception.base.chat.NotGroupAdminException` | You do not have admin permission for this group | Bạn không có quyền admin trong nhóm này |
| 409 | `org.oplearn.project.exception.base.chat.MemberAlreadyExistsException` | User is already a member of this group | Người dùng đã là thành viên của nhóm này |
| 404 | `org.oplearn.project.exception.base.chat.ChatMessageNotFoundException` | Message not found | Tin nhắn không tồn tại |
| 409 | `org.oplearn.project.exception.base.chat.ReactionAlreadyExistsException` | You have already reacted with this emoji | Bạn đã thả cảm xúc này rồi |
| 404 | `org.oplearn.project.exception.base.chat.ReactionNotFoundException` | Reaction not found | Cảm xúc không tồn tại |
| 401 | - | Unauthorized | - |

---

## History Action Types

Events recorded in group activity log:

| `action` value | Trigger | Message format (VI) |
|----------------|---------|---------------------|
| `CREATE_GROUP` | Group is created | `"{actor}" đã tạo nhóm "{groupName}"` |
| `RENAME_GROUP` | Group name changed | `"{actor}" đã đổi tên nhóm từ "{oldName}" thành "{newName}"` |
| `ADD_MEMBER` | Member added | `"{actor}" đã thêm "{targetUser}" vào nhóm` |
| `REMOVE_MEMBER` | Member removed | `"{actor}" đã xóa "{targetUser}" khỏi nhóm` |

**Error response body:**
```json
{
  "status": 400,
  "message": "You are not a member of this group",
  "data": null,
  "timestamp": "2026-03-27T10:30:00"
}
```

---

## Data Models

### GroupResponse
```json
{
  "id": 1,
  "name": "Nhóm học tập",
  "avatar": "https://example.com/avatar.png",
  "member_count": 5,
  "my_role": "ADMIN",
  "created_at": 1743043200000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | long | Group ID |
| `name` | string | Group name |
| `avatar` | string \| null | Group avatar URL |
| `member_count` | int | Total active member count |
| `my_role` | string | Current user's role: `ADMIN` or `MEMBER` |
| `created_at` | long | Unix timestamp in milliseconds |

---

### ReaderResponse
```json
{
  "user_id": 5,
  "username": "john_doe",
  "full_name": "John Doe",
  "avatar": "https://example.com/user.png",
  "read_at": 1743043500000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | long | User ID |
| `username` | string | Username |
| `full_name` | string | Full name |
| `avatar` | string \| null | Avatar URL |
| `read_at` | long | Unix timestamp (ms) when user read the message |

---

### ReactionResponse
```json
{
  "emoji": "👍",
  "count": 3,
  "reacted_by_me": true,
  "reactors": [
    {
      "user_id": 3,
      "username": "john",
      "full_name": "John Doe",
      "avatar": "https://example.com/user.png"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `emoji` | string | The emoji character (e.g. `👍`, `❤️`, `😂`) |
| `count` | int | Total users who reacted with this emoji |
| `reacted_by_me` | boolean | Whether the current user reacted with this emoji |
| `reactors` | array | List of users who reacted |

---

### PresenceEvent *(WebSocket — received from `/topic/chat/{groupId}/presence`)*
```json
{
  "user_id": 5,
  "username": "john_doe",
  "full_name": "John Doe",
  "avatar": "https://example.com/user.png",
  "online": true,
  "timestamp": 1743043200000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | long | User ID |
| `online` | boolean | `true` = came online, `false` = went offline |
| `timestamp` | long | Unix timestamp (ms) of the event |

---

### ReadReceiptEvent *(WebSocket — received from `/topic/chat/{groupId}/read`)*
```json
{
  "user_id": 5,
  "username": "john_doe",
  "full_name": "John Doe",
  "avatar": "https://example.com/user.png",
  "last_read_message_id": 105,
  "read_at": 1743043800000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | long | Who read the messages |
| `last_read_message_id` | long | ID of the most recent message they read |
| `read_at` | long | Unix timestamp (ms) |

> **Frontend usage:** When this event arrives, mark all messages with `id <= last_read_message_id` as read by `user_id`.

---

### ReactionEvent *(WebSocket — received from `/topic/chat/{groupId}/reaction`)*
```json
{
  "type": "ADD",
  "message_id": 101,
  "user_id": 5,
  "username": "john_doe",
  "avatar": "https://example.com/user.png",
  "emoji": "👍",
  "reactions": [
    {
      "emoji": "👍",
      "count": 2,
      "reacted_by_me": false,
      "reactors": [...]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | `ADD` or `REMOVE` |
| `message_id` | long | Message that was reacted to |
| `emoji` | string | Emoji used |
| `reactions` | array | Updated full reactions list for this message |

> **Frontend usage:** Find message by `message_id` and replace its `reactions` array with `reactions` from this event.

---

### ChatGroupHistoryResponse
```json
{
  "id": 5,
  "group_id": 1,
  "action": "ADD_MEMBER",
  "message": "Admin User đã thêm John Doe vào nhóm",
  "created_at": 1743043200000,
  "created_by": "admin",
  "actor_full_name": "Admin User"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | long | History record ID |
| `group_id` | long | Group ID |
| `action` | string | `CREATE_GROUP` \| `RENAME_GROUP` \| `ADD_MEMBER` \| `REMOVE_MEMBER` |
| `message` | string | Human-readable description of the event |
| `created_at` | long | Unix timestamp in milliseconds |
| `created_by` | string | Username of the actor |
| `actor_full_name` | string | Full name of the actor (null if user deleted) |

---

### GroupDetailResponse
```json
{
  "id": 1,
  "name": "Nhóm học tập",
  "avatar": "https://example.com/avatar.png",
  "my_role": "ADMIN",
  "created_at": 1743043200000,
  "members": [
    {
      "member_id": 10,
      "user_id": 3,
      "username": "admin",
      "full_name": "Admin User",
      "avatar": "https://example.com/user.png",
      "role": "ADMIN"
    },
    {
      "member_id": 11,
      "user_id": 5,
      "username": "john_doe",
      "full_name": "John Doe",
      "avatar": null,
      "role": "MEMBER"
    }
  ]
}
```

---

### GroupMemberResponse
```json
{
  "member_id": 10,
  "user_id": 3,
  "username": "john_doe",
  "full_name": "John Doe",
  "avatar": "https://example.com/user.png",
  "role": "MEMBER"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `member_id` | long | Record ID in `chat_group_members` table |
| `user_id` | long | User ID |
| `username` | string | Username |
| `full_name` | string | Full name |
| `avatar` | string \| null | Avatar URL |
| `role` | string | `ADMIN` or `MEMBER` |
| `online` | boolean \| null | `true` = online, `false` = offline (included in group detail and presence endpoints) |

---

### ChatMessageResponse
```json
{
  "id": 101,
  "group_id": 1,
  "sender_id": 3,
  "sender_username": "john_doe",
  "sender_full_name": "John Doe",
  "sender_avatar": "https://example.com/user.png",
  "content": "Xin chào mọi người!",
  "message_type": "TEXT",
  "created_at": 1743043200000,
  "readers": [
    {
      "user_id": 5,
      "username": "jane",
      "full_name": "Jane Smith",
      "avatar": null,
      "read_at": 1743043500000
    }
  ],
  "reactions": [
    {
      "emoji": "👍",
      "count": 2,
      "reacted_by_me": true,
      "reactors": [
        { "user_id": 3, "username": "john", "full_name": "John Doe", "avatar": "..." }
      ]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | long | Message ID |
| `group_id` | long | Group ID this message belongs to |
| `sender_id` | long | User ID of sender |
| `sender_username` | string | Username of sender |
| `sender_full_name` | string | Full name of sender |
| `sender_avatar` | string \| null | Avatar URL of sender |
| `content` | string | Message content |
| `message_type` | string | `TEXT` or `IMAGE` |
| `created_at` | long | Unix timestamp in milliseconds |
| `readers` | array \| null | Who has read this message (only populated on REST history, omitted on WebSocket new message) |
| `reactions` | array \| null | Reactions grouped by emoji (only populated on REST history, omitted on WebSocket new message) |

---

## REST API Endpoints

---

### 1. Create Group

**POST** `/api/v1/chat/groups`

Creates a new private group chat. The authenticated user automatically becomes an **ADMIN** of the group.

**Request Body:**
```json
{
  "name": "Nhóm học tập",
  "avatar": "https://example.com/avatar.png",
  "member_ids": [5, 7, 12]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Group name (not blank) |
| `avatar` | string | No | Group avatar URL |
| `member_ids` | array\<long\> | Yes | List of user IDs to add (not empty). Creator ID can be included or omitted — will not cause duplicate. |

**Response:** `201 Created`
```json
{
  "status": 201,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Nhóm học tập",
    "avatar": "https://example.com/avatar.png",
    "member_count": 4,
    "my_role": "ADMIN",
    "created_at": 1743043200000
  },
  "timestamp": "2026-03-27T10:30:00"
}
```

---

> **History recorded:** `CREATE_GROUP` — `"{actor}" đã tạo nhóm "{groupName}"`

---

### 2. Get My Groups

**GET** `/api/v1/chat/groups`

Returns all groups the authenticated user is a member of, sorted by creation time descending.

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Nhóm học tập",
      "avatar": "https://example.com/avatar.png",
      "member_count": 4,
      "my_role": "ADMIN",
      "created_at": 1743043200000
    },
    {
      "id": 2,
      "name": "Nhóm dự án",
      "avatar": null,
      "member_count": 7,
      "my_role": "MEMBER",
      "created_at": 1743000000000
    }
  ],
  "timestamp": "2026-03-27T10:30:00"
}
```

---

### 3. Get Group Detail

**GET** `/api/v1/chat/groups/{groupId}`

Returns full group info including all active members. Only group members can access.

**Path Variable:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Nhóm học tập",
    "avatar": "https://example.com/avatar.png",
    "my_role": "ADMIN",
    "created_at": 1743043200000,
    "members": [
      {
        "member_id": 10,
        "user_id": 3,
        "username": "admin",
        "full_name": "Admin User",
        "avatar": "https://example.com/user.png",
        "role": "ADMIN"
      },
      {
        "member_id": 11,
        "user_id": 5,
        "username": "john_doe",
        "full_name": "John Doe",
        "avatar": null,
        "role": "MEMBER"
      }
    ]
  },
  "timestamp": "2026-03-27T10:30:00"
}
```

---

### 4. Rename Group

**PUT** `/api/v1/chat/groups/{groupId}/name`

Changes the group name. **Admin only.**

**Path Variable:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |

**Request Body:**
```json
{
  "name": "Tên nhóm mới"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | New group name (not blank) |

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Tên nhóm mới",
    "avatar": "https://example.com/avatar.png",
    "member_count": 4,
    "my_role": "ADMIN",
    "created_at": 1743043200000
  },
  "timestamp": "2026-03-27T10:30:00"
}
```

> **History recorded:** `RENAME_GROUP` — `"{actor}" đã đổi tên nhóm từ "{oldName}" thành "{newName}"`

---

### 5. Add Member

**POST** `/api/v1/chat/groups/{groupId}/members`

Adds a user to the group. **Admin only.**

**Path Variable:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |

**Request Body:**
```json
{
  "user_id": 8
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | long | Yes | ID of user to add |

**Response:** `201 Created`
```json
{
  "status": 201,
  "message": "Success",
  "data": {
    "member_id": 15,
    "user_id": 8,
    "username": "new_user",
    "full_name": "New User",
    "avatar": null,
    "role": "MEMBER"
  },
  "timestamp": "2026-03-27T10:30:00"
}
```

> **History recorded:** `ADD_MEMBER` — `"{actor}" đã thêm "{newUser}" vào nhóm`

---

### 6. Remove Member

**DELETE** `/api/v1/chat/groups/{groupId}/members/{userId}`

Removes a user from the group. **Admin only.**

**Path Variables:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |
| `userId` | long | User ID to remove |

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "Success",
  "data": null,
  "timestamp": "2026-03-27T10:30:00"
}
```

> **History recorded:** `REMOVE_MEMBER` — `"{actor}" đã xóa "{removedUser}" khỏi nhóm`

---

### 7. Make Admin

**PUT** `/api/v1/chat/groups/{groupId}/members/{userId}/admin`

Promotes a member to admin role. **Admin only.**

**Path Variables:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |
| `userId` | long | User ID to promote |

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "Success",
  "data": null,
  "timestamp": "2026-03-27T10:30:00"
}
```

---

### 8. Delete Group

**DELETE** `/api/v1/chat/groups/{groupId}`

Soft-deletes the group. **Admin only.**

**Path Variable:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "Success",
  "data": null,
  "timestamp": "2026-03-27T10:30:00"
}
```

---

### 9. Get Message History

**GET** `/api/v1/chat/groups/{groupId}/messages`

Returns paginated message history for a group, sorted by newest first. Only group members can access.

**Path Variable:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | `0` | Page index (0-based) |
| `size` | int | `10` | Page size |

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": 105,
        "group_id": 1,
        "sender_id": 3,
        "sender_username": "admin",
        "sender_full_name": "Admin User",
        "sender_avatar": "https://example.com/user.png",
        "content": "Xin chào mọi người!",
        "message_type": "TEXT",
        "created_at": 1743043800000
      },
      {
        "id": 104,
        "group_id": 1,
        "sender_id": 5,
        "sender_username": "john_doe",
        "sender_full_name": "John Doe",
        "sender_avatar": null,
        "content": "Hello!",
        "message_type": "TEXT",
        "created_at": 1743043500000
      }
    ],
    "amount": 87
  },
  "timestamp": "2026-03-27T10:30:00"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `content` | array | List of messages on this page (newest first) |
| `amount` | int | Total number of messages in this group |

> **Note for frontend:** Since messages are returned newest-first, reverse the `content` array before rendering to display oldest at top, newest at bottom (standard chat UI). Load older messages by incrementing `page`.

---

### 10. Get Group Activity History

**GET** `/api/v1/chat/groups/{groupId}/history`

Returns paginated activity log for a group (create, rename, add/remove member events), sorted by newest first. Only group members can access.

**Path Variable:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | `0` | Page index (0-based) |
| `size` | int | `10` | Page size |

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": 4,
        "group_id": 1,
        "action": "REMOVE_MEMBER",
        "message": "Admin User đã xóa John Doe khỏi nhóm",
        "created_at": 1743044000000,
        "created_by": "admin",
        "actor_full_name": "Admin User"
      },
      {
        "id": 3,
        "group_id": 1,
        "action": "ADD_MEMBER",
        "message": "Admin User đã thêm John Doe vào nhóm",
        "created_at": 1743043800000,
        "created_by": "admin",
        "actor_full_name": "Admin User"
      },
      {
        "id": 2,
        "group_id": 1,
        "action": "RENAME_GROUP",
        "message": "Admin User đã đổi tên nhóm từ \"Nhóm cũ\" thành \"Nhóm học tập\"",
        "created_at": 1743043500000,
        "created_by": "admin",
        "actor_full_name": "Admin User"
      },
      {
        "id": 1,
        "group_id": 1,
        "action": "CREATE_GROUP",
        "message": "Admin User đã tạo nhóm \"Nhóm học tập\"",
        "created_at": 1743043200000,
        "created_by": "admin",
        "actor_full_name": "Admin User"
      }
    ],
    "amount": 4
  },
  "timestamp": "2026-03-27T10:30:00"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `content` | array | List of history records (newest first) |
| `amount` | int | Total number of history records for this group |

---

### 11. Mark Messages as Read

**POST** `/api/v1/chat/groups/{groupId}/messages/read`

Marks all messages in the group as read for the current user. Broadcasts a `ReadReceiptEvent` via WebSocket to `/topic/chat/{groupId}/read`.

**Path Variable:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "Success",
  "data": null,
  "timestamp": "2026-03-27T10:30:00"
}
```

> **WebSocket broadcast:** After calling this endpoint, a `ReadReceiptEvent` is sent to all subscribers of `/topic/chat/{groupId}/read`.

---

### 12. Get Message Readers

**GET** `/api/v1/chat/groups/{groupId}/messages/{messageId}/reads`

Returns the list of users who have read a specific message. Only group members can access.

**Path Variables:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |
| `messageId` | long | Message ID |

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "user_id": 5,
      "username": "jane_doe",
      "full_name": "Jane Doe",
      "avatar": null,
      "read_at": 1743043500000
    },
    {
      "user_id": 7,
      "username": "bob",
      "full_name": "Bob Smith",
      "avatar": "https://example.com/bob.png",
      "read_at": 1743043600000
    }
  ],
  "timestamp": "2026-03-27T10:30:00"
}
```

---

### 13. Add Reaction

**POST** `/api/v1/chat/groups/{groupId}/messages/{messageId}/reactions`

Adds an emoji reaction to a message. Broadcasts a `ReactionEvent` via WebSocket to `/topic/chat/{groupId}/reaction`.

**Path Variables:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |
| `messageId` | long | Message ID |

**Request Body:**
```json
{
  "emoji": "👍"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `emoji` | string | Yes | Any emoji character (e.g. `👍`, `❤️`, `😂`, `😮`, `😢`, `🔥`) |

**Response:** `201 Created` — returns the updated reactions list for this message
```json
{
  "status": 201,
  "message": "Success",
  "data": [
    {
      "emoji": "👍",
      "count": 2,
      "reacted_by_me": true,
      "reactors": [
        { "user_id": 3, "username": "admin", "full_name": "Admin User", "avatar": "..." },
        { "user_id": 5, "username": "jane", "full_name": "Jane Doe", "avatar": null }
      ]
    },
    {
      "emoji": "❤️",
      "count": 1,
      "reacted_by_me": false,
      "reactors": [
        { "user_id": 7, "username": "bob", "full_name": "Bob Smith", "avatar": null }
      ]
    }
  ],
  "timestamp": "2026-03-27T10:30:00"
}
```

> **WebSocket broadcast:** A `ReactionEvent` with `type: "ADD"` is sent to `/topic/chat/{groupId}/reaction`.

---

### 14. Remove Reaction

**DELETE** `/api/v1/chat/groups/{groupId}/messages/{messageId}/reactions/{emoji}`

Removes the current user's emoji reaction from a message. Broadcasts a `ReactionEvent` via WebSocket.

**Path Variables:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |
| `messageId` | long | Message ID |
| `emoji` | string | The emoji to remove (URL-encoded if needed, e.g. `%F0%9F%91%8D` for 👍) |

**Response:** `200 OK` — returns the updated reactions list
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "emoji": "❤️",
      "count": 1,
      "reacted_by_me": false,
      "reactors": [...]
    }
  ],
  "timestamp": "2026-03-27T10:30:00"
}
```

> **WebSocket broadcast:** A `ReactionEvent` with `type: "REMOVE"` is sent to `/topic/chat/{groupId}/reaction`.

---

### 15. Get Online Members (Presence)

**GET** `/api/v1/chat/groups/{groupId}/presence`

Returns all group members with their current online status. Only group members can access.

**Path Variable:**
| Param | Type | Description |
|-------|------|-------------|
| `groupId` | long | Group ID |

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "member_id": 10,
      "user_id": 3,
      "username": "admin",
      "full_name": "Admin User",
      "avatar": "https://example.com/user.png",
      "role": "ADMIN",
      "online": true
    },
    {
      "member_id": 11,
      "user_id": 5,
      "username": "john_doe",
      "full_name": "John Doe",
      "avatar": null,
      "role": "MEMBER",
      "online": false
    }
  ],
  "timestamp": "2026-03-27T10:30:00"
}
```

> **Note:** This is a REST snapshot. For live updates, subscribe to `/topic/chat/{groupId}/presence` via WebSocket.

---

## WebSocket Real-time Messaging

Real-time messaging uses **STOMP over WebSocket** (with SockJS fallback).

### Connection

**Endpoint:** `http://host:8188/ws`
**SockJS URL:** `http://host:8188/ws` (SockJS handles protocol negotiation automatically)

#### Dependencies (Frontend)
```bash
npm install sockjs-client @stomp/stompjs
# or
npm install sockjs-client stompjs
```

---

### Authentication

Pass the JWT token in the **STOMP CONNECT frame** header. The server validates the token and sets up the user session.

```js
const connectHeaders = {
  Authorization: `Bearer ${accessToken}`
};
```

---

### Full Integration Example (JavaScript)

```javascript
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const BASE_URL = 'http://localhost:8188';

let stompClient = null;

function connect(accessToken, groupId, onMessage) {
  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),

    // Send JWT in STOMP CONNECT frame
    connectHeaders: {
      Authorization: `Bearer ${accessToken}`
    },

    onConnect: () => {
      console.log('WebSocket connected');

      // New messages
      stompClient.subscribe(`/topic/chat/${groupId}`, (frame) => {
        const message = JSON.parse(frame.body);
        onMessage(message);
      });

      // Read receipts
      stompClient.subscribe(`/topic/chat/${groupId}/read`, (frame) => {
        const receipt = JSON.parse(frame.body);
        onReadReceipt(receipt); // { user_id, last_read_message_id, read_at, ... }
      });

      // Presence (online/offline)
      stompClient.subscribe(`/topic/chat/${groupId}/presence`, (frame) => {
        const presence = JSON.parse(frame.body);
        onPresence(presence); // { user_id, online, ... }
      });

      // Reactions
      stompClient.subscribe(`/topic/chat/${groupId}/reaction`, (frame) => {
        const event = JSON.parse(frame.body);
        onReaction(event); // { type: 'ADD'|'REMOVE', message_id, emoji, reactions }
      });
    },

    onDisconnect: () => {
      console.log('WebSocket disconnected');
    },

    onStompError: (frame) => {
      console.error('STOMP error:', frame);
    },

    reconnectDelay: 5000,  // Auto-reconnect after 5 seconds
  });

  stompClient.activate();
}

function sendMessage(groupId, content, messageType = 'TEXT') {
  if (!stompClient || !stompClient.connected) {
    console.error('Not connected');
    return;
  }

  stompClient.publish({
    destination: `/app/chat/${groupId}`,
    body: JSON.stringify({
      content: content,
      message_type: messageType
    })
  });
}

function disconnect() {
  if (stompClient) {
    stompClient.deactivate();
  }
}

export { connect, sendMessage, disconnect };
```

---

### React Hook Example

```jsx
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const BASE_URL = 'http://localhost:8188';

export function useGroupChat(groupId, accessToken) {
  const [messages, setMessages] = useState([]);
  const stompClientRef = useRef(null);

  useEffect(() => {
    if (!groupId || !accessToken) return;

    // Load message history via REST first
    fetchMessageHistory(groupId, accessToken).then((history) => {
      // History is newest-first → reverse to show oldest at top
      setMessages([...history].reverse());
    });

    // Connect WebSocket for real-time
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`
      },
      onConnect: () => {
        client.subscribe(`/topic/chat/${groupId}`, (frame) => {
          const newMessage = JSON.parse(frame.body);
          setMessages((prev) => [...prev, newMessage]);
        });
      },
      reconnectDelay: 5000,
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [groupId, accessToken]);

  function sendMessage(content) {
    const client = stompClientRef.current;
    if (!client?.connected) return;

    client.publish({
      destination: `/app/chat/${groupId}`,
      body: JSON.stringify({
        content,
        message_type: 'TEXT'
      })
    });
  }

  return { messages, sendMessage };
}

async function fetchMessageHistory(groupId, accessToken) {
  const res = await fetch(
    `${BASE_URL}/api/v1/chat/groups/${groupId}/messages?page=0&size=50`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  const json = await res.json();
  return json.data.content; // newest-first from API
}
```

---

### STOMP Message Destinations Summary

| Direction | Destination | Payload Type | Description |
|-----------|-------------|--------------|-------------|
| Client → Server | `/app/chat/{groupId}` | `SendMessageRequest` | Send a new message |
| Server → Client | `/topic/chat/{groupId}` | `ChatMessageResponse` | New message broadcast |
| Server → Client | `/topic/chat/{groupId}/read` | `ReadReceiptEvent` | Someone read all messages |
| Server → Client | `/topic/chat/{groupId}/presence` | `PresenceEvent` | User came online/offline |
| Server → Client | `/topic/chat/{groupId}/reaction` | `ReactionEvent` | Reaction added/removed |

---

### Send Message Payload (Client → Server)

Sent to `/app/chat/{groupId}`:
```json
{
  "content": "Xin chào mọi người!",
  "message_type": "TEXT"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Message content (not blank) |
| `message_type` | string | No | `TEXT` (default) or `IMAGE` |

---

### Received Message Payload (Server → Client)

Received from `/topic/chat/{groupId}`:
```json
{
  "id": 101,
  "group_id": 1,
  "sender_id": 3,
  "sender_username": "john_doe",
  "sender_full_name": "John Doe",
  "sender_avatar": "https://example.com/user.png",
  "content": "Xin chào mọi người!",
  "message_type": "TEXT",
  "created_at": 1743043200000
}
```

> **Note:** All members of a group (including the sender) receive this message via `/topic/chat/{groupId}`. The frontend should use `sender_id` to distinguish which messages were sent by the current user.

---

## Frontend Implementation Guide

### Recommended Chat Page Flow

```
1. Call GET /api/v1/chat/groups → show group list in sidebar

2. User selects a group:
   a. Call GET /api/v1/chat/groups/{groupId} → display group info & member list (includes online field)
   b. Call GET /api/v1/chat/groups/{groupId}/messages?page=0&size=50 → load messages (includes readers & reactions)
   c. Connect WebSocket & subscribe to 4 topics:
      - /topic/chat/{groupId}           → new messages
      - /topic/chat/{groupId}/read      → read receipts
      - /topic/chat/{groupId}/presence  → online/offline events
      - /topic/chat/{groupId}/reaction  → emoji reactions
   d. Call POST /api/v1/chat/groups/{groupId}/messages/read → mark all as read (triggers ReadReceiptEvent)

3. User sends a message:
   → Publish to /app/chat/{groupId} via WebSocket STOMP
   → All members receive via /topic/chat/{groupId}

4. User reads messages (enters the chat):
   → Call POST /api/v1/chat/groups/{groupId}/messages/read
   → All members receive ReadReceiptEvent via /topic/chat/{groupId}/read
   → Update read indicators on messages with id <= last_read_message_id

5. User reacts to a message:
   → Call POST /api/v1/chat/groups/{groupId}/messages/{messageId}/reactions with { emoji: "👍" }
   → All members receive ReactionEvent via /topic/chat/{groupId}/reaction
   → Replace reactions array on the matching message

6. User removes a reaction:
   → Call DELETE /api/v1/chat/groups/{groupId}/messages/{messageId}/reactions/👍
   → All members receive ReactionEvent via /topic/chat/{groupId}/reaction

7. Someone comes online/goes offline:
   → All group members receive PresenceEvent via /topic/chat/{groupId}/presence
   → Update online indicator for that user_id in the member list

8. Load older messages (infinite scroll):
   → Call GET /api/v1/chat/groups/{groupId}/messages?page=1&size=50
   → Prepend to message list (note: responses include readers & reactions)

9. View group activity history:
   → Call GET /api/v1/chat/groups/{groupId}/history?page=0&size=20

10. When user leaves the page:
    → stompClient.deactivate() — server detects disconnect and broadcasts offline PresenceEvent
```

---

### API Summary Table

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| `POST` | `/api/v1/chat/groups` | Create group | Member |
| `GET` | `/api/v1/chat/groups` | My group list | Member |
| `GET` | `/api/v1/chat/groups/{id}` | Group detail + members (with `online` field) | Member |
| `PUT` | `/api/v1/chat/groups/{id}/name` | Rename group | Admin |
| `POST` | `/api/v1/chat/groups/{id}/members` | Add member | Admin |
| `DELETE` | `/api/v1/chat/groups/{id}/members/{userId}` | Remove member | Admin |
| `PUT` | `/api/v1/chat/groups/{id}/members/{userId}/admin` | Make admin | Admin |
| `DELETE` | `/api/v1/chat/groups/{id}` | Delete group | Admin |
| `GET` | `/api/v1/chat/groups/{id}/messages` | Message history with readers & reactions | Member |
| `POST` | `/api/v1/chat/groups/{id}/messages/read` | Mark all messages as read | Member |
| `GET` | `/api/v1/chat/groups/{id}/messages/{msgId}/reads` | Who read a specific message | Member |
| `POST` | `/api/v1/chat/groups/{id}/messages/{msgId}/reactions` | Add emoji reaction | Member |
| `DELETE` | `/api/v1/chat/groups/{id}/messages/{msgId}/reactions/{emoji}` | Remove emoji reaction | Member |
| `GET` | `/api/v1/chat/groups/{id}/presence` | Online/offline status of all members | Member |
| `GET` | `/api/v1/chat/groups/{id}/history` | Activity log (paginated) | Member |

---

### Roles & Permission Matrix

| Action | MEMBER | ADMIN |
|--------|--------|-------|
| View group list | ✅ | ✅ |
| View group detail & members (with online status) | ✅ | ✅ |
| View activity history | ✅ | ✅ |
| Send message (WebSocket) | ✅ | ✅ |
| Send message (REST) | ✅ | ✅ |
| Load message history (with readers & reactions) | ✅ | ✅ |
| Mark messages as read | ✅ | ✅ |
| View who read a message | ✅ | ✅ |
| Add emoji reaction | ✅ | ✅ |
| Remove own reaction | ✅ | ✅ |
| Get online members (presence) | ✅ | ✅ |
| Rename group | ❌ | ✅ |
| Add member | ❌ | ✅ |
| Remove member | ❌ | ✅ |
| Promote member to admin | ❌ | ✅ |
| Delete group | ❌ | ✅ |

---

### Notes for Frontend

- **Timestamps** (`created_at`, `read_at`) are **Unix milliseconds** — use `new Date(timestamp)` in JavaScript.
- **Message ordering**: REST history returns **newest first** → reverse before rendering. WebSocket messages → append to end.
- **Pagination**: `amount` is the **total count**. Pages are 0-indexed.
- **My role**: Check `my_role` in `GroupResponse` / `GroupDetailResponse` for admin-only UI.
- **Identify own messages**: Compare `sender_id` with the current user's ID for bubble alignment.
- **Read receipts**: When `ReadReceiptEvent` arrives, mark all messages where `message.id <= last_read_message_id` as read by that `user_id`.
- **Reactions**: When `ReactionEvent` arrives, find the message by `message_id` and **replace** its entire `reactions` array. Do NOT merge manually.
- **Presence (REST vs WebSocket)**: `GET /presence` gives a snapshot. Live changes arrive via `/topic/chat/{groupId}/presence`. Call REST once on page load, then keep state via WebSocket.
- **Online indicator in group detail**: The `online` field in `GroupMemberResponse` is populated when calling `GET /groups/{id}` or `GET /groups/{id}/presence`. On WebSocket `PresenceEvent`, toggle the indicator for matching `user_id`.
- **Emoji encoding in URL**: When calling `DELETE .../reactions/{emoji}`, URL-encode the emoji. Example: `👍` → `%F0%9F%91%8D`. In JS: `encodeURIComponent('👍')`.
- **WebSocket reconnection**: `reconnectDelay: 5000` — client auto-reconnects. Re-subscribe on `onConnect`.
- **Multi-group**: One STOMP connection, multiple subscriptions for different `groupId`s.
