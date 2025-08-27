import os
from app.models.embeddings import save_vector_db, load_vector_db

DATA_PATH = "data/airlines_policy.md"
DB_PATH = "data/embeddings/faiss_index"


def build_vector_db():
    """Build FAISS DB from airline policy file"""
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f" Policy file not found at {DATA_PATH}")

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        policy_text = f.read()

    chunks = policy_text.split("\n\n")  # simple chunking
    save_vector_db(chunks, db_path=DB_PATH)
    print(f" FAISS DB built at {DB_PATH}")


def retrieve_context(query: str, k: int = 3) -> str:
    """Retrieve context from FAISS DB, auto-build if missing"""
    if not os.path.exists(DB_PATH):
        print(" No FAISS index found. Building one...")
        build_vector_db()

    db = load_vector_db(DB_PATH)
    docs = db.similarity_search(query, k=k)
    return "\n".join([doc.page_content for doc in docs])
