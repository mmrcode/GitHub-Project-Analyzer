from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

@app.get("/")
def read_root():
    return {
        "project": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "github_token_configured": bool(settings.GITHUB_TOKEN)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
