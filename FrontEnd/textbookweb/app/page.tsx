"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SignupModal from "./SignupModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

export default function LoginPage() {
  const router = useRouter();

  // form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ui state
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [showSignup, setShowSignup] = useState(false);

  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  function displayMessage(msg: string, type: "success" | "error", ms = 2500) {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    setMessage(msg);
    setMessageType(type);
    timeoutId.current = setTimeout(() => {
      setMessage(null);
      setMessageType(null);
      timeoutId.current = null;
    }, ms);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const { customer_id, name, username: em, phone } = data.user ?? {};
        localStorage.setItem(
          "user",
          JSON.stringify({ customer_id, name, username: em, phone })
        );
        router.push("/import");
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Check console for details.");
    }
  }

  return (
    <main className="relative min-h-screen text-white overflow-hidden" aria-label="Login page">
      {/* 🎬 Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/backgroundVideo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* page content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md text-center rounded-2xl p-8 bg-black/60 text-white border border-white/10 shadow-[0_0_35px_rgba(167,139,250,0.25)]">
          <h1 className="text-3xl font-semibold text-purple-300 drop-shadow-[0_0_10px_rgba(167,139,250,0.35)]">
            Textify
          </h1>
          <p className="mt-1 text-sm text-neutral-300">
            Sign in to access your accessible study digital library
          </p>

          {error && <p className="mt-3 text-sm font-semibold text-red-400">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-6 text-left">
            <label className="block mb-2 text-sm">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg bg-neutral-900 text-white placeholder:text-neutral-400 border border-neutral-700 focus:border-purple-400 focus:outline-none px-4 py-3"
              placeholder="johndoe"
            />

            <label className="block mt-4 mb-2 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-neutral-900 text-white placeholder:text-neutral-400 border border-neutral-700 focus:border-purple-400 focus:outline-none px-4 py-3"
              placeholder="********"
            />

            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-[#c084fc] text-black font-semibold py-3 shadow-[0_0_25px_rgba(192,132,252,0.4)] hover:shadow-[0_0_35px_rgba(192,132,252,0.6)] transition cursor-pointer"
            >
              Login
            </button>
          </form>

          <p className="mt-4 text-sm">
            New to Textify?{" "}
            <button
              onClick={() => setShowSignup(true)}
              className="text-purple-300 hover:underline outline-none focus-visible:underline cursor-pointer"
            >
              Create an account
            </button>
          </p>

          {message && (
            <div
              className={`mt-4 rounded-md px-3 py-2 text-sm border ${
                messageType === "success"
                  ? "bg-green-900/30 text-green-300 border-green-400/50"
                  : "bg-red-900/30 text-red-300 border-red-400/50"
              }`}
              role="status"
              aria-live="polite"
            >
              {message}
            </div>
          )}
        </div>
      </div>

      {showSignup && (
        <SignupModal
          onClose={() => setShowSignup(false)}
          onSuccess={() => displayMessage("Account created!", "success")}
          setError={(m: string) => displayMessage(m, "error")}
          apiBase={API_BASE}
        />
      )}
    </main>
  );
}
