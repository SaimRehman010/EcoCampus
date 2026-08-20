import os
import re
import math
from typing import List, Dict, Any

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class PolicyRAGEngine:
    """
    Retrieval-Augmented Generation (RAG) Engine for EcoCampus Policy Knowledge Base.
    Performs section-aware chunking, semantic/keyword vector matching, and answer synthesis.
    """

    def __init__(self, policy_file_path: str = None):
        if not policy_file_path:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            policy_file_path = os.path.join(base_dir, "knowledge_base", "campus_policy.md")
        self.policy_file_path = policy_file_path
        self.chunks: List[Dict[str, Any]] = []
        self._load_and_chunk_documents()

    def _load_and_chunk_documents(self):
        """Reads policy markdown and splits into semantic chunks based on sections"""
        if not os.path.exists(self.policy_file_path):
            print(f"[RAG Engine Warning] Policy file not found at {self.policy_file_path}")
            return

        with open(self.policy_file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Split content by markdown major headers (## or ###)
        sections = re.split(r'\n(?=#{2,3}\s+)', content)
        chunks = []

        for idx, section in enumerate(sections):
            clean_section = section.strip()
            if not clean_section:
                continue

            lines = clean_section.splitlines()
            header_line = lines[0] if lines else f"Section {idx+1}"
            header_title = header_line.lstrip("#").strip()

            chunks.append({
                "chunk_id": idx + 1,
                "title": header_title,
                "content": clean_section,
                "tokens": self._tokenize(clean_section)
            })

        self.chunks = chunks
        print(f"[RAG Engine] Loaded {len(self.chunks)} policy chunks successfully.")

    def _tokenize(self, text: str) -> List[str]:
        """Simple alphanumeric tokenizer with stopword filtering"""
        stopwords = {
            "a", "an", "the", "and", "or", "but", "if", "in", "on", "at", "to", "for", "with",
            "about", "against", "between", "into", "through", "during", "before", "after",
            "above", "below", "from", "up", "down", "is", "are", "was", "were", "be", "been",
            "being", "have", "has", "had", "do", "does", "did", "can", "could", "will", "would",
            "should", "what", "which", "who", "when", "where", "why", "how", "all", "any", "both",
            "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
            "own", "same", "so", "than", "too", "very", "s", "t", "just", "don", "shouldn", "now"
        }
        words = re.findall(r'[a-zA-Z0-9]+', text.lower())
        return [w for w in words if w not in stopwords and len(w) > 1]

    def _calculate_score(self, query_tokens: List[str], chunk: Dict[str, Any]) -> float:
        """Calculates relevance score using token match and frequency weighting"""
        if not query_tokens:
            return 0.0

        chunk_tokens = chunk["tokens"]
        if not chunk_tokens:
            return 0.0

        score = 0.0
        title_tokens = set(self._tokenize(chunk["title"]))

        for qt in query_tokens:
            # Match in body
            count = chunk_tokens.count(qt)
            if count > 0:
                score += (1.0 + math.log(count)) * 2.0
            # Boost matches in header title
            if qt in title_tokens:
                score += 5.0

        return score

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieve the top-k most relevant policy chunks for a query"""
        query_tokens = self._tokenize(query)
        scored_chunks = []

        for chunk in self.chunks:
            score = self._calculate_score(query_tokens, chunk)
            if score > 0:
                scored_chunks.append({
                    "chunk_id": chunk["chunk_id"],
                    "title": chunk["title"],
                    "content": chunk["content"],
                    "score": round(score, 3)
                })

        # Sort by score descending
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        
        # If no query tokens matched, return top_k default chunks
        if not scored_chunks and self.chunks:
            return [{
                "chunk_id": c["chunk_id"],
                "title": c["title"],
                "content": c["content"],
                "score": 1.0
            } for c in self.chunks[:top_k]]

        return scored_chunks[:top_k]

    def generate_answer(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        """
        Retrieves top 3 relevant chunks and synthesizes a direct, concise answer.
        """
        retrieved_chunks = self.retrieve(query, top_k=top_k)

        if not retrieved_chunks:
            return {
                "query": query,
                "answer": "No specific policy guidelines were found matching your inquiry. Please refer to general EcoCampus facilities management or submit a query to the administrative desk.",
                "sources": [],
                "context_used": ""
            }

        context_text = "\n\n---\n\n".join([f"### {c['title']}\n{c['content']}" for c in retrieved_chunks])
        sources = [{"title": c["title"], "chunk_id": c["chunk_id"], "relevance_score": c["score"]} for c in retrieved_chunks]

        # 1. Try Google Gemini SDK if API key available
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                prompt = (
                    "You are the EcoCampus Assistant. Synthesize a direct, concise answer to the user's specific question using ONLY the provided policy context.\n\n"
                    f"Policy Context:\n{context_text}\n\n"
                    f"User Question: {query}\n"
                    f"Answer:"
                )
                response = model.generate_content(prompt)
                if response and response.text:
                    return {
                        "query": query,
                        "answer": response.text.strip(),
                        "sources": sources,
                        "context_used": context_text
                    }
            except Exception as e:
                print(f"[RAG Gemini Error]: {e}, falling back to built-in synthesizer")

        # 2. Try OpenAI if API key available
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if openai_api_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_api_key)
                completion = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are the EcoCampus Assistant. Synthesize a direct, concise answer to the user's specific question using ONLY the provided policy context."},
                        {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion: {query}"}
                    ]
                )
                if completion.choices:
                    return {
                        "query": query,
                        "answer": completion.choices[0].message.content.strip(),
                        "sources": sources,
                        "context_used": context_text
                    }
            except Exception as e:
                print(f"[RAG OpenAI Error]: {e}, falling back to built-in synthesizer")

        # 3. Grounded Dynamic Synthesizer
        primary_chunk = retrieved_chunks[0]
        query_words = set(self._tokenize(query))

        extracted_lines = []
        for chunk in retrieved_chunks:
            for line in chunk["content"].splitlines():
                l_str = line.strip()
                if not l_str or l_str.startswith("#"):
                    continue
                line_tokens = set(self._tokenize(l_str))
                overlap = query_words.intersection(line_tokens)
                if overlap or l_str.startswith("- ") or l_str.startswith("* ") or "|" in l_str:
                    if l_str not in extracted_lines and not l_str.startswith("|---"):
                        extracted_lines.append(l_str)

        summary_lines = [
            f"### Policy Answer for: *\"{query}\"*",
            f"**Source Section:** {primary_chunk['title']}",
            "",
        ]

        if extracted_lines:
            for s in extracted_lines[:6]:
                if not s.startswith("- ") and not s.startswith("* ") and not s.startswith("|"):
                    summary_lines.append(f"- {s}")
                else:
                    summary_lines.append(s)
        else:
            summary_lines.append(primary_chunk["content"][:450] + "...")

        synthesized_answer = "\n".join(summary_lines)

        return {
            "query": query,
            "answer": synthesized_answer,
            "sources": sources,
            "context_used": context_text
        }
