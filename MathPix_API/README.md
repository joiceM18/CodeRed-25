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

4. POST an image to `http://localhost:8000/api/ocr/extract` (local) using Postman or curl. When deployed (e.g., Render), replace `http://localhost:8000` with your hosted URL, such as `https://<your-service>.onrender.com/api/ocr/extract`. The endpoint accepts multipart file upload under the `file` field. The response will be JSON with a convenience `text` field (the extracted plain text) and `raw` containing the full MathPix JSON response.

Example curl:

```powershell
curl -F "file=@C:\path\to\image.jpg" http://localhost:8000/api/ocr/extract
# Hosted example
# curl -F "file=@C:\path\to\image.jpg" https://<your-service>.onrender.com/api/ocr/extract
```

Example response:

```json
{
	"success": true,
	"text": "x + y = z",
	"raw": { /* full MathPix response */ }
}
```

Notes
- This is intentionally minimal. For production, add request validation, authentication, rate-limiting, logging, and error handling.
- MathPix API usage requires valid credentials and may incur cost.

Render endpoint
You can render text into a PNG image with the new endpoint:

POST /api/render/image

JSON body:
```json
{
	"text": "string (required)",
	"font_family": "path/to/font.ttf (optional)",
	"font_size": 24,
	"max_width": 800
}
```

Response: image/png binary data.

Example using PowerShell:
```powershell
Invoke-RestMethod -Uri http://localhost:8000/api/render/image -Method Post -ContentType 'application/json' -Body (ConvertTo-Json @{ text = Get-Content 'C:\path\to\file.txt' -Raw; font_size = 24 }) -OutFile out.png
# Hosted example
# Invoke-RestMethod -Uri https://<your-service>.onrender.com/api/render/image -Method Post -ContentType 'application/json' -Body (ConvertTo-Json @{ text = Get-Content 'C:\path\to\file.txt' -Raw; font_size = 24 }) -OutFile out.png
```
<!-- PDF support removed: PNG rendering is the canonical output. -->
