import type { Post, PostMeta, Tag } from "./types";
import {
  getAllPosts as getAllPostsFromContent,
  getPostBySlug as getPostBySlugFromContent,
  getPostsByCategory as getPostsByCategoryFromContent,
  getPostsByTag as getPostsByTagFromContent,
  getAllTags as getAllTagsFromContent,
  searchPosts as searchPostsFromContent,
  getCategories as getCategoriesFromContent,
} from "./contentService";

export async function getAllPosts(): Promise<PostMeta[]> {
  return getAllPostsFromContent();
}

export async function getPostBySlug(category: string, slug: string): Promise<Post> {
  const post = await getPostBySlugFromContent(category, slug);
  if (!post) {
    throw new Error("Post not found");
  }
  return post;
}

export async function getPostsByCategory(category: string): Promise<PostMeta[]> {
  return getPostsByCategoryFromContent(category);
}

export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
  return getPostsByTagFromContent(tag);
}

export async function getAllTags(): Promise<Tag[]> {
  return getAllTagsFromContent();
}

export async function searchPosts(query: string): Promise<PostMeta[]> {
  return searchPostsFromContent(query);
}

export async function getCategories(): Promise<string[]> {
  return getCategoriesFromContent();
}
