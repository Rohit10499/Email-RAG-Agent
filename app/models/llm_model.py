import os
from groq import Groq
from dotenv import load_dotenv
load_dotenv()

# Initialize Groq Client
def get_llm():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(" GROQ_API_KEY not found in environment variables")
    return Groq(api_key=api_key)

# Generate response
def generate_response(prompt, model=os.environ['LLM_MODEL'], temperature=0.3, max_tokens=512):
    if model is None:
        model = os.environ['LLM_MODEL']
        if not model:
            raise ValueError("LLM_MODEL not set in environment variables")
    
    client = get_llm()
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content.strip()
