export interface PostMeta {
  title: string;
  slug: string;
  category: string;
  date: string;
  tags: string[];
  excerpt: string;
}

export interface Post extends PostMeta {
  content: string;
}

export interface Tag {
  name: string;
  count: number;
}
