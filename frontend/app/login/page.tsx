"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      router.push("/profile");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="w-[80%] mx-auto px-6 py-8">
      <h1 className="mb-8 text-2xl font-semibold">Login</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border-b py-2 outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-b py-2 outline-none"
          />
        </div>
<div className="mt-6 text-sm text-gray-500">
  No account?{" "}
  <a href="/signup" className="underline">
    Sign up
  </a>
</div>
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="text-sm underline">
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </main>
  );
}