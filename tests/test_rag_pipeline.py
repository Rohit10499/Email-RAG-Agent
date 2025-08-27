import os


def test_retrieve_context_autobuild(tmp_path, monkeypatch):
    from app.rag import rag_pipeline as r

    # Redirect paths into tmp
    data = tmp_path / "data"
    emb = data / "embeddings" / "faiss_index"
    os.makedirs(emb, exist_ok=True)

    monkeypatch.setattr(r, 'DATA_PATH', str(tmp_path / 'airlines_policy.md'))
    monkeypatch.setattr(r, 'DB_PATH', str(emb))

    # Write small policy that yields at least one chunk
    (tmp_path / 'airlines_policy.md').write_text("Policy A\n\nPolicy B", encoding='utf-8')

    ctx = r.retrieve_context("Policy")
    assert "Policy" in ctx


