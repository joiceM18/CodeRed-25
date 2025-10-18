"use client";

import { useState } from "react";

export default function SignupModal({
  onClose,
  onSuccess,
  setError,
  apiBase,
}: {
  onClose: () => void;
  onSuccess: () => void;
  setError: (m: string) => void;
  apiBase: string;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [busy, setBusy] = useState(false);

  async function handleSignup() {
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Signup failed.");
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
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 focus:border-[#ffd700] outline-none"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <input
            className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 focus:border-[#ffd700] outline-none"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
          />
          <input
            className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 focus:border-[#ffd700] outline-none"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-neutral-700 py-3"
          >
            Cancel
          </button>
          <button
            onClick={handleSignup}
            disabled={busy}
            className="flex-1 rounded-lg bg-[#ffd700] text-black font-semibold py-3 disabled:opacity-50"
          >
            {busy ? "Creating..." : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
