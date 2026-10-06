import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def train():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, 'dataset.csv')
    model_path = os.path.join(current_dir, 'model.pkl')

    print(f"Loading dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)

    features = [
        'queue_length',
        'active_counters',
        'service_type',
        'average_service_time',
        'hour',
        'day_of_week',
        'peak_hour'
    ]
    target = 'waiting_time_minutes'

    X = df[features]
    y = df[target]

    # Preprocessing pipeline
    categorical_features = ['service_type']
    numerical_features = [
        'queue_length',
        'active_counters',
        'average_service_time',
        'hour',
        'day_of_week',
        'peak_hour'
    ]

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features),
            ('num', 'passthrough', numerical_features)
        ]
    )

    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', LinearRegression())
    ])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"Training Linear Regression model on {len(X_train)} samples...")
    pipeline.fit(X_train, y_train)

    # Predictions and Evaluation
    y_pred = pipeline.predict(X_test)
    # Ensure no negative predictions
    y_pred = np.maximum(y_pred, 1.0)

    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)

    print("=" * 45)
    print("MODEL EVALUATION METRICS:")
    print(f"Mean Absolute Error (MAE)     : {mae:.2f} minutes")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f} minutes")
    print(f"R-squared (R2) Score          : {r2:.4f}")
    print("=" * 45)

    joblib.dump(pipeline, model_path)
    print(f"[SUCCESS] Model successfully trained and saved to: {model_path}")

if __name__ == '__main__':
    train()
