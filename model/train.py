"""
Email Support Ticket Routing System — Model Training Script
============================================================
Trains a TF-IDF + Logistic Regression classifier on tickets.csv
and saves the model artifacts to the /artifacts directory.
"""

import os
import sys
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "tickets.csv")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "model.pkl")
VECTORIZER_PATH = os.path.join(ARTIFACTS_DIR, "vectorizer.pkl")

os.makedirs(ARTIFACTS_DIR, exist_ok=True)


def load_data():
    """Load and validate the dataset."""
    print(f"[INFO] Loading dataset from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)

    if "email_text" not in df.columns or "category" not in df.columns:
        print("[ERROR] CSV must contain 'email_text' and 'category' columns.")
        sys.exit(1)

    df.dropna(inplace=True)
    df["email_text"] = df["email_text"].str.strip().str.lower()

    print(f"[INFO] Total samples: {len(df)}")
    print(f"[INFO] Category distribution:\n{df['category'].value_counts().to_string()}")
    return df


def train(df):
    """Vectorize text and train Logistic Regression model."""
    X = df["email_text"]
    y = df["category"]

    # TF-IDF with bigrams for richer features
    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=5000,
        ngram_range=(1, 2),
        sublinear_tf=True,
    )
    X_vec = vectorizer.fit_transform(X)

    # 80/20 stratified split
    X_train, X_test, y_train, y_test = train_test_split(
        X_vec, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\n[INFO] Training Logistic Regression model...")
    model = LogisticRegression(C=1.0, max_iter=1000, solver="lbfgs", multi_class="auto")
    model.fit(X_train, y_train)

    # ─── Evaluation ──────────────────────────────────────────────────────────
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print(f"\n{'='*55}")
    print(f"  [OK]  Test Accuracy: {acc * 100:.2f}%")
    print(f"{'='*55}")
    print("\n[INFO] Classification Report:")
    print(classification_report(y_test, y_pred))

    # ─── Save Artifacts ───────────────────────────────────────────────────────
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(VECTORIZER_PATH, "wb") as f:
        pickle.dump(vectorizer, f)

    print(f"[INFO] Model saved     -> {MODEL_PATH}")
    print(f"[INFO] Vectorizer saved -> {VECTORIZER_PATH}")
    print("\n[DONE] Training complete! Run 'python run.py' to launch the app.\n")

    return model, vectorizer


if __name__ == "__main__":
    df = load_data()
    train(df)
