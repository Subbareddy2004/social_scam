"""
Text Moderation ML API
Loads the trained RoBERTa model and serves spam/scam predictions.
Called by the Node.js backend's scamChecker.js service.
"""

import os
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import RobertaTokenizer, RobertaForSequenceClassification

# ─── Configuration ───────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "text_moderation_model")
SPAM_THRESHOLD = 0.6  # Matches training code threshold
PORT = 8000

# ─── App Setup ───────────────────────────────────────────────
app = FastAPI(
    title="Social Safe - Text Moderation API",
    description="RoBERTa-based spam/scam detection for social media posts",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global Model & Tokenizer ───────────────────────────────
model = None
tokenizer = None
device = None


# ─── Request / Response Schemas ──────────────────────────────
class PredictRequest(BaseModel):
    text: str
    image_url: str | None = None


class PredictResponse(BaseModel):
    is_scam: bool
    confidence: float
    reason: str
    label: str


# ─── Load Model on Startup ──────────────────────────────────
@app.on_event("startup")
def load_model():
    global model, tokenizer, device

    print("=" * 60)
    print("🔄 Loading RoBERTa text moderation model...")
    print(f"   Model directory: {MODEL_DIR}")
    print("=" * 60)

    if not os.path.exists(MODEL_DIR):
        raise RuntimeError(
            f"Model directory not found: {MODEL_DIR}\n"
            "Make sure the trained model files are in ml_model/text_moderation_model/"
        )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"   Device: {device}")

    tokenizer = RobertaTokenizer.from_pretrained(MODEL_DIR)
    model = RobertaForSequenceClassification.from_pretrained(MODEL_DIR)
    model.to(device)
    model.eval()

    print("✅ Model loaded successfully!")
    print(f"   Labels: 0 = Safe, 1 = Spam/Scam")
    print("=" * 60)


# ─── Prediction Endpoint ────────────────────────────────────
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    """
    Classify text as spam/scam or safe.

    Returns:
        is_scam: True if spam probability > threshold
        confidence: The probability of the predicted class
        reason: Human-readable explanation
        label: 'spam' or 'safe'
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text content is required.")

    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    text = req.text.strip()

    # Tokenize
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128,
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Inference
    with torch.no_grad():
        outputs = model(**inputs)

    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
    prob_safe = probs[0][0].item()
    prob_spam = probs[0][1].item()

    # Decision
    is_scam = prob_spam > SPAM_THRESHOLD

    if is_scam:
        return PredictResponse(
            is_scam=True,
            confidence=round(prob_spam, 4),
            reason=f"Text classified as spam/scam (confidence: {prob_spam:.1%})",
            label="spam",
        )
    else:
        return PredictResponse(
            is_scam=False,
            confidence=round(prob_safe, 4),
            reason="Content appears safe",
            label="safe",
        )


# ─── Health Check ────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "device": str(device) if device else "not initialized",
    }


# ─── Run Server ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    print(f"\n🚀 Starting Text Moderation API on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
