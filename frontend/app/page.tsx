import React from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

type BoardPost = {
  id: number;
  title: string;
  category: string;
  views: number;
  created_at: string;
};

type FeedPost = {
  id: number;
  image: string;
  caption?: string;
  created_at: string;
};

async function getPopularPosts(): Promise<BoardPost[]> {
  const res = await fetch(`${API_BASE}/api/board/?sort=views&page=1`, {
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.results?.slice(0, 5) ?? [];
}

async function getLatestFeed(): Promise<FeedPost[]> {
  const res = await fetch(`${API_BASE}/api/feed/`, {
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data) ? data.slice(0, 6) : [];
}

export default async function HomePage() {
  const [posts, feeds] = await Promise.all([
    getPopularPosts(),
    getLatestFeed(),
  ]);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#5f5a54]">
      <div className="mx-auto w-[92%] max-w-5xl py-10 space-y-14">
        

        <section className="space-y-4">
          <div className="flex items-center justify-between">
           <h2 className="text-[18px] text-[#4f4a45]">
  Hot Posts ♡
</h2>
            <Link href="/board" className="text-sm text-[#8b847b] hover:text-[#4f4a45]">
              View all
            </Link>
          </div>

          {posts.length === 0 ? (
            <p className="text-sm text-[#999]">No posts yet.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/board/${post.id}`}
                  className="block border-b border-[#e8e1d8] pb-3"
                >
                  <p className="text-[14px] text-[#4f4a45]">{post.title}</p>
                  <p className="mt-1 text-[11px] text-[#999]">
                    {post.category} · {post.views} views
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
           <h2 className="text-[18px] text-[#4f4a45]">
  New Feed ♡
</h2>
            <Link href="/feed" className="text-sm text-[#8b847b] hover:text-[#4f4a45]">
              View all
            </Link>
          </div>

          {feeds.length === 0 ? (
            <p className="text-sm text-[#999]">
  Please{" "}
  <Link href="/login" className="underline hover:text-[#4f4a45]">
    log in
  </Link>{" "}
  to check what's HOT today.
</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {feeds.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square overflow-hidden bg-[#eee]"
                >
                  <img
                    src={post.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        
      </div>
    </main>
  );
}