from fastapi import APIRouter
from app.rag.rag_pipeline import retrieve_context

router = APIRouter()

@router.get("/search")
def search_policies(query: str, k: int = 3):
    """Retrieve airline policy context"""
    context = retrieve_context(query, k)
    return {"query": query, "context": context}
