"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const uid = params.get("uid");
  const token = params.get("token");

  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    if (!uid || !token) {
      setStatus("Invalid link.");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/verify-email/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid, token }),
    })
      .then((res) => {
        if (res.ok) setStatus("✅ Email verified!");
        else setStatus("❌ Invalid or expired link.");
      })
      .catch(() => setStatus("Something went wrong."));
  }, [uid, token]);

  return <div style={{ padding: 40 }}>{status}</div>;
}