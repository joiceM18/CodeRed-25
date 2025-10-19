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
    # also try bold variants if name ends with 'bold' requested elsewhere
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


def _resolve_bold_font(normal_font_path: str):
    """Given a normal font path or family, attempt to return a bold variant path.

    Heuristic: if provided a path that ends with '.ttf', try to find sibling files
    with 'bd' or 'bold' in name. On Windows fonts folder, look for common bold names.
    Returns None if not found.
    """
    if not normal_font_path:
        return None
    # if a family name was provided rather than path, try common bold names
    lower = normal_font_path.lower()
    # common windows bold paths
    if sys.platform.startswith("win"):
        candidates = [
            lower.replace('.ttf', 'bd.ttf'),
            lower.replace('.ttf', 'b.ttf'),
            lower.replace('.ttf', 'bold.ttf'),
        ]
        for c in candidates:
            if os.path.isfile(c):
                return c

    # sibling search if given a real path
    try:
        base = os.path.splitext(normal_font_path)[0]
        dirn = os.path.dirname(normal_font_path)
        possible = [
            os.path.join(dirn, base + 'bd.ttf'),
            os.path.join(dirn, base + 'b.ttf'),
            os.path.join(dirn, base + '-Bold.ttf'),
            os.path.join(dirn, base + 'Bold.ttf'),
        ]
        for p in possible:
            if os.path.isfile(p):
                return p
    except Exception:
        pass
    return None


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
    subject: str = None,
    bold_keywords: list = None,
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

    # try to resolve a bold font variant
    bold_font = None
    try:
        if font_path:
            bold_path = _resolve_bold_font(font_path)
            if bold_path:
                bold_font = ImageFont.truetype(bold_path, size=font_size)
    except Exception:
        bold_font = None

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

    # If subject header requested, draw it first
    if subject:
        header_text = f"Subject: {subject}"
        # use slightly larger font for header if possible
        try:
            header_font = ImageFont.truetype(font_path, size=int(font_size * 1.15)) if font_path else ImageFont.load_default()
        except Exception:
            header_font = ImageFont.load_default()
        draw.text((10, y), header_text, font=header_font, fill=text_color)
        y += int(font_size * 1.6)

    def _draw_line_with_bolding(draw_obj, x_start, y_pos, line_text, font_obj, bold_font_obj, keywords, fill):
        """Draw a line by tokens, supporting multi-word keyword bolding.

        Approach: tokenize by spaces, then use a sliding window to check for
        multi-word (bigram, trigram, etc.) keyword matches. When matched, render
        the entire span in bold.
        """
        if not keywords:
            draw_obj.text((x_start, y_pos), line_text, font=font_obj, fill=fill)
            return

        # Normalize keywords to lower-case, split to word arrays
        lower_keys = [k.lower() for k in keywords if k]
        key_word_lists = [k.split() for k in lower_keys]
        max_k_len = max((len(lst) for lst in key_word_lists), default=1)

        raw_tokens = line_text.split(' ')
        tokens = [t for t in raw_tokens if t is not None]

        def clean_token(tok: str) -> str:
            return tok.lower().strip(".,;:()[]{}\"'`!?-")

        x = x_start
        i = 0
        n = len(tokens)
        while i < n:
            matched = False
            # try longest keywords first
            for span in range(min(max_k_len, n - i), 0, -1):
                window = tokens[i:i+span]
                cleaned = [clean_token(t) for t in window]
                if any(cleaned == kw for kw in key_word_lists):
                    word = ' '.join(window)
                    used_font = bold_font_obj if bold_font_obj else font_obj
                    if bold_font_obj:
                        draw_obj.text((x, y_pos), word, font=bold_font_obj, fill=fill)
                    else:
                        # draw with a subtle outline to simulate stronger bold
                        outline = [(0,0), (1,0), (0,1), (1,1)]
                        for dx, dy in outline:
                            draw_obj.text((x+dx, y_pos+dy), word, font=font_obj, fill=fill)
                    # advance x by rendered width + a space width using the same font used
                    x += draw_obj.textlength(word, font=used_font)
                    x += draw_obj.textlength(' ', font=used_font)
                    i += span
                    matched = True
                    break
            if not matched:
                tok = tokens[i]
                draw_obj.text((x, y_pos), tok, font=font_obj, fill=fill)
                x += draw_obj.textlength(tok + ' ', font=font_obj)
                i += 1

    for line in wrapped_lines:
        _draw_line_with_bolding(draw, 10, y, line, font, bold_font, bold_keywords, text_color)
        y += line_height

    # Crop to content
    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)

    buf = BytesIO()
    image.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


def render_text_simple(text: str, font_family: str = None, font_size: int = 20, bg_color: str = "white", text_color: str = "black", bold_keywords: list = None) -> bytes:
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
        if bold_keywords:
            # naive: split line into tokens and draw bold for tokens that match keywords
            tokens = line.split(' ')
            x = 10
            for tok in tokens:
                draw_text = tok
                is_bold = any(tok.lower().strip('.,;:') == k.lower() for k in bold_keywords)
                if is_bold:
                    # draw bold by drawing twice with 1px offset
                    draw.text((x, y), draw_text, font=font, fill=text_color)
                    draw.text((x+1, y), draw_text, font=font, fill=text_color)
                else:
                    draw.text((x, y), draw_text, font=font, fill=text_color)
                x += int(draw.textlength(tok + ' ', font=font))
        else:
            draw.text((10, y), line, font=font, fill=text_color)
        y += line_height

    buf = BytesIO()
    image.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()
