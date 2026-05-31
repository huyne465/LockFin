# Friends Feature — FE Implementation Brief

> Backend đã xong (module `friends` + feed filter). Doc này mô tả contract để FE dựng UI add friend & quản lý quan hệ bạn bè. Mọi endpoint cần `Authorization: Bearer <supabase_access_token>`.

---

## 1. Bối cảnh

- DB có bảng `friendships`: `id`, `requester_id`, `receiver_id`, `status` (`PENDING` | `ACCEPTED` | `BLOCKED`), `created_at`. Hai user chỉ có **tối đa 1 hàng** quan hệ (theo chiều nào cũng tính là một).
- `GET /posts/feed` giờ **chỉ trả post public của chính user + bạn bè đã `ACCEPTED`**. Không kết bạn → không thấy feed của nhau. FE không phải đổi gì ở feed ngoài việc đảm bảo có gửi token.
- Chưa có khái niệm `BLOCKED` ở UI (backend chỉ chặn thao tác nếu status là BLOCKED). FE giai đoạn này chỉ cần lo PENDING/ACCEPTED.

---

## 2. Data shapes

### `ProfileSummary`
```ts
interface ProfileSummary {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}
```

### `Friendship` (row thô)
```ts
type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED';

interface Friendship {
  id: string;
  requester_id: string;   // người gửi lời mời
  receiver_id: string;    // người nhận
  status: FriendshipStatus;
  created_at: string;     // ISO timestamp
}
```

### `FriendshipWithProfile` (row có join profile)
Tuỳ endpoint mà `requester` và/hoặc `receiver` được nhúng:
```ts
interface FriendshipWithProfile extends Friendship {
  requester?: ProfileSummary | null;
  receiver?: ProfileSummary | null;
}
```

> ⚠️ **Quan trọng — xác định "người kia":** trong danh sách bạn (`GET /friends`), một hàng có thể là mình đứng ở `requester` hoặc `receiver`. FE phải tự suy ra "người bạn" = bên **không phải** `currentUser.id`:
> ```ts
> const other = f.requester_id === me.id ? f.receiver : f.requester;
> ```

---

## 3. Endpoints

### 3.1 Gửi lời mời kết bạn
```
POST /friends/requests
Body: { "receiver_id": "<profile-uuid>" }
```
**Response `201`** → `Friendship` (status thường là `PENDING`).

Hành vi đặc biệt: nếu người kia **đã gửi lời mời cho mình từ trước** (PENDING ngược chiều), backend tự **ACCEPTED** ngay → response sẽ có `status: "ACCEPTED"`. FE nên xử lý cả 2 trường hợp.

**Lỗi:**
| Code | Khi nào | Message |
|---|---|---|
| `400` | `receiver_id` == mình | `You cannot add yourself as a friend` |
| `409` | Đã là bạn | `You are already friends` |
| `409` | Đã gửi lời mời cùng chiều | `Friend request already sent` |
| `403` | Quan hệ đang BLOCKED | `This user is unavailable` |

### 3.2 Chấp nhận lời mời
```
PATCH /friends/:id/accept
```
`:id` = `friendship.id`. **Response `200`** → `Friendship` với `status: "ACCEPTED"`.

**Lỗi:** `404` không tìm thấy · `403` mình không phải receiver (chỉ người nhận mới accept được) · `409` request không còn ở trạng thái PENDING.

### 3.3 Từ chối / Huỷ lời mời / Huỷ kết bạn (gộp 1)
```
DELETE /friends/:id
```
Xoá hàng friendship. Dùng cho **cả 3 case**: từ chối lời mời đến, rút lại lời mời đã gửi, unfriend. **Response `204`** (no content).

**Lỗi:** `404` không tìm thấy · `403` mình không thuộc quan hệ này.

### 3.4 Danh sách bạn (đã ACCEPTED)
```
GET /friends
```
**Response `200`** → `FriendshipWithProfile[]`, có cả `requester` và `receiver`. Sắp xếp mới nhất trước.

### 3.5 Lời mời đến (incoming, đang chờ mình duyệt)
```
GET /friends/requests/incoming
```
**Response `200`** → `FriendshipWithProfile[]`, mỗi hàng có `requester` (người gửi). Đây là list để hiện nút **Accept / Decline**.

### 3.6 Lời mời đã gửi (outgoing, đang chờ người kia duyệt)
```
GET /friends/requests/outgoing
```
**Response `200`** → `FriendshipWithProfile[]`, mỗi hàng có `receiver` (người nhận). Hiện trạng thái "Đang chờ" + nút **Cancel** (`DELETE /friends/:id`).

---

## 4. UI flows gợi ý

**Màn Friends (tab/list):**
1. Section "Lời mời" — gọi `GET /friends/requests/incoming`. Mỗi item: avatar + username của `requester`, nút **Accept** (`PATCH /friends/:id/accept`) và **Decline** (`DELETE /friends/:id`).
2. Section "Đã gửi" — `GET /friends/requests/outgoing`, mỗi item nút **Huỷ** (`DELETE /friends/:id`).
3. Section "Bạn bè" — `GET /friends`, hiển thị `other` (suy ra như mục 2), mỗi item có thể có nút **Unfriend** (`DELETE /friends/:id`).

**Thêm bạn:**
- Cần một cách tìm user (vd ô search theo `username`). **Lưu ý:** hiện backend **chưa có** endpoint search profile / list users. FE cần xác nhận với BE để thêm `GET /profiles/search?q=` (hoặc QR/share link bằng `profile.id`). Trước mắt có thể nhập/scan `profile.id` rồi gọi `POST /friends/requests`.

**Feed:** không đổi — `GET /posts/feed?limit=&offset=` như cũ, chỉ cần đảm bảo đính kèm token. Sau khi 2 user kết bạn, post public của họ tự xuất hiện trong feed của nhau.

---

## 5. Optimistic update & cache

- Sau `accept` / `delete`, nên invalidate cả 3 list (`/friends`, incoming, outgoing) vì 1 thao tác làm thay đổi nhiều list.
- Sau khi accept một người, có thể invalidate `/posts/feed` để feed cập nhật post mới của bạn.
- Map lỗi `409`/`403`/`400` thành toast tiếng Việt thân thiện thay vì hiện message thô.

---

## 6. Việc cần chốt với Backend

1. **Endpoint tìm/khám phá user để add** (`GET /profiles/search?q=` hoặc tương đương) — hiện chưa có, FE đang bị kẹt ở bước "tìm người để gửi lời mời".

-> nên tạo thêm code để add friend cho dễ ? hoặc QR/share link bằng `profile.id`

2. Có cần trả kèm `mutual_friends_count` / trạng thái quan hệ khi search không? -> chưa cần đâu
3. Có cần realtime (Supabase Realtime trên bảng `friendships`) để badge lời mời cập nhật tức thì không? nên có cho trải nghiệm tốt nhất


