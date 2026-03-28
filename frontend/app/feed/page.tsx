import React from "react";
import Link from "next/link";

type FeedPost = {
  id: number;
  image: string;
  caption: string;
  created_at: string;
};

async function getFeed(): Promise<FeedPost[]> {
  const res = await fetch("http://127.0.0.1:8000/api/feed/", {
    cache: "no-store",
  });

  if (!res.ok) return [];

  return res.json();
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
}

export default async function FeedPage() {
  const posts = await getFeed();

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#5f5a54]">
      <div className="mx-auto w-[92%] max-w-5xl py-8">

        {/* header */}
<div className="mb-8 flex items-center justify-between">
  <h1 className="text-[22px] font-medium text-[#4f4a45]">
    Feed
  </h1>

  <Link
    href="/feed/upload"
    className="text-[13px] text-[#24c256] hover:text-[#3f3a35] transition"
  >
    ✨ upload mine ✨
  </Link>
</div>

        {/* empty */}
        {posts.length === 0 ? (
          <div className="py-20 text-sm text-[#948d85]">
            No feed yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {posts.map((post) => (
              <div key={post.id} className="space-y-2">

                {/* image */}
                <div className="aspect-square overflow-hidden bg-[#eee]">
                  <img
                    src={post.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* caption */}
                {post.caption && (
                  <p className="text-[13px] leading-5 text-[#5b5650] line-clamp-2">
                    {post.caption}
                  </p>
                )}

                {/* time */}
                <p className="text-[11px] text-[#a39b92]">
                  {formatTime(post.created_at)}
                </p>

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}