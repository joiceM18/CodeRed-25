import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-white">
      {/* top bar */}
      <header className="mx-auto max-w-7xl px-6 pt-10">
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-[#ffd700]">Textify</span> • My Profile
          </h1>

          {/* initials badge */}
          <div
            aria-label="User initials"
            className="h-12 w-12 rounded-full border border-neutral-700/80 grid place-items-center text-sm font-medium text-neutral-200 bg-neutral-900/60 shadow-[0_0_15px_rgba(255,215,0,0.15)]"
          >
            DS
          </div>
        </div>
      </header>

      {/* content */}
      <div className="mx-auto max-w-7xl px-6 pb-16">
        {/* subjects row */}
        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {["Algorithms", "Linear Algebra", "Databases"].map((title, i) => (
            <article
              key={i}
              className="rounded-2xl border border-neutral-800/70 bg-neutral-900/60 p-5 shadow-[0_0_25px_rgba(255,215,0,0.12)]"
            >
              <h3 className="text-base font-semibold text-neutral-100">
                <span className="border-b-2 border-[#ffd700] pb-0.5">{title}</span>
              </h3>

              <div className="mt-4 flex gap-3">
                {/* will become image buttons later */}
                <Link
                  href="#"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-sm text-neutral-200 hover:border-[#ffd700] hover:text-[#ffd700] transition"
                >
                  input
                </Link>
                <Link
                  href="#"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-sm text-neutral-200 hover:border-[#ffd700] hover:text-[#ffd700] transition"
                >
                  output
                </Link>
              </div>

              {/* note area */}
              <div className="mt-4 rounded-xl border border-neutral-800/60 bg-neutral-950/50 p-4 text-sm text-neutral-300">
                Quick notes or progress can show here. You can swap this for stats later.
              </div>
            </article>
          ))}
        </section>

        {/* resource grid */}
        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-neutral-800/70 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(255,215,0,0.08)]"
            >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ffd700]/10 blur-2xl transition group-hover:scale-110" />
              <h4 className="text-neutral-200 font-medium">Resource {i + 1}</h4>
              <p className="mt-2 text-sm text-neutral-400">
                Add summaries, saved cards, or quick links. Replace this with live data later.
              </p>

              <div className="mt-4 flex gap-3">
                <Link
                  href="#"
                  className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 hover:border-[#ffd700] hover:text-[#ffd700] transition"
                >
                  Open
                </Link>
                <Link
                  href="#"
                  className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 hover:border-[#ffd700] hover:text-[#ffd700] transition"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </section>

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
