# MathPix API backend (Python)

This is a minimal FastAPI backend that wraps the MathPix API for extracting text from images.

Files created:
- `app.py` - FastAPI application entrypoint
- `routers/ocr.py` - route that accepts image uploads and returns MathPix results
- `services/mathpix.py` - small service that calls the MathPix API
- `requirements.txt` - Python dependencies
- `.env.example` - environment variables to fill in

Quick start (Windows PowerShell):

1. Create a virtual environment and install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and fill `MATHPIX_APP_ID` and `MATHPIX_APP_KEY`.

3. Run the server:

```powershell
$env:HOST = "0.0.0.0"; $env:PORT = "8000"; uvicorn app:app --host $env:HOST --port $env:PORT --reload
```

4. POST an image to `http://localhost:8000/api/ocr/extract` using Postman or curl. The endpoint accepts multipart file upload under the `file` field.

Notes
- This is intentionally minimal. For production, add request validation, authentication, rate-limiting, logging, and error handling.
- MathPix API usage requires valid credentials and may incur cost.
