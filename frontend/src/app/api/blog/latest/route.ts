import { NextResponse } from "next/server";
import { listLatestBlogPosts } from "@/lib/wordpress";

export async function GET() {
  try {
    const posts = await listLatestBlogPosts(4);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Failed to load latest WordPress blog posts:", error);

    return NextResponse.json(
      { posts: [], message: "Unable to load latest blog posts." },
      { status: 500 },
    );
  }
}
