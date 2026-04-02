"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

type Me = {
  id: number;
  username: string;
  role: string | null;
};

export default function FeedUploadPage() {
  const router = useRouter();

  const [me, setMe] = useState<Me | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    async function checkAccess() {
      try {
        const res = await fetch(`${API_BASE}/api/me/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }

        if (!res.ok) {
          router.replace("/feed");
          return;
        }

        const data = await res.json();
        setMe(data);

        if (data.role !== "girl") {
          router.replace("/feed");
          return;
        }
      } catch (err) {
        console.error("me check failed:", err);
        router.replace("/feed");
        return;
      } finally {
        setAuthChecked(true);
      }
    }

    checkAccess();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      alert("please select image");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);

    try {
      setSubmitting(true);

      const res = await fetch(`${API_BASE}/api/feed/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      const text = await res.text();
      console.log("status:", res.status);
      console.log("response text:", text);

      if (res.status === 401) {
        alert("login required");
        router.replace("/login");
        return;
      }

      if (res.status === 403) {
        alert("only girl users can upload");
        router.replace("/feed");
        return;
      }

      if (!res.ok) {
        alert(text || "upload failed");
        return;
      }

      router.push("/feed");
    } catch (err) {
      console.error("upload catch error:", err);
      alert("fetch failed before response body was handled");
    } finally {
      setSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-[#5f5a54]">
        <div className="mx-auto w-[92%] max-w-md py-10">
          <p className="text-sm text-[#948d85]">Checking access...</p>
        </div>
      </main>
    );
  }

  if (me?.role !== "girl") {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#5f5a54]">
      <div className="mx-auto w-[92%] max-w-md py-10 space-y-6">
        <h1 className="text-[18px] font-medium">Upload</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <textarea
            placeholder="caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full border border-[#ddd6cc] px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="text-sm text-[#5f5a54] disabled:opacity-50"
          >
            {submitting ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>
    </main>
  );
}