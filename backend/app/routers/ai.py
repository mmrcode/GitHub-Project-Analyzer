from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from app.models.schemas import AIChatRequest, AIChatResponse, AIFileExplanation, ParsedFileInfo
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/ai", tags=["AI Explanations"])

class ExplainFileRequest(BaseModel):
    file_path: str
    code_content: str
    parsed_info: Optional[ParsedFileInfo] = None
    gemini_api_key: Optional[str] = None

@router.post("/explain-file", response_model=AIFileExplanation)
async def explain_file(req: ExplainFileRequest):
    """Explains a selected code file using Google Gemini."""
    return await gemini_service.explain_code_file(
        file_path=req.file_path,
        code_content=req.code_content,
        parsed_info=req.parsed_info,
        custom_key=req.gemini_api_key
    )

@router.post("/chat", response_model=AIChatResponse)
async def chat_about_repository(req: AIChatRequest):
    """Interactive Q&A assistant grounded in the analyzed repository."""
    if not req.repo_context:
        raise HTTPException(status_code=400, detail="Repository context is required for chat.")

    return await gemini_service.answer_repository_chat(
        question=req.question,
        repo_context=req.repo_context,
        custom_key=req.gemini_api_key,
        chat_history=req.chat_history
    )
