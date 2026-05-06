# 🎫 TicketAI — Email-Based Support Ticket Routing System

> An AI-powered system that automatically classifies customer support emails into categories using NLP and Machine Learning.

---

## 🔹 Problem Statement

In customer support systems, organizations receive a large volume of emails daily which need to be manually analyzed and assigned to appropriate departments. This manual process is time-consuming, error-prone, and inefficient.

This project builds an **AI-powered ticket routing system** that automatically converts incoming emails into support tickets and classifies them into predefined categories using **Natural Language Processing** and **Machine Learning**.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🏷️ **Auto Classification** | Routes emails to Billing, Technical, Account, or General |
| 📊 **Confidence Score** | Shows model confidence (0–100%) with animated bar |
| 🚨 **Priority Detection** | Detects High / Medium / Low urgency via keyword heuristics |
| 📋 **Session History** | Logs all classifications in the current session |
| ⚡ **Quick Fill** | One-click sample emails for fast demo |

---

## 🛠️ Tech Stack

- **Language**: Python 3.8+
- **ML**: scikit-learn (Logistic Regression + TF-IDF)
- **NLP**: TF-IDF Vectorizer with bigrams + stopword removal
- **Backend**: Flask REST API
- **Frontend**: Vanilla HTML/CSS/JS (no frameworks)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the App (one command)
```bash
python run.py
```

This will:
1. Auto-train the model if not already trained
2. Launch the web app at [http://localhost:5000](http://localhost:5000)

### 3. Manual Steps (optional)
```bash
# Train model separately
python model/train.py

# Start Flask server separately
python app/app.py
```

---

## 📁 Project Structure

```
tickets-router/
├── data/
│   └── tickets.csv          # ~200 labeled training samples
├── model/
│   ├── train.py             # Training script
│   └── predict.py           # Prediction utilities
├── app/
│   ├── app.py               # Flask REST API
│   ├── templates/
│   │   └── index.html       # Web UI
│   └── static/
│       ├── style.css        # Dark glassmorphism styles
│       └── script.js        # Frontend logic
├── artifacts/
│   ├── model.pkl            # Saved Logistic Regression model
│   └── vectorizer.pkl       # Saved TF-IDF vectorizer
├── requirements.txt
├── run.py                   # One-click launcher
└── README.md
```

---

## 📊 Model Details

| Component | Detail |
|-----------|--------|
| Vectorizer | TF-IDF, max 5000 features, unigrams + bigrams, sublinear TF |
| Classifier | Logistic Regression, C=1.0, lbfgs solver |
| Train/Test | 80% / 20% stratified split |
| Categories | Billing, Technical, Account, General |
| Expected Accuracy | ~90%+ on test split |

---

## 🌐 API Reference

### `POST /classify`
Classify an email text.

**Request:**
```json
{ "email_text": "I was charged twice for my subscription" }
```

**Response:**
```json
{
  "category": "Billing",
  "confidence": 0.9421,
  "confidence_pct": 94.2,
  "priority": "Medium",
  "color": "#f59e0b",
  "icon": "💳",
  "all_scores": {
    "Account": 0.021,
    "Billing": 0.9421,
    "General": 0.018,
    "Technical": 0.019
  }
}
```

### `GET /health`
```json
{ "status": "ok", "service": "Email Ticket Router" }
```

---

## 🧠 Concepts Covered

- **NLP Preprocessing** — Lowercasing, stop word removal
- **TF-IDF Vectorization** — Text-to-vector representation with bigrams
- **Text Classification** — Multi-class classification with Logistic Regression
- **Supervised Learning** — Labeled dataset training & evaluation
- **Model Persistence** — Saving/loading with `pickle`
- **REST API Design** — Flask endpoint for model inference
- **Priority Detection** — Rule-based keyword heuristics
- **Model Evaluation** — Accuracy, precision, recall, F1-score

---

## 🎯 Interview Description

> *"I built an Email-based Ticket Routing System that automatically classifies incoming customer support emails into categories like Billing, Technical Issue, Account Management, and General Queries. I used TF-IDF with bigrams for text representation and Logistic Regression for multi-class classification, achieving ~90% accuracy. The system also detects email urgency (High/Medium/Low priority) using keyword heuristics. I built a Flask REST API for model serving and a premium dark-mode web UI for live demonstration. This system helps automate support workflows and significantly reduce manual routing effort."*
