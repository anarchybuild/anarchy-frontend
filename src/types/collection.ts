export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
  preview_images?: string[];
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  design_id: string;
  added_at: string;
}