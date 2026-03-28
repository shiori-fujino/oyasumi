import React from "react";
import Link from "next/link";

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
  const res = await fetch("http://127.0.0.1:8000/api/board/?sort=views&page=1", {
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.results?.slice(0, 5) ?? [];
}

async function getLatestFeed(): Promise<FeedPost[]> {
  const res = await fetch("http://127.0.0.1:8000/api/feed/", {
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
          <h1 className="text-3xl font-semibold text-[#4f4a45]">
            Board & Feed
          </h1>
          <p className="text-sm text-[#7a7268]">
            community posts, updates, and daily moments
          </p>

          <div className="flex gap-3 pt-2">
            <Link
              href="/board"
              className="px-4 py-2 text-sm bg-[#3f3a35] text-white"
            >
              Browse Board
            </Link>

            <Link
              href="/signup"
              className="px-4 py-2 text-sm border border-[#ccc]"
            >
              Join now
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
           <h2 className="text-[18px] text-[#4f4a45]">
  <span className="soft-bob inline-block">Hot Posts ♡</span>
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
  New Feed <span className="soft-pulse">♡</span>
</h2>
            <Link href="/feed" className="text-sm text-[#8b847b] hover:text-[#4f4a45]">
              View all
            </Link>
          </div>

          {feeds.length === 0 ? (
            <p className="text-sm text-[#999]">No feed yet.</p>
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

        <section className="border-t border-[#e8e1d8] pt-6 text-center space-y-3">
          <p className="text-sm text-[#7a7268]">
            Join to write posts and upload your own feed.
          </p>

          <div className="flex justify-center gap-3">
            <Link
              href="/signup"
              className="px-4 py-2 text-sm bg-[#6bc224] text-white"
            >
              Sign Up
            </Link>

            <Link
              href="/login"
              className="px-4 py-2 text-sm border border-[#ccc]"
            >
              Log In
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}