"use client";

import { useState } from "react";
import { setUser } from "../lib/userStore";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  setError: (m: string) => void;
  apiBase: string;
};

export default function SignupModal({ onClose, onSuccess, setError, apiBase }: Props) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [busy, setBusy] = useState(false);

  // 🖱️ Mouse click handlers for buttons
  function handleCancelClick() {
    console.log("🖱️ Cancel button clicked");
    onClose();
  }

  async function handleSignupClick() {
    console.log("🖱️ Sign up button clicked");
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        // Accepts userID, userId, customer_id, username
        const user = data.user ?? {};
        const userId = user.userID || user.userId || user.customer_id;
        const usernameVal = user.username || user.name || form.username;
        if (userId && usernameVal) {
          setUser({ userId, username: usernameVal, password: form.password });
        }
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Signup failed.");
      }
    } catch (e) {
      console.error(e);
      setError("Server error during signup.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Create account"
    >
      <div className="w-full max-w-md rounded-2xl bg-neutral-950 text-white p-6 border border-neutral-800">
        <h2 className="text-xl font-semibold">Create your account</h2>

        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 focus:border-[#ffd700] outline-none"
            placeholder="Username"
            type="text"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          />
          <input
            className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 focus:border-[#ffd700] outline-none"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleCancelClick}
            className="flex-1 rounded-lg border border-neutral-700 py-3 cursor-pointer hover:bg-neutral-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSignupClick}
            disabled={busy}
            className="flex-1 rounded-lg bg-[#c084fc] text-black font-semibold py-3 cursor-pointer disabled:opacity-50 hover:bg-[#d8b4fe] transition"
          >
            {busy ? "Creating..." : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
