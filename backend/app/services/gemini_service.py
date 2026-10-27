import json
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings
from app.models.schemas import (
    AIProjectSummary, AIFileExplanation, AIChatResponse,
    TechnologyAnalysis, RepoMetadata, ParsedFileInfo
)

class GeminiService:
    def __init__(self):
        self.default_model = "gemini-2.0-flash"
        self.fallback_model = "gemini-1.5-flash"

    def _get_api_key(self, custom_key: Optional[str] = None) -> str:
        key = (custom_key or settings.GEMINI_API_KEY or "").strip()
        return key

    async def _call_gemini_api(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        custom_key: Optional[str] = None,
        temperature: float = 0.4
    ) -> str:
        """
        Executes a call to the Google Gemini Generative Language REST API.
        Works seamlessly with free Google AI Studio Gemini API keys.
        """
        api_key = self._get_api_key(custom_key)
        if not api_key:
            return ""

        # Try gemini-2.0-flash, then fallback to gemini-1.5-flash
        models_to_try = [self.default_model, self.fallback_model]

        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

            payload: Dict[str, Any] = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": 3072,
                }
            }

            if system_instruction:
                payload["systemInstruction"] = {
                    "parts": [{"text": system_instruction}]
                }

            try:
                async with httpx.AsyncClient(timeout=35.0) as client:
                    resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})

                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts:
                                return parts[0].get("text", "").strip()

                    elif resp.status_code == 429:
                        # Rate limit reached on free quota
                        continue
                    else:
                        # Other API error, try fallback model
                        continue
            except Exception:
                continue

        return ""

    async def generate_project_summary(
        self,
        metadata: RepoMetadata,
        tech: TechnologyAnalysis,
        parsed_files: List[ParsedFileInfo],
        custom_key: Optional[str] = None
    ) -> AIProjectSummary:
        """
        Generates comprehensive AI project summary and architecture overview using Gemini.
        Falls back gracefully to intelligent static synthesis if no API key is provided.
        """
        key_files_summary = []
        for pf in parsed_files[:15]:
            cls_names = [c.name for c in pf.classes]
            fn_names = [f.name for f in pf.functions[:5]]
            key_files_summary.append(
                f"- `{pf.path}` ({pf.language}): Classes [{', '.join(cls_names)}], Functions [{', '.join(fn_names)}]"
            )

        tech_list = [f"{t.name} ({t.category})" for t in tech.technologies[:12]]
        prompt = f"""
You are an expert software architect evaluating a GitHub repository for an MCA Mini Project Viva & Review.
Repository: {metadata.full_name}
Description: {metadata.description or 'No description provided'}
Primary Language: {tech.primary_language}
Detected Tech Stack: {', '.join(tech_list)}
Total Files: {tech.total_files} ({tech.total_bytes / 1024:.1f} KB)

Key Source Files Analyzed:
{chr(10).join(key_files_summary)}

README Snippet:
{(metadata.readme_content or '')[:1200]}

Please provide a structured technical evaluation in JSON format with the following keys:
- "summary": A concise 2-3 paragraph explanation of what this application does, its core purpose, and who it is for.
- "architecture_overview": A technical explanation of the system architecture, design patterns, separation of concerns, and data flow.
- "key_features": A list of 4-6 prominent technical features implemented in the codebase.
- "core_modules": A list of 3-5 objects with "name" and "responsibility" detailing the major directories/modules.
- "design_patterns": A list of 3-5 software design patterns observed (e.g. MVC, Repository Pattern, Dependency Injection, RESTful API, Observer).

Respond ONLY with valid JSON.
"""
        response_text = await self._call_gemini_api(
            prompt=prompt,
            system_instruction="You are a senior software architect and academic project examiner. Return ONLY clean JSON.",
            custom_key=custom_key
        )

        if response_text:
            try:
                # Clean code fences if present
                clean_json = response_text
                if "```json" in clean_json:
                    clean_json = clean_json.split("```json")[1].split("```")[0]
                elif "```" in clean_json:
                    clean_json = clean_json.split("```")[1].split("```")[0]

                data = json.loads(clean_json.strip())
                return AIProjectSummary(
                    summary=data.get("summary", ""),
                    architecture_overview=data.get("architecture_overview", ""),
                    key_features=data.get("key_features", []),
                    core_modules=data.get("core_modules", []),
                    design_patterns=data.get("design_patterns", [])
                )
            except Exception:
                pass

        # Intelligent static fallback when no API key or during offline review
        return self._generate_fallback_summary(metadata, tech, parsed_files)

    def _generate_fallback_summary(
        self,
        metadata: RepoMetadata,
        tech: TechnologyAnalysis,
        parsed_files: List[ParsedFileInfo]
    ) -> AIProjectSummary:
        """Rule-based intelligent project summary when Gemini API key is absent."""
        tech_names = [t.name for t in tech.technologies[:5]] or [tech.primary_language]
        summary = (
            f"{metadata.name} is a {tech.primary_language}-based software repository "
            f"developed with {', '.join(tech_names)}. "
            f"{metadata.description or 'The codebase provides modular components structured for development and maintainability.'} "
            f"The repository contains {tech.total_files} files across {tech.total_directories} directories with a primary codebase composed of {tech.primary_language}."
        )

        architecture = (
            f"The application follows a modular client-server or component-based structure typical of {tech.primary_language} projects. "
            f"Static source analysis detected {len(parsed_files)} primary source modules with distinct separation between "
            f"entry points, core business logic, data models, and utility handlers. "
            f"Declared dependencies are managed through standard package manifests ({', '.join(set(t.source_file for t in tech.technologies)) or 'project configuration'})."
        )

        features = [
            f"Automated static structure organized in {tech.primary_language}",
            f"Dependency management utilizing {', '.join(set(t.name for t in tech.technologies[:3])) or 'native tools'}",
            f"Modular function and class definitions for testability and reuse",
            "Clear separation of entry points and domain logic"
        ]

        modules = []
        for pf in parsed_files[:4]:
            modules.append({
                "name": pf.path,
                "responsibility": f"Implements core {pf.language} logic with {len(pf.functions)} functions and {len(pf.classes)} classes."
            })

        return AIProjectSummary(
            summary=summary,
            architecture_overview=architecture,
            key_features=features,
            core_modules=modules,
            design_patterns=["Layered Architecture", "Modular Design", "Single Responsibility Principle"]
        )

    async def explain_code_file(
        self,
        file_path: str,
        code_content: str,
        parsed_info: Optional[ParsedFileInfo],
        custom_key: Optional[str] = None
    ) -> AIFileExplanation:
        """Explains a specific code file, its functions, classes, and potential edge cases."""
        prompt = f"""
Analyze the following source code file from a software repository:
File: {file_path}
Language: {parsed_info.language if parsed_info else 'Unknown'}

Source Code (first 350 lines):
{code_content[:8000]}

Provide an explanation in JSON with:
- "overview": Clear 1-2 paragraph summary of the file's purpose and functionality.
- "role_in_project": How this file connects with the rest of the application.
- "functions_explained": List of objects with "name" and "explanation" for key functions/methods.
- "potential_improvements": List of 2-3 code quality, performance, or security suggestions.

Return ONLY clean JSON.
"""
        response_text = await self._call_gemini_api(
            prompt=prompt,
            system_instruction="You are an expert static code reviewer. Return ONLY valid JSON.",
            custom_key=custom_key
        )

        if response_text:
            try:
                clean_json = response_text
                if "```json" in clean_json:
                    clean_json = clean_json.split("```json")[1].split("```")[0]
                elif "```" in clean_json:
                    clean_json = clean_json.split("```")[1].split("```")[0]

                data = json.loads(clean_json.strip())
                return AIFileExplanation(
                    file_path=file_path,
                    overview=data.get("overview", ""),
                    role_in_project=data.get("role_in_project", ""),
                    functions_explained=data.get("functions_explained", []),
                    potential_improvements=data.get("potential_improvements", [])
                )
            except Exception:
                pass

        # Static fallback
        funcs = []
        if parsed_info:
            for f in parsed_info.functions[:4]:
                funcs.append({
                    "name": f.name,
                    "explanation": f"Accepts ({', '.join(f.arguments)}) and returns {f.return_type or 'untyped value'}."
                })

        return AIFileExplanation(
            file_path=file_path,
            overview=f"`{file_path}` contains {parsed_info.loc if parsed_info else 'several'} lines of code defining key components for the application.",
            role_in_project="Serves as an integral source module coordinating functionality within its parent directory.",
            functions_explained=funcs,
            potential_improvements=["Add docstrings and type annotations", "Ensure thorough unit test coverage"]
        )

    async def answer_repository_chat(
        self,
        question: str,
        repo_context: Dict[str, Any],
        custom_key: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> AIChatResponse:
        """Answers developer/student questions grounded in the repository context."""
        meta = repo_context.get("metadata", {})
        tech = repo_context.get("technology", {})
        parsed_files = repo_context.get("parsed_code", [])

        file_list_summary = []
        for pf in parsed_files[:20]:
            fns = [f.get("name", "") for f in pf.get("functions", [])[:4]]
            file_list_summary.append(f"- {pf.get('path')} (Functions: {', '.join(fns)})")

        system_prompt = (
            "You are an AI code assistant for GitHub Project Analyzer. "
            "Your job is to answer questions about the analyzed repository accurately and clearly. "
            "Where possible, cite specific file paths. If information cannot be verified or is not present "
            "in the repository, communicate uncertainty honestly."
        )

        user_prompt = f"""
Repository: {meta.get('full_name')}
Description: {meta.get('description')}
Primary Language: {tech.get('primary_language')}
Technologies: {', '.join([t.get('name', '') for t in tech.get('technologies', [])[:10]])}

Repository Source Modules:
{chr(10).join(file_list_summary)}

User Question: {question}

Please answer the user's question accurately, citing specific files from the repository where relevant.
"""
        ans = await self._call_gemini_api(
            prompt=user_prompt,
            system_instruction=system_prompt,
            custom_key=custom_key
        )

        if not ans:
            # Fallback when key is missing or offline
            ans = (
                f"Based on the static analysis of **{meta.get('full_name', 'this repository')}**, "
                f"the project is built in **{tech.get('primary_language', 'its primary language')}** using "
                f"frameworks like {', '.join([t.get('name', '') for t in tech.get('technologies', [])[:3]]) or 'standard modules'}. "
                f"\n\nTo enable full real-time AI explanations and deep conversational answers, please add your "
                f"**Google Free Gemini API Key** in the settings modal (obtainable for free at https://aistudio.google.com/)."
            )

        # Detect referenced files in answer
        referenced = []
        for pf in parsed_files:
            p = pf.get("path", "")
            if p and (p in ans or p.split("/")[-1] in ans):
                referenced.append(p)

        return AIChatResponse(
            answer=ans,
            referenced_files=referenced[:5]
        )

gemini_service = GeminiService()
