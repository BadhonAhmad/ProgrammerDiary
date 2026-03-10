import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

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

const CONTENT_DIR = path.join(process.cwd(), 'content');

const CATEGORIES = [
  'backend',
  'system-design',
  'algorithms',
  'databases',
  'dev-tools',
  'debugging-stories',
];

export function getAllPosts(): PostMeta[] {
  const posts: PostMeta[] = [];

  for (const category of CATEGORIES) {
    const categoryDir = path.join(CONTENT_DIR, category);
    if (!fs.existsSync(categoryDir)) continue;

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(fileContent);

      posts.push({
        title: data.title || file.replace('.md', ''),
        slug: file.replace('.md', ''),
        category,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        tags: data.tags || [],
        excerpt: data.excerpt || '',
      });
    }
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostBySlug(category: string, slug: string): Promise<Post | null> {
  const safeCat = path.basename(category);
  const safeSlug = path.basename(slug);
  const filePath = path.join(CONTENT_DIR, safeCat, `${safeSlug}.md`);

  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const htmlContent = await marked(content);

  return {
    title: data.title || slug,
    slug: safeSlug,
    category: safeCat,
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    tags: data.tags || [],
    excerpt: data.excerpt || '',
    content: htmlContent,
  };
}

export function getPostsByCategory(category: string): PostMeta[] {
  return getAllPosts().filter(p => p.category === category);
}

export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter(p => p.tags.includes(tag));
}

export function getAllTags(): { name: string; count: number }[] {
  const tagMap = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function searchPosts(query: string): PostMeta[] {
  const q = query.toLowerCase();
  return getAllPosts().filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.excerpt.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q)) ||
    p.category.toLowerCase().includes(q)
  );
}

export function getCategories(): string[] {
  return CATEGORIES;
}
