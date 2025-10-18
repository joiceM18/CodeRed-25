from fastapi import APIRouter, UploadFile, File, HTTPException
import httpx
from services.mathpix import process_image

router = APIRouter()


@router.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    contents = await file.read()
    try:
        result = await process_image(contents, formats=["text"])
        text = result.get("extracted_text") or ""
        return {"success": True, "text": text, "raw": result}
    except RuntimeError as re:
        # missing credentials or other runtime misconfiguration
        raise HTTPException(status_code=500, detail=str(re))
    except httpx.HTTPStatusError as he:
        # pass-through httpx errors with upstream status code
        raise HTTPException(status_code=he.response.status_code, detail=he.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
