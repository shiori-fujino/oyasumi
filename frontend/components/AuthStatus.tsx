"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

type Me = {
  id: number;
  username: string;
  role: string | null;
};

export default function AuthStatus() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    async function fetchMe() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/api/me/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("token"); // 🔥 추가
          return;
        }

        const data = await res.json();
        setMe(data);
      } catch (error) {
        console.error("Failed to fetch me:", error);
      }
    }

    fetchMe();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  if (!me) {
    return (
      <div className="flex items-center gap-3 text-[12px] text-[#7d766e]">
        <Link
  href="/login"
  className="hover:underline bounce-soft"
>
  login
</Link>
        <Link href="/signup" className="hover:underline">
          signup
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-[12px] text-[#7d766e]">
      <span>
        <Link href="/profile">{me.username}</Link>
        {me.role ? ` (${me.role})` : ""}
      </span>
      <button onClick={handleLogout} className="hover:underline">
        logout
      </button>
    </div>
  );
}