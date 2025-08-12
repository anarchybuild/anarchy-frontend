export interface Series {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeriesImage {
  id: string;
  series_id: string;
  image_url: string;
  order_index: number;
  is_selected: boolean;
  created_at: string;
}

export interface CreateSeriesData {
  name: string;
  description?: string;
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
}

export interface UpdateSeriesData {
  name?: string;
  description?: string;
  is_published?: boolean;
}