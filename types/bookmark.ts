export interface Bookmark {
  id: string
  user_id: string
  url: string
  title: string
  description?: string
  tags: string[]
  is_shared: boolean
  created_at: string
  updated_at: string
}
