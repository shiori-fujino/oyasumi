"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FeedUploadPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      alert("please select image");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("https://oyasumi-vi2k.onrender.com//api/feed/", {
  method: "POST",
  headers: {
    Authorization: `Token ${token}`,
  },
  body: formData,
});

      if (!res.ok) {
        alert("upload failed");
        return;
      }

      router.push("/feed");
    } catch (err) {
      console.error(err);
    }
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
            className="text-sm text-[#5f5a54]"
          >
            Upload
          </button>

        </form>
      </div>
    </main>
  );
}