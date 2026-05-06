"""
Email Support Ticket Routing System — Flask Backend API
=======================================================
Routes:
    GET  /           → Serve web UI
    POST /classify   → Classify email text, return JSON
    GET  /health     → API health check
"""

import os
import sys

from flask import Flask, request, jsonify, render_template

# Allow importing from parent directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from model.predict import classify_email

app = Flask(__name__, template_folder="templates", static_folder="static")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "Email Ticket Router"})


@app.route("/classify", methods=["POST"])
def classify():
    data = request.get_json(force=True, silent=True)

    if not data or "email_text" not in data:
        return jsonify({"error": "Missing 'email_text' field in request body."}), 400

    email_text = str(data["email_text"]).strip()

    if len(email_text) < 5:
        return jsonify({"error": "Email text is too short to classify."}), 400

    if len(email_text) > 5000:
        return jsonify({"error": "Email text exceeds 5000 character limit."}), 400

    try:
        result = classify_email(email_text)
        return jsonify(result)
    except FileNotFoundError as e:
        return jsonify({
            "error": str(e),
            "hint": "Run 'python model/train.py' to generate model artifacts."
        }), 503
    except Exception as e:
        return jsonify({"error": f"Classification failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
