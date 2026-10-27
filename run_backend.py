import sys
import os
import uvicorn

if __name__ == "__main__":
    # Ensure backend directory is in sys.path
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    print("=" * 65)
    print(" GitHub Project Analyzer - Backend Server (FastAPI)")
    print(" MCA Mini Project | AI-Powered Repository Understanding System")
    print(" API Docs available at: http://127.0.0.1:8000/docs")
    print("=" * 65)

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True, app_dir=backend_dir)
