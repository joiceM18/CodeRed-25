"use client";

import { saveTextbook } from "../lib/saveTextbook";
import { getUser } from "../lib/userStore";
import { useRouter } from "next/navigation";

// components/ImportButton.tsx

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

type Kind = "pdf" | "svg" | "video" | "png" |null;

export default function ImportButton() {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMsg, setSaveMsg] = useState<string>("");
  const router = useRouter();
  // Get user from localStorage
  const [userID, setUserID] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (user && user.userId) {
      setUserID(Number(user.userId));
      setLoading(false);
    } else {
      setLoading(true);
      setTimeout(() => {
        router.push("/");
      }, 800);
    }
  }, [router]);

  async function onSaveTextbook() {
    if (!objectURL || !renderedImage || !analysis?.subject) {
      setSaveStatus("error");
      setSaveMsg("Missing required data to save textbook.");
      return;
    }
    if (!userID) {
      setSaveStatus("error");
      setSaveMsg("Not logged in. Please sign in again.");
      setTimeout(() => router.push("/"), 1000);
      return;
    }
    setSaveStatus("saving");
    setSaveMsg("");
    try {
      // textbook_input: original image (objectURL or base64), textbook_output: renderedImage (base64), subject, userID
      // We'll use the base64 PNG for both for now
      const inputBase64 = objectURL.startsWith("data:") ? objectURL.split(",")[1] : objectURL;
      const outputBase64 = renderedImage.split(",")[1];
      const resp = await saveTextbook({
        textbook_input: inputBase64,
        textbook_output: outputBase64,
        subject: analysis.subject || "",
        userID,
        is_public: true
      });
      if (resp.success) {
        setSaveStatus("saved");
        setSaveMsg(`Saved! textbookID: ${resp.textbookID}`);
      } else {
        setSaveStatus("error");
        setSaveMsg(resp.message || "Failed to save textbook.");
      }
    } catch (e: any) {
      setSaveStatus("error");
      setSaveMsg(e?.message || "Failed to save textbook.");
    }
  }
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [objectURL, setObjectURL] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>(null);
  const [renderedImage, setRenderedImage] = useState<string | null>(null); // data URL of PNG from backend
  const [analysis, setAnalysis] = useState<{ subject?: string; keywords?: string[] } | null>(null);
  const [fontFamily, setFontFamily] = useState<string>("segoeui");
  const [fontSize, setFontSize] = useState<number>(18);
  const [showZoom, setShowZoom] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [objectURL]);

  function openPicker() {
    inputRef.current?.click();
  }

  function guessKindFromName(name: string): Kind {
    const n = name.toLowerCase();
    if (n.endsWith(".pdf")) return "pdf";
    if (n.endsWith(".svg")) return "svg";
    if (n.endsWith(".png")) return "png";
    if (n.endsWith(".mpg") || n.endsWith(".mpeg")) return "video";
    return null;
    }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setMessage("");
    setStatus("idle");
    setKind(guessKindFromName(file.name));
    if (objectURL) {
      URL.revokeObjectURL(objectURL);
      setObjectURL(null);
    }
  }

  async function onImport() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    try {
      setStatus("uploading");
      setMessage("");

      const formData = new FormData();
      formData.set("file", file);

      // If API is in the same Next.js app:
      const res = await fetch("/api/import", { method: "POST", body: formData });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Upload failed");
      }

      const ct = res.headers.get("content-type") || "";
      let k: Kind = null;
      if (ct.includes("application/pdf")) k = "pdf";
      else if (ct.includes("image/svg+xml")) k = "svg";
      else if (ct.includes("image/png")) k = "png";
      else if (ct.includes("video/mpeg")) k = "video";
      else k = guessKindFromName(file.name); // fallback

      const blob = await res.blob();
      console.log("content-type:", ct, "blob.size:", blob.size);
      if (blob.size === 0) throw new Error("Empty response from server.");

      const url = URL.createObjectURL(blob);
      setObjectURL(url);
      setKind(k);
      setStatus("done");
      setMessage(`${file.name} ready.`);
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message ?? "Something went wrong.");
    }
  }

  async function onConvertToText() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    try {
      setStatus("uploading");
      setMessage("");
      setRenderedImage(null);
      setAnalysis(null);

      const form = new FormData();
      form.set("file", file);
      form.set("fontFamily", fontFamily);
      form.set("fontSize", String(fontSize));
      form.set("useGemini", "true");
      form.set("simple", "false"); // use advanced renderer for wrapping + header

      const res = await fetch("/api/convert", { method: "POST", body: form });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Convert failed");
      }
      const data = await res.json();
      const base64 = data?.image_base64 as string;
      const analysisMeta = data?.analysis as { subject?: string; keywords?: string[] };
      if (!base64) throw new Error("No image returned");
      setRenderedImage(`data:image/png;base64,${base64}`);
      setAnalysis(analysisMeta || null);
      setStatus("done");
      setMessage("Converted.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message ?? "Something went wrong.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        <span className="ml-4 text-lg text-yellow-300">Checking login…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.svg,.mpg,.mpeg,.png"
        className="hidden"
        onChange={onPick}
      />

      <div className="flex gap-2">
        <button onClick={openPicker} className="rounded-xl px-4 py-2 border">Import…</button>
        <button
          onClick={onImport}
          disabled={!fileName || status === "uploading"}
          className="rounded-xl px-4 py-2 border disabled:opacity-50"
        >
          {status === "uploading" ? "Importing…" : "Show"}
        </button>

      </div>

      {fileName && <div>Selected: <b>{fileName}</b></div>}
      {message && (
        <div className={status === "error" ? "text-red-600" : status === "done" ? "text-green-600" : ""}>
          {message}
        </div>
      )}

      

      {/* Your viewer blocks (you already have these) */}
      {objectURL && kind === "pdf" && (
        <object data={objectURL} type="application/pdf" className="w-full h-[560px]">
          <embed src={objectURL} type="application/pdf" className="w-full h-[560px]" />
          <p className="p-3 text-sm">Can’t display the PDF inline.</p>
        </object>
      )}

      {objectURL && (
        <div className="flex gap-4 items-start justify-center mt-4">
            {/* Left side: the imported file */}
            <div className="flex-1 max-w-[75%]">
            {kind === "pdf" && (
                <object data={objectURL} type="application/pdf" className="w-full h-[560px]" />
            )}
            {kind === "svg" && (
                <img src={objectURL} alt={fileName} className="w-full h-auto" />
            )}
            {kind === "png" && (
                <img src={objectURL} alt={fileName} className="w-full h-auto" />
            )}
            {kind === "video" && (
                <video src={objectURL} controls className="w-full max-h-[560px]" />
            )}
        </div>

        {/* Right side: Convert button + empty box */}
        <div className="flex flex-col justify-start items-center gap-4">
        <div className="flex flex-col gap-2 w-64">
          <label className="text-sm">Font family</label>
          <select
            className="rounded border px-2 py-1 text-black"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            <option value="segoeui">Segoe UI (segoeui)</option>
            <option value="arial">Arial (arial)</option>
            <option value="times">Times New Roman (times)</option>
            <option value="calibri">Calibri (calibri)</option>
            <option value="dejavusans">DejaVu Sans (dejavusans)</option>
          </select>
          <label className="text-xs opacity-80">Custom TTF path (optional)</label>
          <input
            className="rounded border px-2 py-1 text-black"
            placeholder="C:\\Windows\\Fonts\\arial.ttf"
            onBlur={(e) => {
              if (e.target.value.trim()) setFontFamily(e.target.value.trim());
            }}
          />
          <label className="text-sm">Font size</label>
          <input
            className="rounded border px-2 py-1 text-black"
            type="number"
            value={fontSize}
            min={10}
            max={48}
            onChange={(e) => setFontSize(parseInt(e.target.value || "18", 10))}
          />
          <button
            onClick={onConvertToText}
            className="rounded-xl px-4 py-2 border hover:bg-gray-800 transition mt-2 disabled:opacity-50"
            disabled={!fileName || status === "uploading"}
          >
            {status === "uploading" ? "Converting…" : "Convert to text"}
          </button>
        </div>

            <div className="w-72 min-h-40 border border-gray-600 rounded-xl bg-black/10 p-2">
              {renderedImage ? (
                <img
                  src={renderedImage}
                  alt="Rendered"
                  className="w-full h-auto cursor-zoom-in"
                  onClick={() => setShowZoom(true)}
                />
              ) : (
                <div className="text-sm text-gray-300 p-3">Rendered image will appear here.</div>
              )}
              {analysis && (
                <div className="mt-2 text-xs text-left">
                  <div><b>Subject:</b> {analysis.subject ?? "(unknown)"}</div>
                  {analysis.keywords?.length ? (
                    <div><b>Keywords:</b> {analysis.keywords.join(", ")}</div>
                  ) : null}
                  <button
                    className="mt-2 rounded px-3 py-1 border bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    onClick={onSaveTextbook}
                    disabled={saveStatus === "saving"}
                  >
                    {saveStatus === "saving" ? "Saving..." : "Save to Library"}
                  </button>
                  {saveMsg && (
                    <div className={saveStatus === "saved" ? "text-green-600" : "text-red-600"}>{saveMsg}</div>
                  )}
                </div>
              )}
            </div>

            {showZoom && renderedImage && (
              <div
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
                onClick={() => setShowZoom(false)}
              >
                <img
                  src={renderedImage}
                  alt="Rendered Zoom"
                  className="max-w-[95vw] max-h-[90vh] object-contain cursor-zoom-out"
                />
              </div>
            )}
        </div>
        </div>
      )}

      {/* Go to Profile button */}
      <div className="mt-6 flex justify-end">
        <Link
          href="/profile"
          className="rounded-lg bg-[#ffd700] px-4 py-2 text-black text-sm font-semibold shadow hover:shadow-lg transition"
        >
          Go to Profile
        </Link>
      </div>
    </div>
  );
}
