import { NextResponse } from "next/server";
import { searchPosts } from "@/lib/contentService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query) {
    return NextResponse.json([]);
  }

  const posts = searchPosts(query);
  return NextResponse.json(posts);
}
