# Real-time Notification via WebSocket

Tài liệu này hướng dẫn frontend tích hợp thông báo real-time bằng STOMP over SockJS.

---

## Tổng quan luồng hoạt động

```
User B comment và @mention User A
        ↓
Backend lưu Notification vào DB
        ↓
Backend push qua WebSocket → /topic/notifications/{userAId}
        ↓
Frontend (User A) đang subscribe → nhận ngay lập tức
        ↓
Hiển thị toast + tăng badge số thông báo
```

---

## 1. Cài đặt thư viện

### npm
```bash
npm install @stomp/stompjs sockjs-client
```

### Hoặc CDN (HTML thuần)
```html
<script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@stomp/stompjs@7/bundles/stomp.umd.min.js"></script>
```

---

## 2. Kết nối WebSocket

### Endpoint
```
ws://YOUR_SERVER/ws
```
> Khi dùng SockJS, URL dùng `http://` (không phải `ws://`), ví dụ: `http://localhost:8188/ws`

### Xác thực
Gửi JWT Access Token trong STOMP header `Authorization` khi CONNECT.

### Code kết nối (JavaScript / TypeScript)

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BASE_URL = 'http://localhost:8188'; // đổi theo môi trường

let stompClient = null;

function connectWebSocket(accessToken, currentUserId, onNotification) {
  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),

    connectHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },

    reconnectDelay: 5000, // tự reconnect sau 5 giây nếu mất kết nối

    onConnect: () => {
      console.log('WebSocket connected');

      // Subscribe nhận thông báo real-time cho user hiện tại
      stompClient.subscribe(
        `/topic/notifications/${currentUserId}`,
        (frame) => {
          const notification = JSON.parse(frame.body);
          onNotification(notification);
        }
      );
    },

    onStompError: (frame) => {
      console.error('STOMP error:', frame);
    },
  });

  stompClient.activate();
}

function disconnectWebSocket() {
  if (stompClient) {
    stompClient.deactivate();
  }
}
```

**Tham số:**
| Tham số | Ý nghĩa |
|---------|---------|
| `accessToken` | JWT token lấy từ login response |
| `currentUserId` | ID của user đang đăng nhập |
| `onNotification` | Callback nhận object thông báo |

---

## 3. Cấu trúc payload thông báo

Khi backend push thông báo, frontend nhận JSON sau:

```json
{
  "id": 42,
  "sender_user_id": 7,
  "sender_full_name": "Nguyễn Văn A",
  "type": "MENTION_IN_COMMENT",
  "message": "Nguyễn Văn A đã nhắc đến bạn trong một bình luận",
  "article_id": 15,
  "comment_id": 88,
  "is_read": false,
  "created_at": 1711500000000
}
```

**Mô tả các trường:**
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | Long | ID của thông báo |
| `sender_user_id` | Long | ID người gửi (người @mention) |
| `sender_full_name` | String | Tên người gửi |
| `type` | String | Loại thông báo. Hiện tại: `MENTION_IN_COMMENT` |
| `message` | String | Nội dung thông báo (tiếng Việt) |
| `article_id` | Long | ID bài viết liên quan (dùng để navigate) |
| `comment_id` | Long | ID bình luận liên quan (dùng để scroll đến) |
| `is_read` | Boolean | Luôn là `false` khi vừa nhận |
| `created_at` | Long | Timestamp milliseconds (Unix epoch) |

---

## 4. Ví dụ tích hợp hoàn chỉnh (React)

```jsx
// NotificationProvider.jsx
import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BASE_URL = 'http://localhost:8188';

export function useRealtimeNotifications(accessToken, currentUserId) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState(null);
  const clientRef = useRef(null);

  // Lấy unread count ban đầu khi load trang
  useEffect(() => {
    if (!accessToken) return;

    fetch(`${BASE_URL}/api/v1/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.data?.unread_count ?? 0));
  }, [accessToken]);

  // Kết nối WebSocket
  useEffect(() => {
    if (!accessToken || !currentUserId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,

      onConnect: () => {
        client.subscribe(`/topic/notifications/${currentUserId}`, (frame) => {
          const notification = JSON.parse(frame.body);

          // Tăng badge
          setUnreadCount((prev) => prev + 1);

          // Lưu thông báo mới nhất để hiện toast
          setLatestNotification(notification);
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate(); // cleanup khi unmount
  }, [accessToken, currentUserId]);

  return { unreadCount, setUnreadCount, latestNotification };
}
```

```jsx
// App.jsx - Sử dụng hook
import { useRealtimeNotifications } from './NotificationProvider';
import { toast } from 'react-hot-toast'; // hoặc bất kỳ toast library nào

function App() {
  const { accessToken, user } = useAuth(); // hook auth của bạn
  const { unreadCount, setUnreadCount, latestNotification } =
    useRealtimeNotifications(accessToken, user?.id);

  // Hiện toast khi có thông báo mới
  useEffect(() => {
    if (!latestNotification) return;
    toast(`🔔 ${latestNotification.message}`);
  }, [latestNotification]);

  return (
    <div>
      {/* Badge thông báo */}
      <NotificationBell
        count={unreadCount}
        onOpen={() => {
          /* mở panel thông báo */
        }}
      />
    </div>
  );
}
```

---

## 5. Ví dụ tích hợp (Vue 3 Composition API)

```javascript
// composables/useRealtimeNotifications.js
import { ref, onMounted, onUnmounted } from 'vue';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BASE_URL = 'http://localhost:8188';

export function useRealtimeNotifications(accessToken, currentUserId) {
  const unreadCount = ref(0);
  const latestNotification = ref(null);
  let client = null;

  onMounted(async () => {
    // Lấy unread count ban đầu
    const res = await fetch(`${BASE_URL}/api/v1/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    unreadCount.value = data.data?.unread_count ?? 0;

    // Kết nối WebSocket
    client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,

      onConnect: () => {
        client.subscribe(`/topic/notifications/${currentUserId}`, (frame) => {
          const notification = JSON.parse(frame.body);
          unreadCount.value += 1;
          latestNotification.value = notification;
        });
      },
    });

    client.activate();
  });

  onUnmounted(() => client?.deactivate());

  return { unreadCount, latestNotification };
}
```

---

## 6. Luồng UI đề xuất

```
Khi nhận WebSocket notification:
├── Tăng số badge (+1)
├── Hiển thị toast notification với message
└── Nếu panel thông báo đang mở → prepend vào đầu danh sách

Khi user click vào notification:
├── Gọi PATCH /api/v1/notifications/{id}/read
├── Giảm unread count (-1)
└── Navigate đến /articles/{article_id}#comment-{comment_id}

Khi user click "Đánh dấu tất cả đã đọc":
├── Gọi PATCH /api/v1/notifications/read-all
└── Set unreadCount = 0
```

---

## 7. REST API hỗ trợ (dùng song song với WebSocket)

Tất cả endpoint yêu cầu header: `Authorization: Bearer {accessToken}`

### Lấy danh sách thông báo
```
GET /api/v1/notifications?page=0&size=20
```
Response:
```json
{
  "timestamp": 1711500000000,
  "status": 200,
  "message": "success",
  "data": {
    "items": [ ...NotificationResponse ],
    "total": 5
  }
}
```

### Lấy số thông báo chưa đọc
```
GET /api/v1/notifications/unread-count
```
Response:
```json
{
  "data": { "unread_count": 3 }
}
```

### Đánh dấu một thông báo đã đọc
```
PATCH /api/v1/notifications/{notificationId}/read
```

### Đánh dấu tất cả đã đọc
```
PATCH /api/v1/notifications/read-all
```

---

## 8. Xử lý các trường hợp đặc biệt

### Token hết hạn / WebSocket bị ngắt
`reconnectDelay: 5000` sẽ tự động reconnect. Tuy nhiên nếu token đã hết hạn, cần refresh token trước khi reconnect:

```javascript
onConnect: () => { ... },
onDisconnect: async () => {
  await refreshAccessToken(); // gọi API refresh token
  // stompClient sẽ tự reconnect với connectHeaders mới nếu bạn update
},
```

### User chưa đăng nhập
Không gọi `connectWebSocket()` nếu không có `accessToken`. Chỉ dùng REST API polling nếu cần.

### Multiple tabs
Mỗi tab sẽ tạo một WebSocket connection riêng và đều nhận được thông báo. Frontend nên dùng `localStorage` event hoặc `BroadcastChannel` để đồng bộ `unreadCount` giữa các tab nếu cần.

---

## 9. Thứ tự subscribe topic

> **Quan trọng:** Chỉ subscribe sau khi callback `onConnect` được gọi.
> Nếu subscribe trước khi kết nối thành công, message sẽ bị mất.

```
❌ Sai:
client.subscribe('/topic/notifications/1', handler); // subscribe trước activate
client.activate();

✅ Đúng:
onConnect: () => {
  client.subscribe('/topic/notifications/1', handler); // subscribe trong onConnect
}
```

---

## 10. Kiểm tra hoạt động (Development)

1. Mở DevTools → Network → tab WS → filter `ws`
2. Kết nối WebSocket thành công sẽ thấy handshake với `/ws/...`
3. Khi có @mention, frame JSON sẽ xuất hiện trong tab Messages

Hoặc dùng công cụ [STOMP.js Debugger](https://stomp-js.github.io/stomp-websocket/codo/extra/docs-src/Usage.md.html) để xem log chi tiết:
```javascript
new Client({
  // ...
  debug: (str) => console.log('[STOMP]', str),
});
```
