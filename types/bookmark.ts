export type BookmarkCategory =
  | "uncategorized"
  | "development"
  | "typography"
  | "design_tool";

export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  category: BookmarkCategory;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}
