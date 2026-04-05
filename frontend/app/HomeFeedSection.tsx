"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

type FeedPost = {
  id: number;
  image: string;
  caption?: string;
  created_at: string;
};

export default function HomeFeedSection() {
  const [feeds, setFeeds] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function fetchFeed() {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      try {
        const res = await fetch(`${API_BASE}/api/feed/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!res.ok) {
          setFeeds([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setFeeds(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch (error) {
        console.error("Failed to fetch feed:", error);
        setFeeds([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFeed();
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] text-[#4f4a45]">New Feed ♡</h2>
        <Link
          href="/feed"
          className="text-sm text-[#8b847b] hover:text-[#4f4a45]"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-[#999]">Loading...</p>
      ) : !isLoggedIn ? (
        <p className="text-sm text-[#999]">
          Please{" "}
          <Link href="/login" className="underline hover:text-[#4f4a45]">
            log in
          </Link>{" "}
          to check what's HOT today.
        </p>
      ) : feeds.length === 0 ? (
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
  );
}