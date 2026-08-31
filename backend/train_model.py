import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

print("1. Generating synthetic historical data for NER...")
np.random.seed(42)
n_samples = 2000

# Generating realistic features for landslide risk
# rainfall_24h (mm): 0 to 300mm
# soil_moisture (%): 10% to 90%
# slope_steepness (degrees): 0 to 65 degrees
# vegetation_index (0 to 1): 0 is barren, 1 is dense forest
rainfall_24h = np.random.uniform(0, 300, n_samples)
soil_moisture = np.random.uniform(10, 90, n_samples)
slope_steepness = np.random.uniform(0, 65, n_samples)
vegetation_index = np.random.uniform(0, 1, n_samples)

# We create a mathematical baseline for actual risk to train against
# Higher rainfall, higher moisture, steeper slope, lower vegetation = higher risk
base_risk = (rainfall_24h * 0.35) + (soil_moisture * 0.4) + (slope_steepness * 1.5) - (vegetation_index * 40)

# The top 20% most dangerous combinations will result in a landslide (Class 1)
threshold = np.percentile(base_risk, 80)
target = (base_risk > threshold).astype(int)

df = pd.DataFrame({
    'rainfall_24h': rainfall_24h,
    'soil_moisture': soil_moisture,
    'slope_steepness': slope_steepness,
    'vegetation_index': vegetation_index,
    'landslide_occurred': target
})

# Save the dataset so you can show it to the judges
df.to_csv('ner_historical_data.csv', index=False)
print("-> Data saved to ner_historical_data.csv")

# 2. Train the Machine Learning Model
print("\n2. Training Random Forest Classifier...")
X = df.drop('landslide_occurred', axis=1)
y = df['landslide_occurred']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
model.fit(X_train, y_train)

score = model.score(X_test, y_test)
print(f"-> Model Accuracy on test set: {score * 100:.2f}%")

# 3. Save the model to disk
joblib.dump(model, 'landslide_model.pkl')
print("\n3. Model successfully saved to landslide_model.pkl")
