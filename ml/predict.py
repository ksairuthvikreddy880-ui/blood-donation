"""
Standalone prediction loader.
Use this to load the saved model and make predictions without retraining.

Usage:
    python predict.py
    or import predict_acceptance from this module.
"""

import pickle
import numpy as np

with open("donor_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("donor_scaler.pkl", "rb") as f:
    scaler = pickle.load(f)


def predict_acceptance(
    distance_km: float,
    is_available: int,
    days_since_last_donation: int,
    past_accept_count: int,
    request_urgency: int,
) -> float:
    features = np.array([[distance_km, is_available,
                          days_since_last_donation, past_accept_count, request_urgency]])
    prob = model.predict_proba(scaler.transform(features))[0][1]
    return round(float(prob), 4)


if __name__ == "__main__":
    test_cases = [
        (1.0, 1, 120, 5, 1),
        (8.0, 0, 10,  0, 0),
        (3.0, 1, 60,  2, 0),
    ]
    for args in test_cases:
        p = predict_acceptance(*args)
        print(f"  dist={args[0]}km  avail={args[1]}  days={args[2]}  "
              f"past={args[3]}  urgency={args[4]}  →  {p:.1%}")
