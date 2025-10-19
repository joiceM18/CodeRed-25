from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import textwrap
import os
import sys


def _find_system_font(preferred: str = None):
    """Try to find a reasonable TTF on the system. If preferred is provided,
    return it if exists. Otherwise probe common locations for Arial/DejaVu.
    """
    if preferred and os.path.isfile(preferred):
        return preferred

    # Windows, macOS, Linux common paths
    candidates = []
    if sys.platform.startswith("win"):
        candidates = [
            r"C:\Windows\Fonts\arial.ttf",
            r"C:\Windows\Fonts\segoeui.ttf",
        ]
    elif sys.platform.startswith("darwin"):
        candidates = ["/Library/Fonts/Arial.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf"]
    else:
        candidates = ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"]

    for p in candidates:
        if os.path.isfile(p):
            return p
    return None


def _resolve_font_family(family: str):
    """Resolve a font family name to a TTF path if possible.

    Accepts simple names like 'arial', 'dejavusans', 'times', 'segoeui' and
    returns a likely TTF path on the current OS. Returns None if not found.
    """
    if not family:
        return None
    fam = family.strip().lower()
    # direct path
    if os.path.isfile(family):
        return family

    # mapping
    windows_map = {
        "arial": r"c:\\windows\\fonts\\arial.ttf",
        "segoeui": r"c:\\windows\\fonts\\segoeui.ttf",
        "times": r"c:\\windows\\fonts\\times.ttf",
        "times new roman": r"c:\\windows\\fonts\\times.ttf",
        "calibri": r"c:\\windows\\fonts\\calibri.ttf",
    }
    linux_map = {
        "dejavusans": "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "liberation": "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "noto": "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    }
    mac_map = {
        "arial": "/Library/Fonts/Arial.ttf",
        "dejavusans": "/Library/Fonts/DejaVuSans.ttf",
    }

    if sys.platform.startswith("win"):
        candidate = windows_map.get(fam)
        if candidate and os.path.isfile(candidate):
            return candidate
    elif sys.platform.startswith("darwin"):
        candidate = mac_map.get(fam)
        if candidate and os.path.isfile(candidate):
            return candidate
    else:
        candidate = linux_map.get(fam)
        if candidate and os.path.isfile(candidate):
            return candidate

    # fallback: try find_system_font to return any available system font
    return _find_system_font()


def render_text_to_image(
    text: str,
    font_family: str = None,
    font_size: int = 20,
    max_width: int = 800,
    bg_color: str = "white",
    text_color: str = "black",
    replace_literal_newlines: bool = True,
    collapse_newlines: bool = False,
    max_chars: int = 5000,
) -> bytes:
    """Render given text to a PNG image and return bytes.

    Parameters:
    - text: the text to render (may contain newlines or literal "\\n" sequences)
    - font_family: path to a TTF font file or None to try system fonts
    - font_size: font size in points
    - max_width: maximum image width in pixels (text will wrap by pixel width)
    - replace_literal_newlines: if True, convert literal backslash+n into real newlines
    - collapse_newlines: if True, collapse multiple blank lines into a single newline
    """
    if replace_literal_newlines:
        text = text.replace("\\n", "\n")

    if collapse_newlines:
        # collapse consecutive blank lines
        lines = [line.rstrip() for line in text.splitlines()]
        new_lines = []
        prev_blank = False
        for line in lines:
            is_blank = (line.strip() == "")
            if is_blank and prev_blank:
                continue
            new_lines.append(line)
            prev_blank = is_blank
        text = "\n".join(new_lines)

    # Safety: cap text length to avoid extremely long processing times
    if max_chars and len(text) > max_chars:
        text = text[:max_chars]

    # Choose font: allow family names or file paths
    font_path = None
    if font_family:
        font_path = _resolve_font_family(font_family)
    if not font_path:
        font_path = _find_system_font()

    try:
        if font_path:
            font = ImageFont.truetype(font_path, size=font_size)
        else:
            # load_default ignores size; but we fallback
            font = ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    # prepare drawing and wrap text by pixel width
    line_height = int(font_size * 1.2)
    dummy = Image.new("RGB", (max_width, 10), color=bg_color)
    draw = ImageDraw.Draw(dummy)

    # Word-wrap by pixel width (optimized): precompute word widths and assemble lines
    wrapped_lines = []
    max_content_width = max_width - 20
    for para in text.split("\n"):
        words = para.split()
        if not words:
            wrapped_lines.append("")
            continue

        # precompute widths per word to avoid repeated measuring of combined strings
        word_widths = [draw.textlength(w, font=font) for w in words]
        space_width = draw.textlength(" ", font=font)

        current_line_words = []
        current_width = 0

        for w, w_width in zip(words, word_widths):
            # if single word larger than available width, split it approximately
            if w_width > max_content_width:
                # flush current line
                if current_line_words:
                    wrapped_lines.append(" ".join(current_line_words))
                    current_line_words = []
                    current_width = 0

                # split the long word into chunks by approximate character width
                avg_char = max(1, int(w_width / max(1, len(w))))
                approx_chars = max(1, int(max_content_width / avg_char))
                for chunk in textwrap.wrap(w, width=approx_chars):
                    wrapped_lines.append(chunk)
                continue

            additional = w_width if not current_line_words else (space_width + w_width)
            if current_line_words and (current_width + additional) > max_content_width:
                # flush
                wrapped_lines.append(" ".join(current_line_words))
                current_line_words = [w]
                current_width = w_width
            else:
                if current_line_words:
                    current_line_words.append(w)
                    current_width += (space_width + w_width)
                else:
                    current_line_words = [w]
                    current_width = w_width

        if current_line_words:
            wrapped_lines.append(" ".join(current_line_words))

    # If wrapping produced too many lines, abort early to avoid long processing
    MAX_LINES = 2000
    if len(wrapped_lines) > MAX_LINES:
        raise RuntimeError(f"Rendered output too large ({len(wrapped_lines)} lines). Reduce input size or set a smaller max_chars/max_width.")

    # calculate image size
    img_height = max(100, line_height * (len(wrapped_lines) + 1))
    image = Image.new("RGB", (max_width, img_height), color=bg_color)
    draw = ImageDraw.Draw(image)

    y = 10
    for line in wrapped_lines:
        draw.text((10, y), line, font=font, fill=text_color)
        y += line_height

    # Crop to content
    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)

    buf = BytesIO()
    image.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


def render_text_simple(text: str, font_family: str = None, font_size: int = 20, bg_color: str = "white", text_color: str = "black") -> bytes:
    """Very small/simple renderer: convert literal "\\n" to newlines and draw each line.

    This intentionally does no wrapping and minimal measuring so it's fast.
    """
    # Convert literal escape sequences to real newlines
    text = text.replace("\\n", "\n")

    lines = text.split("\n")

    # choose font (allow family names)
    font_path = None
    if font_family:
        font_path = _resolve_font_family(font_family)
    if not font_path:
        font_path = _find_system_font()

    try:
        if font_path:
            font = ImageFont.truetype(font_path, size=font_size)
        else:
            # Try to use a bundled DejaVuSans if available (Pillow often includes it)
            try:
                font = ImageFont.truetype("DejaVuSans.ttf", size=font_size)
            except Exception:
                font = ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    # measure width and height roughly
    dummy = Image.new("RGB", (10, 10), color=bg_color)
    draw = ImageDraw.Draw(dummy)
    line_height = int(font_size * 1.2)
    max_line_width = 0
    for line in lines:
        w = draw.textlength(line, font=font)
        if w > max_line_width:
            max_line_width = int(w)

    img_width = max(100, max_line_width + 20)
    img_height = max(50, line_height * len(lines) + 20)

    image = Image.new("RGB", (img_width, img_height), color=bg_color)
    draw = ImageDraw.Draw(image)
    y = 10
    for line in lines:
        draw.text((10, y), line, font=font, fill=text_color)
        y += line_height

    buf = BytesIO()
    image.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()
