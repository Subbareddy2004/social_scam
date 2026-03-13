"""
Text + Image Moderation ML API
Combines:
  1. Trained RoBERTa model for text-based spam/scam detection
  2. AI via OpenRouter (Gemini/GPT/Claude) for multimodal (text + image) scam analysis
Called by the Node.js backend's scamChecker.js service.
"""

import os
from dotenv import load_dotenv
load_dotenv()  # Load .env before reading env vars

import json
import base64
import asyncio
import torch
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import RobertaTokenizer, RobertaForSequenceClassification

# ─── Configuration ───────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "text_moderation_model")
SPAM_THRESHOLD = 0.6  # Matches training code threshold
PORT = 8000

# OpenRouter config
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
MAX_RETRIES = 3
RETRY_BASE_DELAY = 2  # seconds

# ─── App Setup ───────────────────────────────────────────────
app = FastAPI(
    title="Social Safe - Text & Image Moderation API",
    description="RoBERTa + AI (OpenRouter) powered spam/scam detection for social media posts",
    version="2.0.0",
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
ai_ready = False


# ─── Request / Response Schemas ──────────────────────────────
class PredictRequest(BaseModel):
    text: str
    image_url: str | None = None


class PredictResponse(BaseModel):
    is_scam: bool
    confidence: float
    reason: str
    label: str


class AIAnalysisResponse(BaseModel):
    is_scam: bool
    scam_score: float
    safe_score: float
    reason: str
    categories: list[str]
    analysis_type: str  # "text_only", "image_only", "text_and_image"


class CombinedPredictResponse(BaseModel):
    is_scam: bool
    confidence: float
    reason: str
    label: str
    ml_result: dict | None = None
    ai_result: dict | None = None


# ─── Load Model on Startup ──────────────────────────────────
@app.on_event("startup")
def load_model():
    global model, tokenizer, device, ai_ready

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

    print("✅ RoBERTa model loaded successfully!")
    print(f"   Labels: 0 = Safe, 1 = Spam/Scam")

    # Check OpenRouter API key
    if OPENROUTER_API_KEY:
        ai_ready = True
        print(f"✅ OpenRouter AI ready! Model: {OPENROUTER_MODEL}")
    else:
        ai_ready = False
        print("⚠️  OPENROUTER_API_KEY not set — AI analysis disabled")

    print("=" * 60)


# ─── Helper: Download image from URL ────────────────────────
async def download_image(url: str) -> tuple[bytes, str] | None:
    """Download image and return (bytes, mime_type) or None on failure."""
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url)
            if response.status_code == 200:
                content_type = response.headers.get("content-type", "image/jpeg")
                mime_type = content_type.split(";")[0].strip()
                return response.content, mime_type
    except Exception as e:
        print(f"⚠️  Failed to download image: {e}")
    return None


# ─── AI Analysis via OpenRouter ─────────────────────────────
MODERATION_PROMPT = """You are an expert social media content moderator. Analyze the following content for scam, fraud, phishing, or spam indicators.

ANALYZE ALL PROVIDED CONTENT (text and/or image) and provide a JSON response ONLY with no extra text:

{
  "is_scam": true/false,
  "scam_score": 0.0-1.0,
  "safe_score": 0.0-1.0,
  "reason": "Brief explanation of your analysis",
  "categories": ["list", "of", "detected", "categories"]
}

Categories to check for:
- "phishing" - Attempts to steal credentials or personal info
- "financial_scam" - Fake investment, lottery, prize scams
- "impersonation" - Pretending to be a brand/person/authority
- "malware" - Links to malicious software
- "fake_product" - Counterfeit or non-existent products
- "urgency_manipulation" - Creating false urgency to pressure action
- "qr_code_scam" - Malicious QR codes
- "fake_offer" - Too-good-to-be-true deals
- "data_harvesting" - Collecting personal data under false pretenses
- "safe" - Content appears legitimate

Rules:
- scam_score + safe_score should equal 1.0
- Be thorough but not overly aggressive — legitimate promotions are OK
- If an image contains suspicious QR codes, fake logos, or manipulated screenshots, flag it
- Consider the COMBINATION of text and image — sometimes text is innocent but image is scammy or vice versa
"""


async def ai_analyze(text: str | None, image_url: str | None) -> dict | None:
    """Use OpenRouter AI to analyze text and/or image for scam content."""
    if not ai_ready or not OPENROUTER_API_KEY:
        return None

    try:
        # Build message content (OpenAI vision format)
        content_parts = []
        analysis_type = "text_only"

        # Add text
        user_text = ""
        if text and text.strip():
            user_text = f"TEXT CONTENT:\n{text}"

        # Add image if provided
        if image_url:
            # Download and encode as base64
            img_result = await download_image(image_url)
            if img_result:
                img_bytes, mime_type = img_result
                img_b64 = base64.b64encode(img_bytes).decode("utf-8")
                content_parts.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{img_b64}"
                    }
                })
                if text and text.strip():
                    analysis_type = "text_and_image"
                else:
                    analysis_type = "image_only"

        # Add text part
        if user_text:
            content_parts.insert(0, {"type": "text", "text": user_text})

        if not content_parts:
            return None

        # Build OpenRouter request
        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": MODERATION_PROMPT,
                },
                {
                    "role": "user",
                    "content": content_parts,
                },
            ],
            "temperature": 0.1,
            "max_tokens": 1024,
        }

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Social Scam Detector",
        }

        # Call OpenRouter with retry on rate limit
        response = None
        for attempt in range(MAX_RETRIES):
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    OPENROUTER_BASE_URL,
                    json=payload,
                    headers=headers,
                )

            if response.status_code == 429:
                # Rate limited — retry with exponential backoff
                delay = RETRY_BASE_DELAY * (2 ** attempt)
                print(f"⚠️  Rate limited (429). Retrying in {delay}s... (attempt {attempt + 1}/{MAX_RETRIES})")
                await asyncio.sleep(delay)
                continue
            elif response.status_code != 200:
                print(f"⚠️  OpenRouter returned {response.status_code}: {response.text[:200]}")
                return None
            else:
                break  # Success

        if response is None or response.status_code != 200:
            print(f"⚠️  OpenRouter failed after {MAX_RETRIES} retries")
            return None

        data = response.json()
        print(f"   📡 OpenRouter response model: {data.get('model', 'unknown')}")

        # Extract response text safely
        choices = data.get("choices", [])
        if not choices:
            print(f"⚠️  OpenRouter returned no choices: {json.dumps(data)[:300]}")
            return None

        message_content = choices[0].get("message", {}).get("content")
        if not message_content:
            print(f"⚠️  OpenRouter returned empty content: {json.dumps(data)[:300]}")
            return None

        response_text = message_content.strip()
        print(f"   📝 AI raw response: {response_text[:200]}")

        # Remove markdown code fences if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            # Remove first and last line (``` markers)
            response_text = "\n".join(lines[1:-1])

        result = json.loads(response_text)
        result["analysis_type"] = analysis_type
        return result

    except Exception as e:
        print(f"⚠️  AI analysis error: {e}")
        return None


# ─── RoBERTa ML Prediction ──────────────────────────────────
def roberta_predict(text: str) -> dict | None:
    """Run RoBERTa text classification."""
    if not text or not text.strip():
        return None

    if model is None or tokenizer is None:
        return None

    text = text.strip()

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128,
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)

    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
    prob_safe = probs[0][0].item()
    prob_spam = probs[0][1].item()

    is_scam = prob_spam > SPAM_THRESHOLD

    return {
        "is_scam": is_scam,
        "confidence": round(prob_spam if is_scam else prob_safe, 4),
        "reason": f"Text classified as {'spam/scam' if is_scam else 'safe'} (confidence: {(prob_spam if is_scam else prob_safe):.1%})",
        "label": "spam" if is_scam else "safe",
    }


# ─── Original Text-Only Endpoint (backward compatible) ──────
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    """
    Classify text as spam/scam or safe using RoBERTa.
    Backward compatible — same response format as before.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text content is required.")

    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    result = roberta_predict(req.text)
    return PredictResponse(**result)


# ─── NEW: Combined AI + ML Analysis Endpoint ────────────────
@app.post("/analyze", response_model=CombinedPredictResponse)
async def analyze(req: PredictRequest):
    """
    Combined scam detection using BOTH RoBERTa ML model AND AI (via OpenRouter).
    Analyzes text AND images for comprehensive scam detection.

    Returns combined result with individual scores from each system.
    """
    if not req.text and not req.image_url:
        raise HTTPException(status_code=400, detail="Text content or image URL is required.")

    print(f"\n🔍 Combined analysis starting...")
    print(f"   Text: {req.text[:80] if req.text else 'None'}...")
    print(f"   Image: {req.image_url[:80] if req.image_url else 'None'}")

    # RoBERTa (sync)
    ml_result = None
    if req.text and req.text.strip():
        ml_result = roberta_predict(req.text)

    # AI via OpenRouter (async)
    ai_result = await ai_analyze(req.text, req.image_url)

    print(f"   🤖 ML result: {ml_result}")
    print(f"   🧠 AI result: {ai_result}")

    # ─── Combine Results ─────────────────────────────────────
    ml_is_scam = ml_result["is_scam"] if ml_result else False
    ml_confidence = ml_result["confidence"] if ml_result else 0.0
    ml_scam_score = ml_confidence if ml_is_scam else (1 - ml_confidence)

    ai_is_scam = ai_result.get("is_scam", False) if ai_result else False
    ai_scam_score = ai_result.get("scam_score", 0.0) if ai_result else 0.0

    reasons = []
    is_scam = False
    final_confidence = 0.0

    if ml_is_scam and ai_is_scam:
        # Both agree it's scam — high confidence
        is_scam = True
        final_confidence = max(ml_scam_score, ai_scam_score)
        reasons.append(f"ML model: scam ({ml_scam_score:.0%})")
        reasons.append(f"AI analysis: scam ({ai_scam_score:.0%})")
        if ai_result and ai_result.get("categories"):
            reasons.append(f"Categories: {', '.join(ai_result['categories'])}")
    elif ai_is_scam:
        # Only AI says scam (might have detected image-based scam)
        is_scam = True
        final_confidence = ai_scam_score
        reasons.append(f"AI detected scam ({ai_scam_score:.0%})")
        if ai_result and ai_result.get("reason"):
            reasons.append(ai_result["reason"])
        if ai_result and ai_result.get("categories"):
            reasons.append(f"Categories: {', '.join(ai_result['categories'])}")
    elif ml_is_scam:
        # Only ML says scam
        is_scam = True
        final_confidence = ml_scam_score
        reasons.append(f"ML model detected spam/scam ({ml_scam_score:.0%})")
    else:
        # Both say safe
        is_scam = False
        if ai_result:
            final_confidence = ai_result.get("safe_score", 0.0)
            reasons.append("AI analysis: content appears safe")
        elif ml_result:
            final_confidence = ml_confidence
            reasons.append("ML analysis: content appears safe")
        else:
            final_confidence = 0.5
            reasons.append("Analysis inconclusive")

    combined_reason = " | ".join(reasons)
    label = "spam" if is_scam else "safe"

    print(f"   ✅ Combined: is_scam={is_scam}, confidence={final_confidence:.4f}")

    return CombinedPredictResponse(
        is_scam=is_scam,
        confidence=round(final_confidence, 4),
        reason=combined_reason,
        label=label,
        ml_result=ml_result,
        ai_result=ai_result,
    )


# ─── AI-Only Analysis Endpoint ──────────────────────────────
@app.post("/analyze/ai", response_model=AIAnalysisResponse)
async def analyze_ai_only(req: PredictRequest):
    """
    Analyze content using AI only (text + image) via OpenRouter.
    """
    if not ai_ready:
        raise HTTPException(status_code=503, detail="AI is not configured. Set OPENROUTER_API_KEY.")

    if not req.text and not req.image_url:
        raise HTTPException(status_code=400, detail="Text content or image URL is required.")

    result = await ai_analyze(req.text, req.image_url)
    if not result:
        raise HTTPException(status_code=500, detail="AI analysis failed.")

    return AIAnalysisResponse(
        is_scam=result.get("is_scam", False),
        scam_score=result.get("scam_score", 0.0),
        safe_score=result.get("safe_score", 1.0),
        reason=result.get("reason", ""),
        categories=result.get("categories", []),
        analysis_type=result.get("analysis_type", "unknown"),
    )


# ─── Health Check ────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "ai_available": ai_ready,
        "ai_model": OPENROUTER_MODEL if ai_ready else None,
        "device": str(device) if device else "not initialized",
    }


# ─── Run Server ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    print(f"\n🚀 Starting Text & Image Moderation API on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
