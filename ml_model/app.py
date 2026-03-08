"""
Scam Detection ML API
Serves the fine-tuned BERT model for scam/fake content detection.
Run: python app.py
"""

import os
import re
import torch
import nltk
from nltk.corpus import stopwords
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# ─── Download NLTK data ─────────────────────────────────────
nltk.download("stopwords", quiet=True)
stop_words = set(stopwords.words("english"))

# ─── Load Model ─────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "bert_scam_model")
print(f"🔄 Loading BERT model from {MODEL_DIR}...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
model.eval()

# Use GPU if available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
print(f"✅ Model loaded on {device}")

# Label mapping: 0 = real/safe, 1 = scam/fake
LABELS = {0: "safe", 1: "scam"}

# ─── FastAPI App ─────────────────────────────────────────────
app = FastAPI(title="Scam Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ───────────────────────────────
class PredictRequest(BaseModel):
    text: str | None = None
    image_url: str | None = None


class PredictResponse(BaseModel):
    is_scam: bool
    confidence: float
    reason: str
    label: str


# ─── Text Preprocessing (same as training) ──────────────────
def clean_text(text: str) -> str:
    """Clean text exactly as done during training."""
    text = text.lower()
    # Remove URLs
    text = re.sub(r"http\S+", "", text)
    # Remove non-alphabetic characters
    text = re.sub(r"[^a-zA-Z]", " ", text)
    # Remove stopwords
    words = text.split()
    words = [w for w in words if w not in stop_words]
    return " ".join(words)


# ─── Prediction Logic ───────────────────────────────────────
def predict_bert(text: str) -> dict:
    """Run BERT inference on the given text."""
    cleaned = clean_text(text)

    if not cleaned.strip():
        return {"is_scam": False, "confidence": 1.0, "reason": "No meaningful text", "label": "safe"}

    # Tokenize
    inputs = tokenizer(
        cleaned,
        padding="max_length",
        truncation=True,
        max_length=256,
        return_tensors="pt",
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Inference
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probabilities = torch.softmax(logits, dim=1)

    predicted_class = torch.argmax(probabilities, dim=1).item()
    confidence = probabilities[0][predicted_class].item()

    is_scam = predicted_class == 1
    label = LABELS[predicted_class]
    reason = f"BERT detected scam/fake content ({confidence:.1%})" if is_scam else "BERT: safe"

    return {"is_scam": is_scam, "confidence": round(confidence, 4), "reason": reason, "label": label}


def detect_scam_patterns(text: str) -> dict:
    """Rule-based scam detection for social media scam patterns."""
    lower = text.lower()
    reasons = []

    # ── Scam keywords ──
    scam_keywords = [
        "click here to win", "congratulations you won", "send money",
        "lottery", "free gift", "act now", "limited time offer",
        "verify your account", "suspended account", "urgent action required",
        "wire transfer", "nigerian prince", "earn money fast",
        "claim your prize", "you have been selected", "free iphone",
        "win a", "won a", "get rich", "make money online",
        "double your money", "investment opportunity", "guaranteed returns",
        "no risk", "risk free", "100% free", "scan this", "scan the qr",
        "follow this link", "use this link", "click the link",
        "bitcoin giveaway", "crypto giveaway", "send btc",
        "whatsapp me", "dm me for", "cash app", "gift card",
        "bank account details", "pin number", "otp", "password reset",
        "free money", "quick cash", "payday loan",
    ]
    matched = [kw for kw in scam_keywords if kw in lower]
    if matched:
        reasons.append(f"Scam keywords: {', '.join(matched[:3])}")

    # ── Suspicious URLs ──
    urls = re.findall(r"(?:https?://|www\.)\S+", lower)
    suspicious_tlds = [".online", ".xyz", ".click", ".top", ".buzz", ".win", ".loan", ".gq", ".tk", ".cf"]
    suspicious_domains = ["bit.ly", "tinyurl", "shorturl", "free-money", "win-prize", "lotary", "lottary"]

    for url in urls:
        for tld in suspicious_tlds:
            if tld in url:
                reasons.append(f"Suspicious TLD in URL: {url}")
                break
        for domain in suspicious_domains:
            if domain in url:
                reasons.append(f"Suspicious domain: {url}")
                break

    # ── QR code + scam combo ──
    if ("qr" in lower or "scan" in lower) and any(w in lower for w in ["lottery", "prize", "win", "free", "money", "link"]):
        reasons.append("QR code with scam context")

    # ── Urgency patterns ──
    urgency = ["hurry", "last chance", "expires today", "only today", "don't miss", "act fast"]
    matched_urgency = [u for u in urgency if u in lower]
    if matched_urgency:
        reasons.append(f"Urgency language: {', '.join(matched_urgency[:2])}")

    if reasons:
        confidence = min(0.5 + len(reasons) * 0.15, 0.95)
        return {
            "is_scam": True,
            "confidence": round(confidence, 4),
            "reason": "; ".join(reasons[:3]),
            "label": "scam",
        }

    return {"is_scam": False, "confidence": 1.0, "reason": "No scam patterns", "label": "safe"}


# ─── Routes ─────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model": "bert_scam_model", "device": str(device)}


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    text = request.text or ""

    if not text.strip():
        return PredictResponse(
            is_scam=False,
            confidence=1.0,
            reason="No text content provided",
            label="safe",
        )

    # Run both detection methods
    bert_result = predict_bert(text)
    pattern_result = detect_scam_patterns(text)

    # If either method flags scam, use the one with higher confidence
    if bert_result["is_scam"] and pattern_result["is_scam"]:
        # Both flagged — combine reasons, use higher confidence
        confidence = max(bert_result["confidence"], pattern_result["confidence"])
        reason = f"{bert_result['reason']}; {pattern_result['reason']}"
        return PredictResponse(is_scam=True, confidence=confidence, reason=reason, label="scam")
    elif bert_result["is_scam"]:
        return PredictResponse(**bert_result)
    elif pattern_result["is_scam"]:
        return PredictResponse(**pattern_result)
    else:
        # Neither flagged — return safe with BERT confidence
        return PredictResponse(**bert_result)


# ─── Run ─────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    print("🚀 Starting Scam Detection API on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
