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

  useEffect(() => {
    // Only run on client
    if (typeof window !== "undefined") {
      const user = getUser();
      console.log("[ProfilePage] getUser() result:", user);
      if (user && user.userId) {
        setUserID(Number(user.userId));
        setUsername(user.username || "");
      } else {
        setUserID(null);
        setUsername("");
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If not logged in, redirect to login after a short delay
    if (!loading && userID === null) {
      console.log("[ProfilePage] No userID detected, redirecting to login...");
      setTimeout(() => {
        router.push("/");
      }, 1200);
    }
  }, [userID, loading, router]);

  useEffect(() => {
    if (!userID || loading) return;
    const run = async () => {
      setError("");
      try {
        const resp = await fetchTextbooks(userID);
        if (resp.success && Array.isArray(resp.textbooks)) {
          setItems(resp.textbooks);
        } else {
          setError(resp.message || "Failed to load textbooks");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load textbooks");
      }
    };
    run();
  }, [userID, loading]);

  const grid = useMemo(() => {
    if (!items?.length) return null;
    console.log("[ProfilePage] textbooks items:", items);
    return (
      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((tb) => {
          const subject = tb.subject || "(unknown)";
          // Build data URIs; default to PNG
          const inSrc = tb.textbook_input
            ? `data:image/png;base64,${tb.textbook_input}`
            : "";
          const outSrc = tb.textbook_output
            ? `data:image/png;base64,${tb.textbook_output}`
            : "";
          return (
            <article
              key={tb.textbookID ? `tb-${tb.textbookID}` : `${tb.subject}-${tb.textbook_input.slice(0,8)}`}
              className="rounded-2xl border border-neutral-800/70 bg-neutral-900/60 p-5 shadow-[0_0_25px_rgba(255,215,0,0.12)]"
            >
              <h3 className="text-base font-semibold text-neutral-100">
                <span className="border-b-2 border-[#ffd700] pb-0.5">{subject}</span>
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Input</div>
                  {inSrc ? (
                    <img
                      src={inSrc}
                      alt={`Input ${tb.textbookID ?? tb.subject}`}
                      className="w-full h-auto rounded-lg border border-neutral-800"
                    />
                  ) : (
                    <div className="text-xs text-neutral-400">(no input image)</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Output</div>
                  {outSrc ? (
                    <img
                      src={outSrc}
                      alt={`Output ${tb.textbookID ?? tb.subject}`}
                      className="w-full h-auto rounded-lg border border-neutral-800"
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
    <main className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-white">
      {/* top bar */}
      <header className="mx-auto max-w-7xl px-6 pt-10">
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-[#ffd700]">Textify</span> • {username ? `${username}'s Profile` : "Profile"}
          </h1>
          {/* initials badge */}
          <div
            aria-label="User initials"
            className="h-12 w-12 rounded-full border border-neutral-700/80 grid place-items-center text-2xl font-bold text-neutral-200 bg-neutral-900/60 shadow-[0_0_15px_rgba(255,215,0,0.15)]"
          >
            {username ? username[0].toUpperCase() : "?"}
          </div>
        </div>
      </header>

      {/* content */}
      <div className="mx-auto max-w-7xl px-6 pb-16">
        {/* status */}
        {loading && (
          <div className="mt-6 text-sm text-neutral-300">Loading…</div>
        )}
        {!loading && !userID && (
          <div className="mt-6 text-sm text-red-400">Not logged in. Please sign in to view your textbooks.</div>
        )}
        {!loading && userID && error && (
          <div className="mt-6 text-sm text-red-400">{error}</div>
        )}
        {!loading && userID && grid}

        {/* footer buttons */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/import"
            className="rounded-lg bg-[#ffd700] px-4 py-2 text-black text-sm font-semibold shadow-[0_0_18px_rgba(255,215,0,0.35)] hover:shadow-[0_0_28px_rgba(255,215,0,0.55)] transition"
          >
            Import Image
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-200 hover:border-[#ffd700] hover:text-[#ffd700] transition"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </main>
  );
}
