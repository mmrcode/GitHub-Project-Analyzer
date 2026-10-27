import pytest
from app.services.github_service import github_service
from app.services.tech_detector import tech_detector
from app.services.code_parser import code_parser
from app.services.viva_service import viva_service
from app.models.schemas import RepoMetadata, TechnologyAnalysis, DetectedTech, LanguageStat

def test_parse_github_urls():
    # Standard URL
    owner, repo = github_service.parse_repo_url("https://github.com/facebook/react")
    assert owner == "facebook"
    assert repo == "react"

    # URL with .git
    owner, repo = github_service.parse_repo_url("https://github.com/tiangolo/fastapi.git")
    assert owner == "tiangolo"
    assert repo == "fastapi"

    # Short format
    owner, repo = github_service.parse_repo_url("google/jax")
    assert owner == "google"
    assert repo == "jax"

def test_classify_files():
    f_py = tech_detector.classify_file("app/main.py", "blob", 1200)
    assert f_py.category == "source"
    assert f_py.language == "Python"

    f_test = tech_detector.classify_file("tests/test_service.py", "blob", 800)
    assert f_test.category == "test"

    f_docker = tech_detector.classify_file("Dockerfile", "blob", 400)
    assert f_docker.category == "build"

    f_readme = tech_detector.classify_file("README.md", "blob", 2500)
    assert f_readme.category == "doc"

def test_python_ast_parser():
    sample_code = '''
import os
from fastapi import FastAPI, Depends

app = FastAPI()

class UserService:
    """Service to handle user operations."""
    def get_user(self, user_id: int) -> dict:
        return {"id": user_id, "name": "Alice"}

@app.get("/users/{user_id}")
async def read_user(user_id: int):
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)
'''
    parsed = code_parser.parse_python_code("main.py", sample_code)
    assert parsed.language == "Python"
    assert parsed.is_entry_point is True
    assert len(parsed.classes) == 1
    assert parsed.classes[0].name == "UserService"
    assert len(parsed.classes[0].methods) == 1
    assert parsed.classes[0].methods[0].name == "get_user"
    assert len(parsed.functions) == 1
    assert parsed.functions[0].name == "read_user"
    assert parsed.functions[0].is_async is True
    assert len(parsed.imports) >= 2

def test_js_ts_parser():
    ts_code = '''
import React, { useState } from 'react';
import axios from 'axios';

interface UserProps {
    id: string;
}

export const UserCard = ({ id }: UserProps) => {
    return <div>User {id}</div>;
};

export class AuthManager {
    login() {
        return true;
    }
}
'''
    parsed = code_parser.parse_js_ts_code("UserCard.tsx", ts_code)
    assert parsed.language == "TypeScript"
    assert len(parsed.classes) == 1
    assert parsed.classes[0].name == "AuthManager"
    assert any(f.name == "UserCard" for f in parsed.functions)
    assert len(parsed.imports) == 2

def test_viva_question_generator():
    meta = RepoMetadata(
        owner="testowner",
        name="testrepo",
        full_name="testowner/testrepo",
        default_branch="main",
        html_url="https://github.com/testowner/testrepo"
    )
    tech = TechnologyAnalysis(
        primary_language="Python",
        languages=[LanguageStat(name="Python", file_count=5, total_bytes=10000, percentage=100.0)],
        technologies=[
            DetectedTech(name="FastAPI", category="Backend", version="0.110.0", source_file="requirements.txt")
        ],
        category_counts={"source": 5},
        total_files=5,
        total_directories=1,
        total_bytes=10000
    )
    parsed_files = [code_parser.parse_python_code("app/main.py", "def compute(): pass")]

    questions = viva_service.generate_viva_questions(meta, tech, parsed_files)
    assert len(questions) >= 5
    categories = [q.category for q in questions]
    assert "Architecture & Design" in categories
    assert any("FastAPI" in q.question for q in questions)
