import os
import base64
import imghdr
import httpx
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://api.mathpix.com/v3/text"


def _image_bytes_to_data_uri(image_bytes: bytes) -> str:
    """Convert raw image bytes to a data URI with an inferred image type.

    imghdr.what() can sometimes return None; default to jpeg in that case.
    """
    kind = imghdr.what(None, h=image_bytes) or "jpeg"
    b64 = base64.b64encode(image_bytes).decode("ascii")
    return f"data:image/{kind};base64,{b64}"


def _extract_text_from_result(result: dict) -> str:
    """Try to extract a reasonable text/plain result from MathPix JSON.

    MathPix responses can include multiple fields; try common ones and
    fallback to an empty string.
    """
    # Common possible fields
    for key in ("text", "text_plain", "text_normalized", "text_detected"):
        val = result.get(key)
        if val:
            return val if isinstance(val, str) else str(val)

    # Some responses put extracted text under 'data' or 'blocks'
    if isinstance(result.get("data"), dict):
        data = result.get("data")
        for key in ("text", "text_plain"):
            val = data.get(key)
            if val:
                return val if isinstance(val, str) else str(val)

    # Last resort: return full 'raw_text' or JSON dump
    if result.get("raw_text"):
        return result.get("raw_text")

    return ""


async def process_image(image_bytes: bytes, formats: list = None) -> dict:
    """Send image to MathPix and return parsed JSON response.

    - image_bytes: raw bytes of the image
    - formats: optional list of formats to request (e.g. ["text", "latex_normal"])

    The function will raise RuntimeError if the MathPix keys are not set.
    """
    app_id = os.getenv("MATHPIX_APP_ID")
    app_key = os.getenv("MATHPIX_APP_KEY")
    if not app_id or not app_key:
        raise RuntimeError("MATHPIX_APP_ID and MATHPIX_APP_KEY must be set in environment")

    headers = {
        "app_id": app_id,
        "app_key": app_key,
        "Content-Type": "application/json",
    }

    formats = formats or ["text"]
    data_uri = _image_bytes_to_data_uri(image_bytes)

    payload = {
        "src": data_uri,
        "formats": formats,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(API_URL, headers=headers, json=payload)
        resp.raise_for_status()
        result = resp.json()

    # Attach a convenience 'text' field if possible
    result_text = _extract_text_from_result(result)
    if result_text:
        result["extracted_text"] = result_text

    return result
