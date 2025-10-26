"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ImportButton from "@/components/import";
import { saveTextbook } from "@/lib/saveTextbook";
import { getUser } from "@/lib/userStore";

export default function Home() {
  // LEFT: preview (data URL produced by ImportButton)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");


  // RIGHT: convert controls + result
  const [fontFamily, setFontFamily] = useState("Times New Roman (times)");
  const [customTtfFile, setCustomTtfFile] = useState<File | null>(null);
  const [fontSize, setFontSize] = useState<string>("");
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Meta + save
  const [subject, setSubject] = useState("");
  const [keywords, setKeywords] = useState("");
  const [userID, setUserID] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    const u = getUser?.();
    if (u?.userId) setUserID(Number(u.userId));
  }, []);

  // helpers
  async function dataUrlToFile(dataUrl: string, name = "source.png"): Promise<File> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const type = blob.type || "image/png";
    return new File([blob], name, { type });
  }

  function stripDataUrlPrefix(dataUrl: string) {
    return dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  }

  // Convert (RIGHT)
  async function handleConvert() {
    if (!previewSrc) {
      setErr("Please import a file on the left first.");
      return;
    }
    setErr(null);
    setBusy(true);
    setRenderedImage(null);

    try {
      const file = await dataUrlToFile(previewSrc, "source.png");

      const form = new FormData();
      form.set("file", file);
      form.set("fontFamily", fontFamily);
      if (customTtfFile) form.set("customTtfFile", customTtfFile);
      form.set("fontSize", String(parseInt(fontSize || "18", 10)));

      form.set("useGemini", "true");
      form.set("simple", "false");

      const res = await fetch("/api/convert", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.text()) || "Convert failed");

      const data = await res.json();
      const base64 = data?.image_base64 as string | undefined;

      const ocrText =
        (data?.extracted_text as string) ||
        (data?.text as string) ||                  // fallback if backend returns text at top-level
        (data?.analysis?.raw_text as string) || ""; 
      if (!base64) throw new Error("No image returned from convert API.");
      setRenderedImage(`data:image/png;base64,${base64}`);
      setExtractedText(ocrText);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Conversion failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Save to Library (RIGHT)
  async function handleSave() {
    try {
      if (!userID) throw new Error("Not logged in.");
      if (!previewSrc || !renderedImage) throw new Error("Nothing to save yet.");
      if (!subject.trim()) throw new Error("Subject is required.");

      setSaveStatus("saving");
      setSaveMsg("");

      const inputBase64 = stripDataUrlPrefix(previewSrc);
      const outputBase64 = stripDataUrlPrefix(renderedImage);

      const resp = await saveTextbook({
        textbook_input: inputBase64,
        textbook_output: outputBase64,
        subject,
        userID,
        is_public: true,
        keywords,
      });

      if (resp?.success) {
        setSaveStatus("saved");
        setSaveMsg(`Saved! textbookID: ${resp.textbookID}`);
      } else {
        setSaveStatus("error");
        setSaveMsg(resp?.message || "Failed to save textbook.");
      }
    } catch (e: any) {
      setSaveStatus("error");
      setSaveMsg(e?.message || "Failed to save textbook.");
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

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
          style={{ cursor: 'pointer' }}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white text-4xl font-light hover:text-purple-300 transition"
            style={{ cursor: 'pointer' }}
          >
            ×
          </button>
          <img
            src={lightboxImage}
            alt="Fullscreen preview"
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* header + top-right profile */}
      <header className="relative z-10 px-6 pt-10 sm:pt-16">
        <div className="mx-auto flex w-full max-w-7xl items-start">
          <div className="flex-1 text-center">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-purple-300 drop-shadow-[0_0_10px_rgba(167,139,250,0.30)]">
              Import Your Data
            </h1>
            <p className="mt-3 text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto">
              Upload and transform your files with ease. Support for CSV, Excel, and more.
            </p>
          </div>

          {/* top-right purple button */}
          <div className="absolute right-6 top-6 sm:right-8 sm:top-8">
            <Link
              href="/profile"
              className="rounded-lg bg-[#c084fc] hover:bg-[#d8b4fe] px-4 py-2 text-black text-sm font-semibold shadow-[0_0_18px_rgba(192,132,252,0.35)] transition"
            >
              Go to Profile
            </Link>
          </div>
        </div>
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

            <div className="mt-6 rounded-xl border border-white/10 bg-black/60 p-4 flex justify-center items-center h-[420px]">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt="Selected preview"
                  className="max-h-full max-w-full object-contain rounded-md hover:opacity-90 transition"
                  onClick={() => setLightboxImage(previewSrc)}
                  style={{ cursor: 'pointer' }}
                />
              ) : (
                <div className="text-sm text-neutral-400">No file yet. Click "Import".</div>
              )}
            </div>
          </div>

          {/* RIGHT: Convert + Rendered + Meta + Save */}
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
                Custom font (.ttf or .otf, optional)
                <input
                  type="file"
                  accept=".ttf,.otf"
                  className="mt-1 w-full rounded-lg border border-purple-500/40 bg-neutral-900 px-3 py-2 outline-none focus:border-purple-400"
                  onChange={(e) => setCustomTtfFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <label className="text-sm text-neutral-300">
                Font size
                <input
                  type="number"
                  min={8}
                  className="mt-1 w-full rounded-lg border border-purple-500/40 bg-neutral-900 px-3 py-2 outline-none focus:border-purple-400"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
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

              {/* Rendered image – same height as left */}
              <div className="col-span-2">
                <label className="text-sm text-neutral-300 mb-2 block">Rendered image</label>
                <div className="rounded-xl border border-white/10 bg-black/60 p-4 flex justify-center items-center h-[420px]">
                  {renderedImage ? (
                    <img
                      src={renderedImage}
                      alt="Rendered"
                      className="max-h-full max-w-full object-contain rounded-md hover:opacity-90 transition"
                      onClick={() => setLightboxImage(renderedImage)}
                      style={{ cursor: 'pointer' }}
                    />
                  ) : (
                    <div className="text-sm text-neutral-400">Nothing rendered yet. Click "Convert to text".</div>
                  )}
                </div>
              </div>

              {/* Subject + Keywords + Save */}
              <label className="text-sm text-neutral-300">
                Subject
                <input
                  className="mt-1 w-full rounded-lg border border-purple-500/40 bg-neutral-900 px-3 py-2 outline-none focus:border-purple-400"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </label>

              <div>
               <label className="text-sm text-neutral-300 w-full">
                  Extracted Text
                  <textarea
                    readOnly
                    value={extractedText}
                    className="mt-1 w-full rounded-lg border border-purple-500/40 bg-neutral-900 px-3 py-2 outline-none focus:border-purple-400 text-neutral-200"
                    rows={6}
                    placeholder="No text extracted yet..."
                  />
                </label>


              </div>

              

              <label className="text-sm text-neutral-300">
                Keywords
                <input
                  className="mt-1 w-full rounded-lg border border-purple-500/40 bg-neutral-900 px-3 py-2 outline-none focus:border-purple-400"
                  placeholder="comma, separated, tags"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </label>

              <div className="col-span-2 flex justify-end gap-3">
                <button
                  onClick={handleSave}
                  disabled={saveStatus === "saving"}
                  className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-neutral-200 backdrop-blur-sm hover:bg-white/15 disabled:opacity-60"
                >
                  {saveStatus === "saving" ? "Saving…" : "Save to Library"}
                </button>
              </div>

              {saveMsg && (
                <div
                  className={`col-span-2 text-sm ${
                    saveStatus === "saved" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {saveMsg}
                </div>
              )}
            </div>
          </div>
          {/* end right */}
        </div>
      </section>
    </main>
  );
}