from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ocr, render

app = FastAPI(title="MathPix API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr.router, prefix="/api/ocr", tags=["ocr"]) 
app.include_router(render.router, prefix="/api/render", tags=["render"]) 

@app.get("/")
async def root():
    return {"message": "MathPix API backend"}
