# GitHub Project Analyzer: An AI-Powered Source Code Analysis and Repository Understanding System
### MCA Mini Project • Project Domain: Web Development, Artificial Intelligence and Static Source Code Analysis

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-Free_API_Key-4285F4.svg?style=flat&logo=google)](https://aistudio.google.com)
[![Pytest](https://img.shields.io/badge/Pytest-Passed-green.svg?style=flat&logo=pytest)](https://pytest.org)

---

## 1. Introduction & Overview

Software projects often contain dozens or hundreds of files, nested directories, declared dependencies, and interconnected modules. Understanding an unfamiliar codebase is notoriously challenging for students, educators, and beginner developers. 

The **GitHub Project Analyzer** is an end-to-end web-based application that analyzes publicly accessible GitHub repositories. Users enter any repository URL (or `owner/repo`) to inspect:
- Comprehensive repository metadata, size, licensing, stars, forks, and default branch
- Language distribution, percentages, and metrics
- Technology & framework detection from dependency manifests (`package.json`, `requirements.txt`, `pom.xml`, `Dockerfile`, etc.)
- Static AST (Abstract Syntax Tree) decomposition of classes, functions, parameters, return types, decorators, and entry points without executing untrusted code
- Module relationship & dependency graph visualization
- Automated installation prerequisites, environment variables, startup and test commands
- **MCA Viva Examination Prep Generator** with categorized technical questions, model answers, and study mode
- **Google Gemini AI Integration** (using Google's **Free Gemini API Key**) for high-level architecture overviews, file/function walkthroughs, and interactive repository Q&A
- One-click report export to **Markdown (`.md`)**, **Print-Ready HTML/PDF**, and **JSON**.

---

## 2. System Architecture & 6 Modules

```
User (Browser)
      │
      ▼
React 19 + TypeScript Frontend (Port 3000)
      │  (REST API calls)
      ▼
FastAPI Python Backend (Port 8000)
 ├── Module 1: Repository Input & Metadata (GitHub REST API)
 ├── Module 2: File Structure & Tech Stack Detection (Manifest Parser)
 ├── Module 3: Source Code & AST Analysis (Python AST, JS/TS Regex Parser)
 ├── Module 4: AI Explanation Engine (Google Gemini Generative AI)
 ├── Module 5: Setup Guide & MCA Viva Question Generator
 └── Module 6: Report Export & Module Relationship Graph
```

| Module | Core Functionality |
|---|---|
| **Module 1: Repository Input & Metadata** | Validates URL formats (`https://github.com/owner/repo` or `owner/repo`), handles rate limits, fetches description, stars, forks, license, README, and full recursive Git Tree. |
| **Module 2: File Structure & Technology Analysis** | Classifies files (`source`, `test`, `doc`, `config`, `build`, `asset`), detects languages, inspects manifests (`package.json`, `requirements.txt`, `pom.xml`, `Dockerfile`) to identify frameworks. |
| **Module 3: Source Code & Dependency Analysis** | Statically analyzes source files using Python's built-in `ast` module and static syntax parsers for JS/TS/Java/C++. Extracts classes, methods, functions, decorators, imports, exports, and entry points. Maps cross-module import relationships. |
| **Module 4: AI-Powered Explanation (Google Gemini)** | Connects to the **Google Free Gemini API** (`gemini-2.0-flash` / `gemini-1.5-flash`). Generates executive architecture summaries, explains any selected file/function, and powers an interactive codebase chat assistant. |
| **Module 5: Setup Guide & Viva Question Generator** | Synthesizes prerequisites, virtual environment creation, installation commands, execution steps, and generates 8-15 categorized MCA Viva defense questions with model answers. |
| **Module 6: Report & Visualization** | Renders an interactive 6-tab developer dashboard with an interactive module relationship network, syntax-highlighted code viewer, and exports reports to Markdown, HTML/PDF, and JSON. |

---

## 3. Google Free Gemini API Key Setup

This project uses the official Google Gemini Generative Language API, which offers a **100% free tier** for developers and students.

### How to get your free key:
1. Visit **Google AI Studio**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with any standard Google account.
3. Click **"Create API key"** and copy the generated key (`AIzaSy...`).
4. You can configure your key in either of two ways:
   - **Option A (Web UI - Recommended):** Click the **"Add Free Gemini Key"** or Key icon in the top navigation bar of the application and paste your key. It is securely saved in your browser's local storage.
   - **Option B (`.env` file):** Open `backend/.env` and paste:
     ```env
     GEMINI_API_KEY=AIzaSyYourGeneratedKeyHere
     GEMINI_MODEL=gemini-2.0-flash
     ```

> **Note:** If no Gemini API key is provided, the application will still perform 100% of the static AST parsing, file classification, dependency detection, setup synthesis, and rule-based viva question generation seamlessly!

---

## 4. Quick Start & Execution

### Option A: One-Click Launcher (Windows Batch)
Double-click `start.bat` in the project root:
```bat
start.bat
```
This automatically boots both the FastAPI backend and React frontend.

---

### Option B: PowerShell Launcher
Right-click or run in PowerShell:
```powershell
./start.ps1
```

---

### Option C: Manual Command Line Execution

#### 1. Backend (FastAPI):
```bash
# Navigate to backend
cd backend

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Launch FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API documentation is available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### 2. Frontend (React + Vite):
```bash
# In a new terminal, navigate to frontend
cd frontend

# Start development server
npm run dev
```
Open your browser at: [http://localhost:3000](http://localhost:3000)

---

## 5. Running Unit Tests (Pytest)

The project includes unit tests verifying URL parsing, file classification, Python AST parsing, TypeScript syntax parsing, and Viva question synthesis:

```bash
cd backend
./venv/Scripts/pytest tests
```
Output:
```text
============================= test session starts =============================
platform win32 -- Python 3.14.2, pytest-9.1.1, pluggy-1.7.0
rootdir: C:\Users\moham\Documents\Git Analyzer\backend
collected 5 items

tests\test_analyzer.py .....                                             [100%]

============================== 5 passed in 1.42s ==============================
```

---

## 6. Project Directory Layout

```
Git Analyzer/
├── backend/
│   ├── app/
│   │   ├── config.py                  # App configuration & Gemini settings
│   │   ├── main.py                    # FastAPI application & CORS setup
│   │   ├── models/
│   │   │   └── schemas.py             # Pydantic data models for all 6 modules
│   │   ├── services/
│   │   │   ├── github_service.py      # Module 1: GitHub REST API integration
│   │   │   ├── tech_detector.py       # Module 2: Language & framework detection
│   │   │   ├── code_parser.py         # Module 3: Static AST code parser & graph builder
│   │   │   ├── gemini_service.py      # Module 4: Google Gemini Free AI integration
│   │   │   └── viva_service.py        # Module 5: Setup guide & Viva question generator
│   │   └── routers/
│   │       ├── analyze.py             # /api/analyze endpoints
│   │       ├── ai.py                  # /api/ai/explain-file & /api/ai/chat
│   │       └── export.py              # /api/export (Markdown, HTML/PDF, JSON)
│   ├── tests/
│   │   └── test_analyzer.py           # Pytest test suite
│   ├── conftest.py                    # Test configuration
│   ├── requirements.txt               # Backend dependencies
│   └── .env                           # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Header navigation & settings trigger
│   │   │   ├── RepoInput.tsx          # URL input, sample pills & loading steps
│   │   │   ├── OverviewTab.tsx        # Project summary, stats, languages, tech stack
│   │   │   ├── FileExplorerTab.tsx    # File tree & syntax-highlighted code viewer
│   │   │   ├── CodeAnalysisTab.tsx    # Classes, functions, decorators & AST breakdown
│   │   │   ├── DependencyGraphTab.tsx # Visual module relationship network
│   │   │   ├── AIChatTab.tsx          # Interactive Gemini codebase Q&A chat
│   │   │   ├── VivaPrepTab.tsx        # Setup instructions & MCA Viva question cards
│   │   │   ├── ApiKeyModal.tsx        # Google Free Gemini key configuration modal
│   │   │   └── ExportModal.tsx        # Markdown, HTML/PDF, and JSON export dialog
│   │   ├── services/
│   │   │   └── api.ts                 # Frontend API client
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interface definitions
│   │   ├── App.tsx                    # Main dashboard application container
│   │   ├── index.css                  # Tailwind styles and animations
│   │   └── main.tsx                   # React root entry
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── run_backend.py                     # Python backend launcher
├── start.bat                          # One-click Windows batch launcher
├── start.ps1                          # PowerShell startup script
└── README.md                          # Complete project documentation
```

---

## 7. MCA Viva Defense Tips

When presenting this project for your MCA Mini Project evaluation:
1. **Highlight Static Analysis vs Runtime Execution:** Emphasize that the system analyzes source code statically using Python's standard `ast` module and regex parsers, meaning it is completely safe and does not execute untrusted third-party code.
2. **Demonstrate Gemini AI Integration:** Showcase how the free Google Gemini API is called via direct REST requests using asynchronous HTTP (`httpx`), keeping the backend lightweight and resilient.
3. **Showcase the 6 Modules:** Walk the examiners through the tabs corresponding to the 6 synopsis modules:
   - *Overview:* Metadata & Frameworks
   - *File Explorer:* File classification and code inspection
   - *Static Code & AST:* Classes, functions, decorators, and entry points
   - *Module Graph:* Architecture relationships
   - *AI Assistant:* Contextual Q&A
   - *Viva Prep:* Setup guide and oral examination flashcards
4. **Demonstrate Report Export:** Click "Export Report" to generate a printable PDF or formatted Markdown document summarizing the entire repository analysis.

---
*Created for MCA Mini Project 2026 • GitHub Project Analyzer*
