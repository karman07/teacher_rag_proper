"""
gpu_client.py — HTTP client for GPU cluster services (LLM, Vision, Embeddings, Reranker, Qdrant)
All calls go through the GPU gateway reverse proxy.
"""
import base64
import json
import logging
from typing import Optional
import httpx

logger = logging.getLogger(__name__)


class GPUClient:
    def __init__(self, gateway_url: str, llm_model: str = "llama70b", vision_model: str = "Qwen/Qwen2-VL-7B-Instruct"):
        self._gateway = gateway_url.rstrip("/")
        self._llm_model = llm_model
        self._vision_model = vision_model
        self._http: Optional[httpx.AsyncClient] = None
        logger.info(f"GPUClient initialized — gateway: {self._gateway}")

    def _get_http(self) -> httpx.AsyncClient:
        if self._http is None or self._http.is_closed:
            self._http = httpx.AsyncClient(
                base_url=self._gateway,
                timeout=httpx.Timeout(300.0, connect=15.0),
                limits=httpx.Limits(max_keepalive_connections=0),
                headers={
                    "Accept-Encoding": "identity",
                    "Connection": "close"
                }
            )
        return self._http

    # ── Embeddings (TEI) ──────────────────────────────────────────────────

    async def embed(self, texts: list[str]) -> list[list[float]]:
        http = self._get_http()
        resp = await http.post("/embeddings/embed", json={"inputs": texts, "truncate": True})
        if resp.status_code != 200:
            logger.error(f"[embed] TEI error {resp.status_code}: {resp.text} (payload size: {len(texts)} texts)")
        resp.raise_for_status()
        try:
            return resp.json()
        except (json.JSONDecodeError, UnicodeDecodeError):
            content = resp.content
            try:
                import gzip
                content = gzip.decompress(content)
                return json.loads(content)
            except Exception: pass
            try:
                import brotli
                content = brotli.decompress(resp.content)
                return json.loads(content)
            except Exception: pass
            return json.loads(resp.content.decode('utf-8', errors='replace'))

    # ── Reranker (TEI) ────────────────────────────────────────────────────

    async def rerank(self, query: str, texts: list[str], top_n: int = 6) -> list[dict]:
        http = self._get_http()
        resp = await http.post("/reranker/rerank", json={
            "query": query, "texts": texts, "truncate": True,
        })
        resp.raise_for_status()
        try:
            results = resp.json()
        except (json.JSONDecodeError, UnicodeDecodeError):
            content = resp.content
            try:
                import gzip
                content = gzip.decompress(content)
                results = json.loads(content)
            except Exception: 
                try:
                    import brotli
                    content = brotli.decompress(resp.content)
                    results = json.loads(content)
                except Exception:
                    results = json.loads(resp.content.decode('utf-8', errors='replace'))
        
        sorted_results = sorted(results, key=lambda x: x["score"], reverse=True)
        return sorted_results[:top_n]

    # ── LLM Generation (vLLM / OpenAI-compatible) ────────────────────────

    async def generate(self, messages: list[dict], temperature: float = 0.3, max_tokens: int = 4096, response_format: Optional[dict] = None) -> str:
        http = self._get_http()
        body: dict = {
            "model": self._llm_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            body["response_format"] = response_format
        resp = await http.post("/llm/v1/chat/completions", json=body)
        resp.raise_for_status()
        try:
            data = resp.json()
        except (json.JSONDecodeError, UnicodeDecodeError):
            content = resp.content
            try:
                import gzip
                content = gzip.decompress(content)
                data = json.loads(content)
            except Exception:
                try:
                    import brotli
                    content = brotli.decompress(resp.content)
                    data = json.loads(content)
                except Exception:
                    data = json.loads(resp.content.decode('utf-8', errors='replace'))
        return data["choices"][0]["message"]["content"]

    async def stream_generate(self, messages: list[dict], temperature: float = 0.3, max_tokens: int = 4096):
        http = self._get_http()
        body = {
            "model": self._llm_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        
        async with http.stream("POST", "/llm/v1/chat/completions", json=body) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                if line.startswith("data: "):
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk["choices"][0].get("delta", {})
                        content = delta.get("content")
                        if content:
                            yield content
                    except Exception:
                        continue

    # ── Vision (vLLM Qwen2-VL / OpenAI Vision-compatible) ────────────────

    async def describe_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> str:
        http = self._get_http()
        b64 = base64.b64encode(image_bytes).decode()
        resp = await http.post("/vision/v1/chat/completions", json={
            "model": self._vision_model,
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
            ]}],
            "max_tokens": 512,
            "temperature": 0.2,
        })
        if resp.status_code != 200:
            logger.error(f"[vision] vLLM error {resp.status_code}: {resp.text}")
        resp.raise_for_status()
        try:
            data = resp.json()
        except (json.JSONDecodeError, UnicodeDecodeError):
            content = resp.content
            try:
                import gzip
                content = gzip.decompress(content)
                data = json.loads(content)
            except Exception:
                try:
                    import brotli
                    content = brotli.decompress(resp.content)
                    data = json.loads(content)
                except Exception:
                    data = json.loads(resp.content.decode('utf-8', errors='replace'))
        return data["choices"][0]["message"]["content"]

    # ── Qdrant (REST via gateway) ────────────────────────────────────────

    async def qdrant_ensure_collection(self, name: str, vector_size: int = 1024):
        http = self._get_http()
        check = await http.get(f"/qdrant/collections/{name}")
        if check.status_code == 200:
            return
        await http.put(f"/qdrant/collections/{name}", json={
            "vectors": {"size": vector_size, "distance": "Cosine"},
        })
        # Create payload indexes for faster filtered queries
        for field in ("file_id", "teacher_id"):
            await http.put(f"/qdrant/collections/{name}/index", json={
                "field_name": field, "field_schema": "keyword",
            })
        logger.info(f"[qdrant] created collection '{name}' ({vector_size}d)")

    async def qdrant_upsert(self, collection: str, points: list[dict]):
        http = self._get_http()
        # Upsert in batches of 100
        for i in range(0, len(points), 100):
            batch = points[i:i+100]
            resp = await http.put(f"/qdrant/collections/{collection}/points", json={"points": batch})
            resp.raise_for_status()

    async def qdrant_search(self, collection: str, vector: list[float], limit: int = 20, filter_: Optional[dict] = None) -> list[dict]:
        http = self._get_http()
        body: dict = {"vector": vector, "limit": limit, "with_payload": True}
        if filter_:
            body["filter"] = filter_
        resp = await http.post(f"/qdrant/collections/{collection}/points/search", json=body)
        resp.raise_for_status()
        
        try:
            return resp.json().get("result", [])
        except (json.JSONDecodeError, UnicodeDecodeError):
            # Fallback for cases where response is compressed but header was stripped
            content = resp.content
            # Try gzip
            try:
                import gzip
                content = gzip.decompress(content)
                return json.loads(content).get("result", [])
            except Exception:
                pass
            # Try brotli
            try:
                import brotli
                content = brotli.decompress(resp.content)
                return json.loads(content).get("result", [])
            except Exception:
                pass
            # Final attempt: replace invalid characters
            return json.loads(resp.content.decode('utf-8', errors='replace')).get("result", [])

    async def qdrant_delete(self, collection: str, filter_: dict):
        http = self._get_http()
        resp = await http.post(f"/qdrant/collections/{collection}/points/delete", json={"filter": filter_})
        resp.raise_for_status()

    async def qdrant_list_collections(self) -> list[dict]:
        http = self._get_http()
        resp = await http.get("/qdrant/collections")
        resp.raise_for_status()
        return resp.json().get("result", {}).get("collections", [])

    async def qdrant_collection_info(self, name: str) -> dict:
        http = self._get_http()
        resp = await http.get(f"/qdrant/collections/{name}")
        if resp.status_code == 404:
            return {}
        resp.raise_for_status()
        return resp.json().get("result", {})

    async def close(self):
        if self._http and not self._http.is_closed:
            await self._http.aclose()
