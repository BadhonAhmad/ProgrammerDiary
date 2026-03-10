import { Post, PostMeta, Tag } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getAllPosts(): Promise<PostMeta[]> {
  return fetchAPI<PostMeta[]>('/posts');
}

export async function getPostBySlug(category: string, slug: string): Promise<Post> {
  return fetchAPI<Post>(`/posts/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`);
}

export async function getPostsByCategory(category: string): Promise<PostMeta[]> {
  return fetchAPI<PostMeta[]>(`/posts/category/${encodeURIComponent(category)}`);
}

export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
  return fetchAPI<PostMeta[]>(`/posts/tag/${encodeURIComponent(tag)}`);
}

export async function getAllTags(): Promise<Tag[]> {
  return fetchAPI<Tag[]>('/tags');
}

export async function searchPosts(query: string): Promise<PostMeta[]> {
  return fetchAPI<PostMeta[]>(`/posts/search?q=${encodeURIComponent(query)}`);
}

export async function getCategories(): Promise<string[]> {
  return fetchAPI<string[]>('/categories');
}
