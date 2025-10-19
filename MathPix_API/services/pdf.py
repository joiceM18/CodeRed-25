from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from .render import _resolve_font_family


def text_to_pdf_bytes(text: str, font_family: str = None, font_size: int = 12, page_size: str = "A4") -> bytes:
    """Render plain text into a simple PDF where the text is selectable.

    - font_family: can be a family name or a path to a TTF. If a path or family is found, register the TTF.
    - page_size: 'A4' or 'LETTER'
    """
    pagesize = A4 if page_size.upper() == "A4" else letter
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=pagesize)

    # Resolve font
    font_path = None
    if font_family:
        font_path = _resolve_font_family(font_family)
    if font_path and os.path.isfile(font_path):
        try:
            pdfmetrics.registerFont(TTFont("CustomFont", font_path))
            font_name = "CustomFont"
        except Exception:
            font_name = "Helvetica"
    else:
        font_name = "Helvetica"

    c.setFont(font_name, font_size)

    # Simple layout: left margin and line spacing
    width, height = pagesize
    margin = 40
    y = height - margin
    line_height = font_size * 1.2

    for raw_line in text.splitlines():
        # If y is too low, start new page
        if y < margin + line_height:
            c.showPage()
            c.setFont(font_name, font_size)
            y = height - margin
        # Draw the line
        c.drawString(margin, y, raw_line)
        y -= line_height

    c.save()
    buf.seek(0)
    return buf.read()
