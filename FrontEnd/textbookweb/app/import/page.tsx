"use client";

import { useState } from "react";
import ImportButton from "@/components/import";

/**
 * Left: Import & Preview (dataURL from ImportButton)
 * Right: Convert via your /api/convert and show rendered image (base64 -> dataURL)
 */
export default function Home() {
  // LEFT (image preview as data URL)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // RIGHT (convert controls + result)
  const [fontFamily, setFontFamily] = useState("Times New Roman (times)");
  const [customTtf, setCustomTtf] = useState("");
  const [fontSize, setFontSize] = useState<number | "">("");
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // helper: turn dataURL from left pane into a File for the API
  async function dataUrlToFile(dataUrl: string, name = "upload.png"): Promise<File> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const type = blob.type || "image/png";
    return new File([blob], name, { type });
  }

  async function handleConvert() {
    if (!previewSrc) {
      setErr("Please import a file on the left first.");
      return;
    }
    setErr(null);
    setBusy(true);
    setRenderedImage(null);

    try {
      // Build the multipart body from the left preview
      const file = await dataUrlToFile(previewSrc, "source.png");
      const form = new FormData();
      form.set("file", file);
      form.set("fontFamily", fontFamily);
      if (customTtf.trim()) form.set("customTtf", customTtf.trim());
      form.set("fontSize", String(fontSize || 18));
      form.set("useGemini", "true");
      form.set("simple", "false");

      const res = await fetch("/api/convert", { method: "POST", body: form });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Convert failed");
      }

      const data = await res.json();
      const base64 = data?.image_base64 as string | undefined;
      if (!base64) throw new Error("No image returned from convert API.");

      setRenderedImage(`data:image/png;base64,${base64}`);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Conversion failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-neutral-100"
      aria-label="Import page"
    >
      {/* background bubbles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-16 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl animate-pulse" />
        <div className="absolute top-28 -right-10 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl animate-pulse [animation-delay:800ms]" />
        <div className="absolute bottom-16 left-1/3 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse [animation-delay:1600ms]" />
        <div className="absolute inset-0 bg-[radial-gradient(transparent,rgba(0,0,0,0.6))]" />
      </div>

      {/* header */}
      <header className="relative z-10 flex flex-col items-center text-center px-6 pt-10 sm:pt-16">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-purple-300 drop-shadow-[0_0_10px_rgba(167,139,250,0.30)]">
          Import Your Data
        </h1>
        <p className="mt-3 text-base sm:text-lg text-neutral-300 max-w-2xl">
          Upload and transform your files with ease. Support for CSV, Excel, and more.
        </p>
      </header>

      {/* two equal cards */}
      <section className="relative z-10 mt-10 px-6 pb-16">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-2 items-start">
          {/* LEFT: Upload & Preview */}
          <div className="rounded-3xl border border-white/10 bg-neutral-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_45px_rgba(167,139,250,0.18)]">
            <div className="mb-6 flex items-center gap-3 text-neutral-200">
              <svg className="h-6 w-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="font-medium">Upload &amp; Preview</span>
            </div>

            <ImportButton onPreview={setPreviewSrc} />

            {/* matching media box height with right side */}
            <div className="mt-6 rounded-xl border border-white/10 bg-black/60 p-4 flex justify-center items-center h-[420px]">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt="Selected preview"
                  className="max-h-full max-w-full object-contain rounded-md"
                />
              ) : (
                <div className="text-sm text-neutral-400">No file yet. Click “Import”.</div>
              )}
            </div>
          </div>

          {/* RIGHT: Convert + Rendered Image */}
          <div className="rounded-3xl border border-white/10 bg-neutral-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_55px_rgba(167,139,250,0.25)]">
            <div className="mb-6 flex items-center gap-3 text-neutral-200">
              <svg className="h-6 w-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Convert</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="col-span-2 text-sm text-neutral-300">
                Font family
                <select
                  className="mt-1 w-full rounded-lg border border-purple-500/50 bg-neutral-900 px-3 py-2 outline-none focus:border-purple-400"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                >
                  <option>Times New Roman (times)</option>
                  <option>Arial</option>
                  <option>Georgia</option>
                  <option>Courier New</option>
                  <option>Inter</option>
                </select>
              </label>

              <label className="col-span-2 text-sm text-neutral-300">
                Custom TTF path (optional)
                <input
                  className="mt-1 w-full rounded-lg border border-purple-500/40 bg-neutral-900 px-3 py-2 outline-none focus:border-purple-400 placeholder-neutral-500"
                  placeholder="C:\\Windows\\Fonts\\arial.ttf"
                  value={customTtf}
                  onChange={(e) => setCustomTtf(e.target.value)}
                />
              </label>

              <label className="text-sm text-neutral-300">
                Font size
                <input
                  type="number"
                  min={8}
                  className="mt-1 w-full rounded-lg border border-purple-500/40 bg-neutral-900 px-3 py-2 outline-none focus:border-purple-400 placeholder-neutral-500"
                  placeholder="18"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </label>

              <div className="flex items-end">
                <button
                  onClick={handleConvert}
                  disabled={busy || !previewSrc}
                  className="w-full rounded-lg bg-[#c084fc] px-4 py-2 font-semibold text-black transition hover:bg-[#d8b4fe] shadow-[0_0_22px_rgba(192,132,252,0.45)] disabled:opacity-60"
                >
                  {busy ? "Converting…" : "Convert to text"}
                </button>
              </div>

              {err && <div className="col-span-2 text-sm text-red-400">{err}</div>}

              {/* Rendered image – SAME HEIGHT as left box */}
              <div className="col-span-2">
                <label className="text-sm text-neutral-300 mb-2 block">Rendered image</label>
                <div className="rounded-xl border border-white/10 bg-black/60 p-4 flex justify-center items-center h-[420px]">
                  {renderedImage ? (
                    <img
                      src={renderedImage}
                      alt="Rendered"
                      className="max-h-full max-w-full object-contain rounded-md"
                    />
                  ) : (
                    <div className="text-sm text-neutral-400">
                      Nothing rendered yet. Click “Convert to text”.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* end right */}
        </div>
      </section>
    </main>
  );
}
