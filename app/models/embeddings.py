import os
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings  

# Ensure embeddings folder exists
EMB_PATH = "data/embeddings/faiss_index"
os.makedirs(os.path.dirname(EMB_PATH), exist_ok=True)

# Load embedding model
def get_embedding_model():
    """Return HuggingFace embedding model"""
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Save vector DB
def save_vector_db(texts, db_path=EMB_PATH):
    """Save FAISS vector DB"""
    embeddings = get_embedding_model()
    db = FAISS.from_texts(texts, embedding=embeddings)
    db.save_local(db_path)
    return db

# Load vector DB
def load_vector_db(db_path=EMB_PATH):
    """Load FAISS vector DB"""
    embeddings = get_embedding_model()
    return FAISS.load_local(db_path, embeddings, allow_dangerous_deserialization=True)
