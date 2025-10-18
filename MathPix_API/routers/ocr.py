from fastapi import APIRouter, UploadFile, File, HTTPException
from services.mathpix import process_image

router = APIRouter()

@router.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    contents = await file.read()
    try:
        result = await process_image(contents)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
