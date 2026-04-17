"""
Donor Response Prediction Model
Blood Logistics System — Instant Blood Connect
Uses Logistic Regression to predict probability of donor acceptance.
"""

import numpy as np
import pandas as pd
import pickle
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

np.random.seed(42)

# ─────────────────────────────────────────────────────────────
# 1. DATASET GENERATION
# ─────────────────────────────────────────────────────────────

N = 700

distance_km            = np.random.uniform(0.5, 10, N)
is_available           = np.random.choice([0, 1], N, p=[0.35, 0.65])
days_since_last_donation = np.random.randint(0, 365, N)
past_accept_count      = np.random.randint(0, 11, N)
request_urgency        = np.random.choice([0, 1], N, p=[0.6, 0.4])

# Realistic acceptance probability based on feature logic
def acceptance_prob(dist, avail, days, past, urgency):
    score = 0.0
    score -= dist * 0.08          # closer = more likely
    score += avail * 1.5          # available = strong positive
    score += (days / 365) * 0.8   # longer since donation = more eligible
    score += past * 0.15          # past acceptances = reliable donor
    score += urgency * 0.4        # emergency = slightly more likely
    score -= 1.2                  # base offset
    prob = 1 / (1 + np.exp(-score))
    return prob

probs = np.array([
    acceptance_prob(distance_km[i], is_available[i], days_since_last_donation[i],
                    past_accept_count[i], request_urgency[i])
    for i in range(N)
])

accepted = (np.random.rand(N) < probs).astype(int)

df = pd.DataFrame({
    "distance_km":             distance_km,
    "is_available":            is_available,
    "days_since_last_donation": days_since_last_donation,
    "past_accept_count":       past_accept_count,
    "request_urgency":         request_urgency,
    "accepted":                accepted,
})

print("=" * 55)
print("DATASET OVERVIEW")
print("=" * 55)
print(df.describe().round(2))
print(f"\nAcceptance rate: {df['accepted'].mean():.1%}")
print(f"Total samples  : {len(df)}")

# ─────────────────────────────────────────────────────────────
# 2. MODEL TRAINING
# ─────────────────────────────────────────────────────────────

FEATURES = ["distance_km", "is_available", "days_since_last_donation",
            "past_accept_count", "request_urgency"]

X = df[FEATURES].values
y = df["accepted"].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

model = LogisticRegression(max_iter=1000, random_state=42)
model.fit(X_train_scaled, y_train)

print("\n" + "=" * 55)
print("MODEL TRAINED — Logistic Regression")
print("=" * 55)

# ─────────────────────────────────────────────────────────────
# 3. EVALUATION
# ─────────────────────────────────────────────────────────────

y_pred  = model.predict(X_test_scaled)
y_proba = model.predict_proba(X_test_scaled)[:, 1]

print(f"\nAccuracy : {accuracy_score(y_test, y_pred):.2%}")
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["Rejected", "Accepted"]))

print("Sample Predictions (first 8 test rows):")
sample_df = pd.DataFrame({
    "Actual":      y_test[:8],
    "Predicted":   y_pred[:8],
    "Probability": y_proba[:8].round(3),
})
print(sample_df.to_string(index=False))

# ─────────────────────────────────────────────────────────────
# 4. FEATURE IMPORTANCE (EXPLAINABILITY)
# ─────────────────────────────────────────────────────────────

print("\n" + "=" * 55)
print("FEATURE IMPORTANCE (Model Coefficients)")
print("=" * 55)

coef_df = pd.DataFrame({
    "Feature":     FEATURES,
    "Coefficient": model.coef_[0].round(4),
}).sort_values("Coefficient", ascending=False)

print(coef_df.to_string(index=False))

print("\nExplanations:")
explanations = {
    "distance_km":              "Lower distance → higher acceptance probability",
    "is_available":             "Availability strongly increases response likelihood",
    "days_since_last_donation": "More days since last donation → donor is eligible & more likely to accept",
    "past_accept_count":        "More past acceptances → reliable donor, higher probability",
    "request_urgency":          "Emergency requests slightly increase acceptance probability",
}
for feat, coef in zip(coef_df["Feature"], coef_df["Coefficient"]):
    direction = "↑ increases" if coef > 0 else "↓ decreases"
    print(f"  • {feat:30s} {direction} acceptance  (coef={coef:+.4f})")
    print(f"    → {explanations[feat]}")

# ─────────────────────────────────────────────────────────────
# 5. PREDICTION FUNCTION
# ─────────────────────────────────────────────────────────────

def predict_acceptance(
    distance_km: float,
    is_available: int,
    days_since_last_donation: int,
    past_accept_count: int,
    request_urgency: int,
) -> float:
    """
    Predict probability that a donor will accept a blood request.

    Parameters
    ----------
    distance_km              : Distance from requester to donor (km)
    is_available             : 1 if donor is currently available, else 0
    days_since_last_donation : Days since the donor last donated blood
    past_accept_count        : Number of past accepted requests
    request_urgency          : 1 for emergency, 0 for normal

    Returns
    -------
    float : Acceptance probability between 0 and 1
    """
    features = np.array([[
        distance_km,
        is_available,
        days_since_last_donation,
        past_accept_count,
        request_urgency,
    ]])
    features_scaled = scaler.transform(features)
    prob = model.predict_proba(features_scaled)[0][1]
    return round(float(prob), 4)


# Demo predictions
print("\n" + "=" * 55)
print("DEMO PREDICTIONS")
print("=" * 55)

demos = [
    (1.0, 1, 120, 5, 1, "Nearby, available, eligible, experienced, emergency"),
    (8.0, 0, 10,  0, 0, "Far, unavailable, recently donated, no history, normal"),
    (3.0, 1, 60,  2, 0, "Moderate distance, available, eligible, some history"),
    (0.5, 1, 200, 8, 1, "Very close, available, long gap, high history, emergency"),
]

for dist, avail, days, past, urg, desc in demos:
    prob = predict_acceptance(dist, avail, days, past, urg)
    label = "LIKELY ✓" if prob >= 0.5 else "UNLIKELY ✗"
    print(f"\n  {desc}")
    print(f"  → Probability: {prob:.1%}  [{label}]")

# ─────────────────────────────────────────────────────────────
# 6. SAVE MODEL
# ─────────────────────────────────────────────────────────────

with open("donor_model.pkl", "wb") as f:
    pickle.dump(model, f)

with open("donor_scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

print("\n" + "=" * 55)
print("Model saved → donor_model.pkl")
print("Scaler saved → donor_scaler.pkl")
print("=" * 55)
