from fastapi import APIRouter, Body, HTTPException, Response
from services.render import render_text_to_image, render_text_simple
from services.gemini import analyze_text
import base64
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/image")
async def render_image(payload: dict = Body(...)):
    """Render a JSON payload with fields:
    - text (required)
    - font_family (optional) path to TTF
    - font_size (optional) int
    - max_width (optional) int
    Returns PNG image bytes with content-type image/png
    """
    text = payload.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="Missing text field")

    font_family = payload.get("font_family")
    font_size = int(payload.get("font_size", 18))
    max_width = int(payload.get("max_width", 700))
    replace_literal_newlines = bool(payload.get("replace_literal_newlines", True))
    collapse_newlines = bool(payload.get("collapse_newlines", False))
    text_color = payload.get("text_color", "black")
    bg_color = payload.get("bg_color", "white")
    max_chars = int(payload.get("max_chars", 5000))
    use_gemini = bool(payload.get("use_gemini", False))
    top_n = int(payload.get("top_n_keywords", 10))

    try:
        # If caller wants a very simple quick rendering (no wrapping), use the simple renderer
        simple = payload.get("simple", True)

        bold_keywords = None
        subject = None
        if use_gemini:
            analysis = analyze_text(text, top_n=top_n)
            subject = analysis.get("subject")
            bold_keywords = analysis.get("keywords")

        if simple:
            png_bytes = render_text_simple(
                text,
                font_family=font_family,
                font_size=font_size,
                bg_color=bg_color,
                text_color=text_color,
                bold_keywords=bold_keywords,
            )
        else:
            # advanced renderer currently doesn't support keyword bolding; fallback to normal render
            png_bytes = render_text_to_image(
                text,
                font_family=font_family,
                font_size=font_size,
                max_width=max_width,
                replace_literal_newlines=replace_literal_newlines,
                collapse_newlines=collapse_newlines,
                max_chars=max_chars,
                text_color=text_color,
                bg_color=bg_color,
            )
        # If caller asks for analysis metadata returned, package as JSON with base64 image
        return_analysis = bool(payload.get("return_analysis", False))
        if return_analysis:
            body_b64 = base64.b64encode(png_bytes).decode('ascii')
            return JSONResponse({
                'image_base64': body_b64,
                'analysis': {
                    'subject': subject,
                    'keywords': bold_keywords,
                }
            })
        return Response(content=png_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# PDF endpoint removed — PNG rendering only
