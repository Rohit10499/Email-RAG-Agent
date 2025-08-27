from app.models.llm_model import generate_response   
from app.rag.rag_pipeline import retrieve_context    


def draft_reply(email_body: str) -> str:
    """
    Generate intelligent reply using RAG + Groq LLM
    """
    # Step 1: Retrieve airline policy context from FAISS
    context = retrieve_context(email_body)

    # Step 2: Construct the prompt
    prompt = f"""
    You are an airline customer support assistant.
    Use the following policy context to answer the email.
    If the answer is not in the context, politely escalate.

    Customer Email:
    {email_body}

    Relevant Policy Context:
    {context}

    Draft a polite, professional reply:
    """

    # Step 3: Call Groq LLM via centralized model wrapper
    reply = generate_response(prompt)

    return reply
