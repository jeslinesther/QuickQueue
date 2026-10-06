import os
import joblib
import pandas as pd

_model = None

def get_model():
    global _model
    if _model is None:
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model.pkl')
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Trained model file not found at {model_path}. Please run train_model.py first.")
        _model = joblib.load(model_path)
    return _model

def predict_wait_time(data):
    """
    Predict waiting time given a dictionary of queue characteristics.
    Expected keys:
      - queue_length: int
      - active_counters: int
      - service_type: str
      - average_service_time: float/int
      - hour: int
      - day_of_week: int
      - peak_hour: int
    """
    model = get_model()

    input_df = pd.DataFrame([{
        'queue_length': int(data.get('queue_length', 1)),
        'active_counters': max(1, int(data.get('active_counters', 1))),
        'service_type': str(data.get('service_type', 'General Consultation')),
        'average_service_time': float(data.get('average_service_time', 5.0)),
        'hour': int(data.get('hour', 12)),
        'day_of_week': int(data.get('day_of_week', 2)),
        'peak_hour': int(data.get('peak_hour', 0))
    }])

    raw_prediction = model.predict(input_df)[0]
    # Ensure prediction is positive and realistic
    predicted_minutes = max(1, int(round(raw_prediction)))
    return predicted_minutes

if __name__ == '__main__':
    # Test sample prediction
    sample_input = {
        "queue_length": 10,
        "active_counters": 2,
        "service_type": "General Consultation",
        "average_service_time": 5,
        "hour": 14,
        "day_of_week": 2,
        "peak_hour": 0
    }
    pred = predict_wait_time(sample_input)
    print(f"Sample prediction for {sample_input['queue_length']} people in queue: {pred} minutes")
