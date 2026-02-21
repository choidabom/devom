export interface GuestbookEntry {
  id: string
  user_id?: string
  name: string
  message: string
  emoji?: string
  created_at: string
  avatar_url?: string
}
