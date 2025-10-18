import os
import httpx
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://api.mathpix.com/v3/text"

async def process_image(image_bytes: bytes) -> dict:
    """Process an image by sending it to MathPix.

    This function validates that the required env vars exist at runtime and
    raises a clear error if they do not. Doing the check here prevents
    import-time failures (useful when running the app without a `.env` yet).
    """
    app_id = os.getenv("MATHPIX_APP_ID")
    app_key = os.getenv("MATHPIX_APP_KEY")
    if not app_id or not app_key:
        raise RuntimeError("MATHPIX_APP_ID and MATHPIX_APP_KEY must be set in environment")

    headers = {
        "app_id": app_id,
        "app_key": app_key,
    }

    # Mathpix expects multipart/form-data or JSON with base64; we'll send multipart
    files = {"file": ("image.jpg", image_bytes, "image/jpeg")}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(API_URL, headers=headers, files=files)
        resp.raise_for_status()
        return resp.json()
