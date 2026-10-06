import os
from flask import Flask, request, jsonify
from predict import predict_wait_time

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "QuickQueue AI Waiting Time Prediction Service"
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON payload provided"}), 400

        predicted_wait_time = predict_wait_time(data)

        return jsonify({
            "predicted_wait_time": predicted_wait_time
        }), 200
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('AI_PORT', 5001))
    print(f"Starting QuickQueue AI Prediction Service on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
