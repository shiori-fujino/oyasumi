"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

type MyPost = {
  id: number;
  title: string;
  category: string;
  created_at: string;
  views: number;
  pretty_slug: string;
  status: string;
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  return `${day}${month}${year}`;
}

function categoryStyle(cat: string) {
  switch (cat) {
    case "news":
      return "text-[#7da6c6]";
    case "blog":
      return "text-[#8fb39a]";
    case "jobs":
      return "text-[#c78fa0]";
    case "promo":
      return "text-[#b49ac8]";
    default:
      return "text-[#8e8a84]";
  }
}

function categoryLabel(cat: string) {
  switch (cat) {
    case "news":
      return "News";
    case "blog":
      return "Blog";
    case "jobs":
      return "Jobs";
    case "promo":
      return "Promo";
    default:
      return cat;
  }
}

export default function ProfilePage() {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyPosts() {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE}/api/my-posts/`, {
          cache: "no-store",
          headers: token
            ? {
                Authorization: `Token ${token}`,
              }
            : {},
        });

        if (!res.ok) {
          setPosts([]);
          return;
        }

        const data = await res.json();
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch my posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMyPosts();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#5f5a54]">
  <div className="mx-auto w-[92%] max-w-4xl py-8 md:w-[86%] md:py-12">

    {/* back */}
    <div className="mb-8">
      <Link
        href="/board"
        className="block w-fit text-[12px] text-[#8e8a84]"
      >
         &lt;&lt; BACK
      </Link>
    </div>

    {/* header */}
    <div className="mb-10 flex items-end justify-between">
      <div>
        <h1 className="text-[24px] font-medium tracking-[-0.02em] text-[#4f4a45] md:text-[28px]">
          My Profile
        </h1>

      </div>

      <Link
        href="/board/write"
        className="text-[12px] text-[#7d766e]"
      >
        Write Post
      </Link>
    </div>

    {/* section title */}
    <div className="mb-4">
      <h2 className="text-[13px] text-[#8e8a84]">My Posts</h2>
    </div>

    {/* content */}
    {loading ? (
      <div className="py-10 text-sm text-[#948d85]">Loading...</div>
    ) : posts.length === 0 ? (
      <div className="py-10 text-sm text-[#948d85]">
        No posts yet.
      </div>
    ) : (
      <div className="space-y-1">
        {posts.map((post) => {
  const status = post.status?.toLowerCase(); // ← 여기!!!!

  return (
    <div
      key={post.id}
      className="border-b border-[#e4ddd4] py-4"
    >
      {/* meta */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className={categoryStyle(post.category)}>
            {categoryLabel(post.category)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[#928b83]">
          <span>{formatDate(post.created_at)}</span>
          <span>·</span>
          <span>{post.views}</span>
        </div>
      </div>

      {/* title + badge + edit */}
<div className="mt-2 flex items-center gap-2">
  <Link
    href={`/board/${post.pretty_slug}`}
    className="block text-[15px] tracking-[-0.01em] text-[#57514b]"
  >
    {post.title}
  </Link>

  {status === "pending" && (
    <span className="rounded-full bg-[#f6e3e3] px-2 py-[2px] text-[10px] text-[#a25c5c]">
      Pending
    </span>
  )}

  {status === "approved" && (
    <span className="rounded-full bg-[#e4f1e7] px-2 py-[2px] text-[10px] text-[#4f7a5c]">
      Approved
    </span>
  )}

  <Link
    href={`/board/${post.id}/edit`}
    className="ml-1 text-[11px] text-[#8e8a84]"
  >
    Edit
  </Link>
</div></div>
  );
})}
      </div>
    )}
  </div>
</main>
  );
}