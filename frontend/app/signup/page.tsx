"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(
          data.error ||
            data.detail ||
            (typeof data === "object" ? JSON.stringify(data) : "Signup failed")
        );
        return;
      }

      alert("Signup successful. Please check your email to verify your account.");
      router.push("/login");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="w-[80%] mx-auto px-6 py-8">
      <h1 className="mb-8 text-2xl font-semibold">Sign up</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border-b py-2 outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-b py-2 outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-b py-2 outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border-b py-2 outline-none"
          >
            <option value="client">Client</option>
            <option value="girl">Girl</option>
            <option value="shop">Shop</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <p className="text-xs text-gray-500">
          Once you choose your role, you can’t change it later, so choose carefully.
        </p>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="text-sm underline">
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </div>
      </form>
    </main>
  );
}