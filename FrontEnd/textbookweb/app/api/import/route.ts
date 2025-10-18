import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return new NextResponse("Missing file", { status: 400 });

  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  let mediaType = "";
  if (type === "application/pdf" || name.endsWith(".pdf")) mediaType = "application/pdf";
  else if (type === "image/svg+xml" || name.endsWith(".svg")) mediaType = "image/svg+xml";
  else if (type === "image/png" || name.endsWith(".png")) mediaType = "image/png";
  else if (type === "video/mpeg" || name.endsWith(".mpg") || name.endsWith(".mpeg")) mediaType = "video/mpeg";
  else return new NextResponse("Only PDF, SVG, PNG, or MPG supported", { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mediaType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      "Cache-Control": "no-store",
    },
  });
}
