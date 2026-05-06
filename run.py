"""
TicketAI — One-Click Launcher
==============================
Trains the model (if not already trained) and starts the Flask web app.

Usage:
    python run.py
"""

import os
import sys
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "artifacts", "model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "artifacts", "vectorizer.pkl")


def train_if_needed():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        print("=" * 55)
        print("  🔧  Model artifacts not found. Training now...")
        print("=" * 55)
        train_script = os.path.join(BASE_DIR, "model", "train.py")
        result = subprocess.run([sys.executable, train_script], cwd=BASE_DIR)
        if result.returncode != 0:
            print("\n[ERROR] Training failed. Please check the error above.")
            sys.exit(1)
        print("\n[✅] Model trained and ready!\n")
    else:
        print("[✅] Model artifacts found. Skipping training.\n")


def launch_app():
    print("=" * 55)
    print("  🚀  Launching TicketAI Web Application")
    print("=" * 55)
    print("  URL: http://localhost:5000")
    print("  Press Ctrl+C to stop")
    print("=" * 55 + "\n")

    app_script = os.path.join(BASE_DIR, "app", "app.py")
    os.environ["FLASK_ENV"] = "development"
    subprocess.run([sys.executable, app_script], cwd=BASE_DIR)


if __name__ == "__main__":
    print("\n🎫  TicketAI — Email Support Ticket Routing System\n")
    train_if_needed()
    launch_app()
