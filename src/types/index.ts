// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthTokenResponse {
  id: number;
  access_token: string;
  refresh_token: string;
  token_expired_seconds: number;
  refresh_expired_seconds: number;
  token_type: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar: string | null;
  status: number;
}

export interface UserRequest {
  username: string;
  full_name: string;
  email: string;
  phone_number?: string;
  status?: number;
}

export interface UserFilterRequest {
  page?: number;
  size?: number;
  keyword?: string;
  status?: number[];
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UserHistory {
  id: number;
  user_id: number;
  message: string;
  created_at: number;
  created_by: string;
}

// ─── Source ───────────────────────────────────────────────────────────────────

export interface Source {
  id: number;
  name: string;
  url: string;
  avatar: string | null;
  type: number | null;
  description: string | null;
}

export interface SourceRequest {
  name: string;
  url: string;
  avatar?: string;
  type?: number;
  description?: string;
}

export interface SourceFilterRequest {
  page?: number;
  size?: number;
  keyword?: string;
}

export interface SourceWithTopics {
  id: number;
  name: string;
  topics: Array<{ id: number; name: string }>;
}

// ─── Topic ────────────────────────────────────────────────────────────────────

export interface Topic {
  id: number;
  name: string;
  url: string;
  rss_url: string | null;
  description: string | null;
  source_id: number;
  source_name: string;
}

export interface TopicRequest {
  name: string;
  url: string;
  rss_url?: string;
  description?: string;
  source_id: number;
}

export interface TopicFilterRequest {
  page?: number;
  size?: number;
  keyword?: string;
}

// ─── Article ──────────────────────────────────────────────────────────────────

export interface Article {
  id: number;
  title: string;
  link: string;
  guid: string | null;
  description: string | null;
  pub_date: number | null;
  image_link: string | null;
  topic_id: number;
  topic_name: string;
  /** Tên nguồn tin (nếu API trả về); nếu không có sẽ suy ra từ hostname của link */
  source_name?: string | null;
}

export interface ArticleRequest {
  title: string;
  link: string;
  guid?: string;
  description?: string;
  pub_date?: number;
  image_link?: string;
  topic_id: number;
}

export interface ArticleFilterRequest {
  page?: number;
  size?: number;
  keyword?: string;
  topic_id?: number;
  source_id?: number;
  from_pub_date?: string;
  to_pub_date?: string;
}

// ─── Common API ───────────────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  amount: number;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Blog ─────────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: number;
  user_id: number;
  author_name: string | null;
  author_username?: string | null;
  author_avatar: string | null;
  title: string;
  content: string;
  image_url: string | null;
  visibility: 0 | 1;
  created_at: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  liked: boolean;
}

export interface BlogPostRequest {
  title: string;
  content: string;
  image_url?: string;
  visibility: 0 | 1;
}

export interface BlogPostFilterRequest {
  page?: number;
  size?: number;
  keyword?: string;
  author_id?: number;
}

export interface BlogComment {
  id: number;
  post_id: number;
  user_id: number;
  author_name: string | null;
  author_username?: string | null;
  author_avatar: string | null;
  parent_comment_id: number | null;
  content: string;
  created_at: number;
}

export interface BlogCommentRequest {
  content: string;
  parent_comment_id?: number | null;
}

export interface BlogShareRequest {
  content?: string;
}

export interface BlogUserProfile {
  id: number;
  username: string;
  full_name: string;
  avatar: string | null;
  email: string;
  total_posts: number;
  posts: PageResponse<BlogPost>;
}

// ─── Comment & Mention ────────────────────────────────────────────────────────

export interface MentionUser {
  id: number;
  username: string;
  full_name: string;
  avatar: string | null;
}

export interface CommentMentionedUser {
  user_id: number;
  username: string;
  full_name: string;
}

export interface Comment {
  id: number;
  article_id: number;
  user_id: number;
  username: string;
  full_name: string;
  avatar: string | null;
  content: string;
  created_at: number;
  mentioned_users: CommentMentionedUser[] | null;
}

export interface CommentRequest {
  content: string;
  mentioned_user_ids?: number[];
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  sender_user_id: number;
  sender_full_name: string;
  type: string;
  message: string;
  article_id: number;
  comment_id: number;
  is_read: boolean;
  created_at: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

// ─── Favorites & View History ─────────────────────────────────────────────────

export interface FavoriteArticle {
  id: number;
  user_id: number;
  article_id: number;
  title: string;
  link: string;
  image_link: string | null;
  pub_date: number;
  topic_name: string;
  source_name: string;
  created_at: number;
}

export interface ArticleViewHistory {
  id: number;
  user_id: number;
  article_id: number;
  title: string;
  link: string;
  image_link: string | null;
  pub_date: number;
  topic_name: string;
  source_name: string;
  viewed_at: number;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatGroup {
  id: number;
  name: string | null;
  avatar: string | null;
  member_count: number;
  my_role: "ADMIN" | "MEMBER";
  is_direct: boolean;
  created_at: number;
}

export interface ChatGroupMember {
  member_id: number;
  user_id: number;
  username: string;
  full_name: string;
  avatar: string | null;
  role: "ADMIN" | "MEMBER";
  online?: boolean | null;
}

export interface ChatGroupDetail {
  id: number;
  name: string | null;
  avatar: string | null;
  my_role: "ADMIN" | "MEMBER";
  is_direct: boolean;
  created_at: number;
  members: ChatGroupMember[];
}

export interface ReaderResponse {
  user_id: number;
  username: string;
  full_name: string;
  avatar: string | null;
  read_at: number;
}

export interface ReactionReactor {
  user_id: number;
  username: string;
  full_name: string;
  avatar: string | null;
}

export interface ReactionResponse {
  emoji: string;
  count: number;
  reacted_by_me: boolean;
  reactors: ReactionReactor[];
}

export interface PresenceEvent {
  user_id: number;
  username: string;
  full_name: string;
  avatar: string | null;
  online: boolean;
  timestamp: number;
}

export interface ReadReceiptEvent {
  user_id: number;
  username: string;
  full_name: string;
  avatar: string | null;
  last_read_message_id: number;
  read_at: number;
}

export interface ReactionEvent {
  type: "ADD" | "REMOVE";
  message_id: number;
  user_id: number;
  username: string;
  avatar: string | null;
  emoji: string;
  reactions: ReactionResponse[];
}

export interface RecallEvent {
  message_id: number;
  group_id: number;
  recalled_by: number;
  recalled_at: number;
}

export interface ChatMessage {
  id: number;
  group_id: number;
  sender_id: number;
  sender_username: string;
  sender_full_name: string;
  sender_avatar: string | null;
  content: string;
  message_type: "TEXT" | "IMAGE" | "EMOJI" | null;
  recalled?: boolean;
  created_at: number;
  readers?: ReaderResponse[];
  reactions?: ReactionResponse[];
}

export interface ChatMessagePage {
  content: ChatMessage[];
  amount: number;
}

export interface CreateGroupRequest {
  name: string;
  avatar?: string;
  member_ids: number[];
}

export interface AddMemberRequest {
  user_id: number;
}

export interface SendMessageRequest {
  content: string;
  message_type: "TEXT" | "IMAGE";
}
