"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";


export default function BoardWritePage() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);
  const [category, setCategory] = useState("news");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  function getAllowedCategories(role: string | null) {
    switch (role) {
      case "admin":
        return ["news", "blog", "jobs", "promo"];
      case "shop":
        return ["blog", "jobs", "promo"];
      case "girl":
        return ["blog"];
      default:
        return [];
    }
  }

  useEffect(() => {
    async function fetchMe() {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first.");
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/me/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!res.ok) {
          alert("Please login again.");
          router.push("/login");
          return;
        }

        const data = await res.json();
        setRole(data.role);

        if (data.role === "client") {
          alert("Clients cannot write posts.");
          router.push("/board");
          return;
        }
      } catch (error) {
        console.error(error);
        router.push("/login");
      }
    }

    fetchMe();
  }, [router]);

  const allowedCategories = getAllowedCategories(role);

  useEffect(() => {
    if (allowedCategories.length > 0 && !allowedCategories.includes(category)) {
      setCategory(allowedCategories[0]);
    }
  }, [role, category]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      alert("Please fill in title and body.");
      return;
    }

    const allowed = getAllowedCategories(role);
    if (!allowed.includes(category)) {
      alert("You are not allowed to post in this category.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first.");
        router.push("/login");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/board/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          category,
          title,
          body,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        alert(`Failed: ${res.status}\n${text}`);
        return;
      }

      const data = JSON.parse(text);

      router.push(`/board/${data.pretty_slug}`);
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="w-[80%] mx-auto px-6 py-8">
      <h1 className="mb-8 text-2xl font-semibold">Write</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1 block text-xs text-gray-500">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border-b py-2 text-sm outline-none"
          >
            {allowedCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Write a title"
            className="w-full border-b py-2 text-lg outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs text-gray-500">
            Body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write something..."
            className="min-h-75 w-full resize-none border-b py-2 text-sm outline-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="text-sm underline"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </main>
  );
}