import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.routers import analyze, ai, export

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="MCA Mini Project: AI-Powered Source Code Analysis and Repository Understanding System"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows development on any local port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router, prefix=settings.API_PREFIX)
app.include_router(ai.router, prefix=settings.API_PREFIX)
app.include_router(export.router, prefix=settings.API_PREFIX)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "github_token_configured": bool(settings.GITHUB_TOKEN)
    }

# Production Static File Serving (if frontend/dist exists)
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept /api routes
        if full_path.startswith("api/") or full_path == "api":
            return {"error": "Not found"}
        target_file = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(dist_dir, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {
            "project": settings.APP_NAME,
            "version": settings.VERSION,
            "status": "online",
            "docs": "/docs"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
