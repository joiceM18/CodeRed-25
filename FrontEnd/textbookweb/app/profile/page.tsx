"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchTextbooks, type TextbookRow } from "@/lib/fetchTextbooks";
import { getUser } from "@/lib/userStore";

export default function ProfilePage() {
  const router = useRouter();

  const [userID, setUserID] = useState<number | null>(null);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [items, setItems] = useState<TextbookRow[]>([]);

  // Get user on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const user = getUser();
    if (user && user.userId) {
      setUserID(Number(user.userId));
      setUsername(user.username || "");
    } else {
      setUserID(null);
      setUsername("");
    }
    setLoading(false);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && userID === null) {
      setTimeout(() => router.push("/"), 1000);
    }
  }, [userID, loading, router]);

  // Fetch textbooks
  useEffect(() => {
    if (!userID || loading) return;
    (async () => {
      setError("");
      try {
        const resp = await fetchTextbooks(userID);
        if (resp.success && Array.isArray(resp.textbooks)) {
          setItems(resp.textbooks);
        } else {
          setError(resp.message || "Failed to load textbooks.");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load textbooks.");
      }
    })();
  }, [userID, loading]);

  // Cards grid
  const grid = useMemo(() => {
    if (!items?.length) return null;

    const isUrl = (val: string) =>
      typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"));

    return (
      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((tb) => {
          const subject = tb.subject || "(unknown)";

          const inSrc =
            tb.textbook_input
              ? isUrl(tb.textbook_input)
                ? tb.textbook_input
                : `data:image/png;base64,${tb.textbook_input}`
              : "";

          const outSrc =
            tb.textbook_output
              ? isUrl(tb.textbook_output)
                ? tb.textbook_output
                : `data:image/png;base64,${tb.textbook_output}`
              : "";

          const key =
            tb.textbookID
              ? `tb-${tb.textbookID}`
              : `${subject}-${(tb.textbook_input || "").slice(0, 8)}`;

          return (
            <article
              key={key}
              className="rounded-2xl border border-white/10 bg-neutral-950/70 p-5 backdrop-blur-xl shadow-[0_0_35px_rgba(167,139,250,0.18)] hover:shadow-[0_0_50px_rgba(167,139,250,0.28)] transition-shadow"
            >
              <h3 className="text-base font-semibold text-neutral-100">
                <span className="pb-0.5 border-b-2 border-purple-400/70">{subject}</span>
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs text-neutral-400">Input</div>
                  {inSrc ? (
                    <img
                      src={inSrc}
                      alt={`Input ${tb.textbookID ?? subject}`}
                      className="w-full h-auto rounded-lg border border-white/10"
                    />
                  ) : (
                    <div className="text-xs text-neutral-400">(no input image)</div>
                  )}
                </div>

                <div>
                  <div className="mb-1 text-xs text-neutral-400">Output</div>
                  {outSrc ? (
                    <img
                      src={outSrc}
                      alt={`Output ${tb.textbookID ?? subject}`}
                      className="w-full h-auto rounded-lg border border-white/10"
                    />
                  ) : (
                    <div className="text-xs text-neutral-400">(no output image)</div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    );
  }, [items]);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white"
      aria-label="Profile"
    >
      {/* 💫 floating purple bubbles background */}
<div className="pointer-events-none absolute inset-0 overflow-hidden">
  {/* top row */}
  <div className="absolute -top-10 left-6 h-36 w-36 rounded-full bg-purple-500/18 blur-2xl animate-slow-pulse" />
  <div className="absolute -top-6 right-10 h-32 w-32 rounded-full bg-indigo-500/18 blur-2xl animate-pulse [animation-delay:400ms]" />
  <div className="absolute top-16 left-1/3 h-28 w-28 rounded-full bg-fuchsia-500/16 blur-2xl animate-pulse [animation-delay:800ms]" />

  {/* middle band */}
  <div className="absolute -top-10 left-6 h-36 w-36 rounded-full bg-purple-500/18 blur-2xl animate-slow-pulse" />
  <div className="absolute top-1/3 right-1/4 h-36 w-36 rounded-full bg-purple-400/14 blur-3xl animate-pulse [animation-delay:1600ms]" />
  <div className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-fuchsia-400/14 blur-2xl animate-pulse [animation-delay:2000ms]" />

  {/* bottom band */}
  <div className="absolute -top-10 left-6 h-36 w-36 rounded-full bg-purple-500/18 blur-2xl animate-slow-pulse" />
  <div className="absolute bottom-16 right-10 h-36 w-36 rounded-full bg-indigo-500/16 blur-2xl animate-pulse [animation-delay:2800ms]" />
  <div className="absolute bottom-20 left-1/3 h-28 w-28 rounded-full bg-fuchsia-500/16 blur-2xl animate-pulse [animation-delay:3200ms]" />

  {/* soft vignette */}
  <div className="absolute inset-0 bg-[radial-gradient(transparent,rgba(0,0,0,0.45))]" />
</div>

      {/* top bar */}
        <header className="relative z-10 mx-auto max-w-7xl px-6 pt-24">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(167,139,250,0.35)]">
                Textify
              </span>{" "}
              <span className="text-neutral-200">
                • {username ? `${username}'s Profile` : "Profile"}
              </span>
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Your converted materials in one place.
            </p>
          </div>

          {/* initials badge */}
          <div
            aria-label="User initials"
            className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-neutral-900/70 text-xl font-bold text-neutral-100 shadow-[0_0_20px_rgba(167,139,250,0.25)]"
          >
            {username ? username[0].toUpperCase() : "?"}
          </div>
        </div>
      </header>

      {/* content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        {/* states */}
        {loading && (
          <div className="mt-8 flex items-center gap-3 text-neutral-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-r-transparent" />
            Loading…
          </div>
        )}

        {!loading && !userID && (
          <div className="mt-8 text-sm text-red-400">
            Not logged in. Redirecting to login…
          </div>
        )}

        {!loading && userID && error && (
          <div className="mt-8 text-sm text-red-400">{error}</div>
        )}

        {!loading && userID && !error && !items.length && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-neutral-950/70 p-6 backdrop-blur-xl text-neutral-300">
            You haven’t saved any textbooks yet. Import something to get started!
          </div>
        )}

        {!loading && userID && grid}

        {/* actions */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/import" passHref legacyBehavior>
            <a className="cursor-pointer rounded-lg bg-[#c084fc] px-4 py-2 text-black text-sm font-semibold hover:bg-[#d8b4fe]">
              Import Image
            </a>
          </Link>

          <Link
            href="/"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-neutral-200 hover:bg-white/10 transition"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </main>
  );
}
