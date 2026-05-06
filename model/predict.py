"""
Email Support Ticket Routing System — Prediction Utilities
===========================================================
Loads saved model artifacts and exposes classify_email() for the Flask API.
"""

import os
import re
import pickle

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "model.pkl")
VECTORIZER_PATH = os.path.join(ARTIFACTS_DIR, "vectorizer.pkl")

# ─── Priority keyword rules ───────────────────────────────────────────────────
HIGH_PRIORITY_KEYWORDS = [
    r"\burgent\b", r"\basap\b", r"\bimmediately\b", r"\bcritical\b",
    r"\bemergency\b", r"\bright now\b", r"\bseverely\b", r"\bcompletely broken\b",
    r"\bcannot work\b", r"\bblocking\b", r"\bescalate\b",
]
MEDIUM_PRIORITY_KEYWORDS = [
    r"\bsoon\b", r"\bquick\b", r"\bquickly\b", r"\bproblem\b", r"\bissue\b",
    r"\bfailed\b", r"\berror\b", r"\bnot working\b", r"\bbroken\b",
    r"\bcrashing\b", r"\bcrash\b", r"\bincorrect\b", r"\bwrong\b",
]

# ─── Category colors & icons for the UI ──────────────────────────────────────
CATEGORY_META = {
    "Billing":   {"color": "#f59e0b", "icon": "💳", "badge": "warning"},
    "Technical": {"color": "#ef4444", "icon": "⚙️",  "badge": "danger"},
    "Account":   {"color": "#3b82f6", "icon": "👤", "badge": "info"},
    "General":   {"color": "#10b981", "icon": "💬", "badge": "success"},
}

# ─── Load artifacts ──────────────────────────────────────────────────────────
_model = None
_vectorizer = None


def _load_artifacts():
    global _model, _vectorizer
    if _model is None or _vectorizer is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
            raise FileNotFoundError(
                "Model artifacts not found. Run 'python model/train.py' first."
            )
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
        with open(VECTORIZER_PATH, "rb") as f:
            _vectorizer = pickle.load(f)


def _detect_priority(text: str) -> str:
    """Detect priority based on keyword heuristics."""
    text_lower = text.lower()
    for pattern in HIGH_PRIORITY_KEYWORDS:
        if re.search(pattern, text_lower):
            return "High"
    for pattern in MEDIUM_PRIORITY_KEYWORDS:
        if re.search(pattern, text_lower):
            return "Medium"
    return "Low"


def classify_email(text: str) -> dict:
    """
    Classify an email text and return a full result dict.

    Returns:
        {
            "category": str,
            "confidence": float,   # 0.0–1.0
            "priority": str,       # High | Medium | Low
            "color": str,          # hex color for UI
            "icon": str,           # emoji icon
            "all_scores": dict     # category → probability
        }
    """
    _load_artifacts()

    cleaned = text.strip().lower()
    vec = _vectorizer.transform([cleaned])

    category = _model.predict(vec)[0]
    proba = _model.predict_proba(vec)[0]
    classes = _model.classes_

    confidence = float(max(proba))
    all_scores = {cls: round(float(p), 4) for cls, p in zip(classes, proba)}
    priority = _detect_priority(text)
    meta = CATEGORY_META.get(category, {"color": "#6366f1", "icon": "📧", "badge": "primary"})

    return {
        "category": category,
        "confidence": round(confidence, 4),
        "confidence_pct": round(confidence * 100, 1),
        "priority": priority,
        "color": meta["color"],
        "icon": meta["icon"],
        "badge": meta["badge"],
        "all_scores": all_scores,
    }
