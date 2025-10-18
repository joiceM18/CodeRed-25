// components/ImportButton.tsx
"use client";

import { useRef, useState, useEffect } from "react";

type Kind = "pdf" | "svg" | "video" | "png" |null;

export default function ImportButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [objectURL, setObjectURL] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>(null);

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
        <button
            onClick={() => console.log("Convert to text clicked!")}
            className="rounded-xl px-4 py-2 border hover:bg-gray-800 transition"
        >
            Convert to text
        </button>

            {/* Empty box placeholder */}
            <div className="w-64 h-40 border border-gray-600 rounded-xl bg-black/20 flex items-center justify-center">
                {/* You can put text or content here later */}
            </div>
        </div>
        </div>
    )}
    </div>
    
  );
}
