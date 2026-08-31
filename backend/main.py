from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import joblib
import shap
import pandas as pd
import numpy as np
import os
import requests

app = FastAPI(title="SIH26001 Landslide Risk API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use absolute path resolving to ensure uvicorn finds the model no matter where it's launched
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, 'landslide_model.pkl')

try:
    model = joblib.load(model_path)
    explainer = shap.TreeExplainer(model)
    feature_names = ['rainfall_24h', 'soil_moisture', 'slope_steepness', 'vegetation_index']
    print("Machine Learning Model loaded successfully!")
except Exception as e:
    model = None
    print(f"CRITICAL ERROR LOADING MODEL: {e}")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Landslide Risk API is running."}

@app.get("/api/risk-data")
def get_risk_data():
    hotspots = [
        {"name": "Gangtok (Sikkim)", "lat": 27.3389, "lng": 88.6065, "slope": 45.0, "veg": 0.6},
        {"name": "Guwahati (Assam)", "lat": 26.1445, "lng": 91.7362, "slope": 15.0, "veg": 0.3},
        {"name": "Shillong (Meghalaya)", "lat": 25.5788, "lng": 91.8933, "slope": 35.0, "veg": 0.7},
        {"name": "Tawang (Arunachal Pradesh)", "lat": 27.5878, "lng": 91.8601, "slope": 55.0, "veg": 0.4},
        {"name": "Kohima (Nagaland)", "lat": 25.6751, "lng": 94.1086, "slope": 40.0, "veg": 0.5}
    ]
    
    live_records = []
    for spot in hotspots:
        # Fetch REAL LIVE weather data from Open-Meteo API (Free, No Auth required)
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={spot['lat']}&longitude={spot['lng']}&current=precipitation,relative_humidity_2m"
            resp = requests.get(url, timeout=3).json()
            
            # Precipitation is returned per hour. We scale it up to estimate a 24h impact for the model.
            current_rain_mm = resp['current']['precipitation']
            rain = current_rain_mm * 24  
            
            # Use real-time Relative Humidity as a direct proxy for top-layer soil moisture
            moist = resp['current']['relative_humidity_2m']
        except Exception as e:
            print(f"Weather API Error for {spot['name']}: {e}")
            # Fallback to safe/stable weather if API fails
            rain = 0.0
            moist = 40.0

        live_records.append({
            'rainfall_24h': rain,
            'soil_moisture': moist,
            'slope_steepness': spot['slope'],
            'vegetation_index': spot['veg']
        })
        
    df_live = pd.DataFrame(live_records)
    
    features = []
    
    if model:
        try:
            probabilities = model.predict_proba(df_live)[:, 1] * 100
            shap_vals = explainer.shap_values(df_live)
            
            # Handle SHAP dimension changes across different library versions
            if isinstance(shap_vals, list):
                shap_vals = shap_vals[1]
            elif len(np.shape(shap_vals)) == 3:
                shap_vals = shap_vals[:, :, 1]

            for i, spot in enumerate(hotspots):
                risk_score = round(probabilities[i], 1)
                local_shap = shap_vals[i]
                
                explanations = []
                for j, feature in enumerate(feature_names):
                    impact_val = float(local_shap[j])
                    if impact_val > 0.02:
                        actual_val = df_live.iloc[i][feature]
                        val_str = f"{actual_val:.1f}"
                        if feature == 'rainfall_24h': val_str += " mm"
                        elif feature == 'soil_moisture': val_str += "%"
                        elif feature == 'slope_steepness': val_str += " deg"
                        
                        explanations.append({
                            "factor": feature.replace('_', ' ').title(),
                            "value": val_str,
                            "impact": "High" if impact_val > 0.1 else "Moderate",
                            "shap_weight": float(impact_val)
                        })
                
                explanations.sort(key=lambda x: x["shap_weight"], reverse=True)
                if not explanations or risk_score < 40:
                    explanations = [{"factor": "Status", "value": "Stable weather conditions", "impact": "None"}]
                    
                feature_geojson = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [spot["lng"], spot["lat"]]
                    },
                    "properties": {
                        "location": spot["name"],
                        "riskScore": risk_score,
                        "explanations": explanations
                    }
                }
                features.append(feature_geojson)
        except Exception as e:
            error_details = str(e)
            print(f"Error generating predictions/SHAP: {e}")
            
    # Fallback to ensure the map NEVER goes blank if ML fails
    if not features:
        for spot in hotspots:
            risk_score = 85 if "Tawang" in spot["name"] else 40
            
            err_msg = error_details if 'error_details' in locals() else "Model failed to load (Check Start Command)"
            
            feature_geojson = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [spot["lng"], spot["lat"]]
                },
                "properties": {
                    "location": spot["name"],
                    "riskScore": risk_score,
                    "explanations": [{"factor": "Error Details", "value": err_msg, "impact": "None"}]
                }
            }
            features.append(feature_geojson)
            
    return {
        "type": "FeatureCollection",
        "features": features
    }
