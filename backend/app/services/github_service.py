import re
import base64
from typing import Tuple, Dict, Any, List, Optional
import httpx
from fastapi import HTTPException
from app.models.schemas import RepoMetadata, FileItem
from app.config import settings

class GitHubService:
    def __init__(self):
        self._content_cache: Dict[str, str] = {}

    @staticmethod
    def parse_repo_url(url: str) -> Tuple[str, str]:
        """
        Parses various GitHub repository URL formats into (owner, repo).
        Supports:
        - https://github.com/owner/repo
        - https://github.com/owner/repo.git
        - http://github.com/owner/repo/tree/main
        - github.com/owner/repo
        - owner/repo
        """
        cleaned = url.strip()
        # Remove trailing slashes and .git
        cleaned = re.sub(r"\.git/?$", "", cleaned)
        cleaned = cleaned.rstrip("/")

        # Match pattern
        patterns = [
            r"^(?:https?:\/\/)?github\.com\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)",
            r"^([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)$"
        ]

        for pat in patterns:
            match = re.search(pat, cleaned)
            if match:
                owner, repo = match.group(1), match.group(2)
                # Filter out generic github subpages
                if owner.lower() in ("settings", "explore", "topics", "collections"):
                    continue
                return owner, repo

        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub repository URL format. Please provide a URL like 'https://github.com/owner/repo' or 'owner/repo'."
        )

    def _get_headers(self, custom_token: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub-Project-Analyzer-MCA"
        }
        token = custom_token or settings.GITHUB_TOKEN
        if token and token.strip():
            headers["Authorization"] = f"Bearer {token.strip()}"
        return headers

    async def fetch_repo_metadata(
        self,
        owner: str,
        repo: str,
        token: Optional[str] = None
    ) -> RepoMetadata:
        """Fetches core repository metadata from GitHub REST API."""
        url = f"https://api.github.com/repos/{owner}/{repo}"
        headers = self._get_headers(token)

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, headers=headers)

            if resp.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail=f"Repository '{owner}/{repo}' not found or is private. Make sure the repository exists and is public."
                )
            elif resp.status_code == 403:
                remaining = resp.headers.get("x-ratelimit-remaining")
                if remaining == "0":
                    reset_time = resp.headers.get("x-ratelimit-reset", "unknown")
                    raise HTTPException(
                        status_code=429,
                        detail=f"GitHub API rate limit exceeded. Provide a GitHub Personal Access Token in the settings or wait until reset (epoch {reset_time})."
                    )
                raise HTTPException(
                    status_code=403,
                    detail="Access denied by GitHub API. If this is a private repo, provide a token with repo access."
                )
            elif resp.status_code != 200:
                raise HTTPException(
                    status_code=resp.status_code,
                    detail=f"Failed to fetch repository from GitHub: {resp.text}"
                )

            data = resp.json()

            # Now fetch README
            readme_content = None
            has_readme = False
            try:
                readme_resp = await client.get(f"{url}/readme", headers=headers)
                if readme_resp.status_code == 200:
                    readme_data = readme_resp.json()
                    raw_b64 = readme_data.get("content", "")
                    readme_content = base64.b64decode(raw_b64).decode("utf-8", errors="replace")
                    has_readme = True
            except Exception:
                has_readme = False

            return RepoMetadata(
                owner=owner,
                name=repo,
                full_name=data.get("full_name", f"{owner}/{repo}"),
                description=data.get("description"),
                default_branch=data.get("default_branch", "main"),
                stars=data.get("stargazers_count", 0),
                forks=data.get("forks_count", 0),
                open_issues=data.get("open_issues_count", 0),
                license=data.get("license", {}).get("name") if data.get("license") else None,
                topics=data.get("topics", []),
                created_at=data.get("created_at"),
                updated_at=data.get("updated_at"),
                size_kb=data.get("size", 0),
                html_url=data.get("html_url", f"https://github.com/{owner}/{repo}"),
                avatar_url=data.get("owner", {}).get("avatar_url"),
                has_readme=has_readme,
                readme_content=readme_content
            )

    async def fetch_file_tree(
        self,
        owner: str,
        repo: str,
        default_branch: str = "main",
        token: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetches the complete recursive Git Tree.
        Returns list of tree objects with path, type, size.
        """
        url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
        headers = self._get_headers(token)

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                # If default branch fails, try with master
                if default_branch != "master":
                    retry_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/master?recursive=1"
                    resp = await client.get(retry_url, headers=headers)
                if resp.status_code != 200:
                    raise HTTPException(
                        status_code=resp.status_code,
                        detail=f"Failed to fetch repository tree: {resp.text}"
                    )

            tree_data = resp.json().get("tree", [])
            return tree_data

    async def fetch_file_content(
        self,
        owner: str,
        repo: str,
        path: str,
        branch: str = "main",
        token: Optional[str] = None
    ) -> str:
        """
        Fetches the raw content of a specific file in the repository.
        Uses in-memory cache to prevent redundant API calls.
        """
        cache_key = f"{owner}/{repo}/{branch}/{path}"
        if cache_key in self._content_cache:
            return self._content_cache[cache_key]

        # Use raw.githubusercontent.com for fast retrieval
        raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
        headers = self._get_headers(token)

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(raw_url, headers=headers)
            if resp.status_code == 200:
                content = resp.text
                self._content_cache[cache_key] = content
                return content

            # Fallback to GitHub REST API contents endpoint
            api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}"
            resp = await client.get(api_url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if "content" in data and data.get("encoding") == "base64":
                    content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
                    self._content_cache[cache_key] = content
                    return content

            raise HTTPException(
                status_code=404,
                detail=f"Could not load file content for '{path}'."
            )

github_service = GitHubService()
