export type Category = {
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export type Photo = {
  id: string;
  path: string;
  thumb_path: string;
  width: number;
  height: number;
  bytes: number;
  blur: string | null;
  title: string | null;
  alt: string | null;
  category: string | null;
  album_id: string | null;
  featured: boolean;
  hero: boolean;
  published: boolean;
  sort_order: number;
  original_name: string | null;
  created_at: string;
};

export type Album = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string | null;
  location: string | null;
  event_date: string | null;
  cover_photo_id: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AlbumWithCover = Album & { cover: Photo | null; photo_count: number };

export type Settings = {
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  location: string | null;
  availability: string | null;
};

export type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  message: string;
  read: boolean;
  created_at: string;
};
