"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SignupModal from "./SignupModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();

  // form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ui state
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [showSignup, setShowSignup] = useState(false);

  // browser-safe timeout type
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
      const res = await fetch(`${API_BASE}/api/auth/login`, {
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
        router.push("/customer-dashboard"); // TODO: change to your route
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Check console for details.");
    }
  }

  return (
    <main
      className="min-h-screen bg-[url('/images/restomainpic.jpg')] bg-cover bg-center"
      aria-label="Login page"
    >
      {/* dark overlay */}
      <div className="min-h-screen bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center rounded-2xl p-8 shadow-[0_0_35px_rgba(255,215,0,0.25)] bg-black/60 text-white">
          <h1 className="text-3xl font-semibold text-[#ffd700]">Textify</h1>
          <p className="mt-1 text-sm text-neutral-300">
            Sign in to access your accessible study library
          </p>

          {error && (
            <p className="mt-3 text-sm font-semibold text-red-400">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 text-left">
            <label className="block mb-2 text-sm">Username</label>
            <input
              type="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg bg-neutral-900 text-white placeholder:text-neutral-400 border border-neutral-700 focus:border-[#ffd700] focus:outline-none px-4 py-3"
              placeholder="you@example.com"
            />

            <label className="block mt-4 mb-2 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-neutral-900 text-white placeholder:text-neutral-400 border border-neutral-700 focus:border-[#ffd700] focus:outline-none px-4 py-3"
              placeholder="********"
            />

            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-[#ffd700] text-black font-semibold py-3 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition"
            >
              Login
            </button>
          </form>

          <p className="mt-4 text-sm">
            New to Textify?{" "}
            <button
              onClick={() => setShowSignup(true)}
              className="text-[#e6c200] hover:underline outline-none focus-visible:underline"
            >
              Create an account
            </button>
          </p>

          <p className="mt-3 text-sm">
            Or{" "}
            <Link href="/" className="text-[#e6c200] hover:underline">
              Go to Home Page
            </Link>
          </p>

          {/* toast message */}
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
