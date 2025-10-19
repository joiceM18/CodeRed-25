import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Hardcoded hosted FastAPI (MathPix_API) base URL
const BACKEND = "https://codered-25-webporoject.onrender.com";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const fontFamily = (form.get("fontFamily") as string) || undefined;
    const fontSize = parseInt((form.get("fontSize") as string) || "18", 10);
    const useGemini = String(form.get("useGemini") ?? "true") === "true";
    const simple = String(form.get("simple") ?? "true") === "true";

    if (!(file instanceof File)) {
      return new NextResponse("Missing file", { status: 400 });
    }

    // 1️⃣ OCR: forward the image/pdf file to your backend
    const ocrForm = new FormData();
    ocrForm.set("file", file, file.name);

    const ocrRes = await fetch(`${BACKEND}/api/ocr/extract`, {
      method: "POST",
      body: ocrForm,
    });

    if (!ocrRes.ok) {
      const err = await ocrRes.text();
      return new NextResponse(`OCR failed: ${err}`, { status: ocrRes.status });
    }

    const ocrJson = await ocrRes.json();
    const text = (ocrJson?.text as string) || "";

    // ✅ Print extracted text to the console
    console.log("🟣 Extracted text from OCR:", text);

    if (!text) {
      return new NextResponse("No text extracted", { status: 502 });
    }

    // 2️⃣ Render: send text + settings to Python backend, request JSON response
    const renderBody = {
      text,
      simple,
      use_gemini: useGemini,
      top_n_keywords: 10,
      return_analysis: true,
      font_family: fontFamily,
      font_size: fontSize,
      max_width: 800,
      text_color: "black",
      bg_color: "white",
    };

    const renderRes = await fetch(`${BACKEND}/api/render/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(renderBody),
    });

    if (!renderRes.ok) {
      const err = await renderRes.text();
      return new NextResponse(`Render failed: ${err}`, { status: renderRes.status });
    }

    const renderJson = await renderRes.json();

    // Optionally also log the subject & keywords
    console.log("🟢 Render analysis:", renderJson?.analysis);

    return NextResponse.json(renderJson, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    console.error("❌ /api/convert error:", e);
    return new NextResponse(e?.message ?? "Server error", { status: 500 });
  }
}
