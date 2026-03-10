import { Router } from 'express';
import {
  getAllPosts,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
  getAllTags,
  searchPosts,
  getCategories,
} from '../services/contentService.js';

export const postsRouter = Router();

postsRouter.get('/posts', (_req, res) => {
  const posts = getAllPosts();
  res.json(posts);
});

postsRouter.get('/posts/search', (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q : '';
  if (!query) {
    res.json([]);
    return;
  }
  const results = searchPosts(query);
  res.json(results);
});

postsRouter.get('/posts/category/:category', (req, res) => {
  const posts = getPostsByCategory(req.params.category);
  res.json(posts);
});

postsRouter.get('/posts/tag/:tag', (req, res) => {
  const posts = getPostsByTag(req.params.tag);
  res.json(posts);
});

postsRouter.get('/posts/:category/:slug', async (req, res) => {
  const post = await getPostBySlug(req.params.category, req.params.slug);
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  res.json(post);
});

postsRouter.get('/tags', (_req, res) => {
  const tags = getAllTags();
  res.json(tags);
});

postsRouter.get('/categories', (_req, res) => {
  const categories = getCategories();
  res.json(categories);
});
