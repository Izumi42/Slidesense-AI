from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os
import requests
import time
import joblib
import shap

app = FastAPI(title="SIH26001 Landslide Risk API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PERFORMANCE OPTIMIZATION (DSA) ---
# 1. Memory Caching: Load model ONCE into global memory (O(1) access) 
# instead of doing expensive O(Disk) file reading on every single API request.
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, 'landslide_model.pkl')
try:
    GLOBAL_MODEL = joblib.load(model_path)
    # 2. CPU Optimization: Initialize the heavy SHAP TreeExplainer globally 
    # instead of rebuilding it from the Random Forest trees on every request.
    GLOBAL_EXPLAINER = shap.TreeExplainer(GLOBAL_MODEL)
except Exception as e:
    GLOBAL_MODEL = None
    GLOBAL_EXPLAINER = None
    print(f"Startup ML Error: {e}")

# 3. Hash Map Memoization: Cache API responses to prevent O(N) network bottlenecks
WEATHER_CACHE = {}
CACHE_TTL = 300 # Cache expires after 5 minutes (300 seconds)

@app.get("/api/risk-data")
def get_risk_data():
    hotspots = [
        {"name": "Gangtok (Sikkim)", "lat": 27.3389, "lng": 88.6065, "slope": 35.0, "veg": 0.6},
        {"name": "Guwahati (Assam)", "lat": 26.1445, "lng": 91.7362, "slope": 15.0, "veg": 0.4},
        {"name": "Shillong (Meghalaya)", "lat": 25.5788, "lng": 91.8933, "slope": 25.0, "veg": 0.7},
        {"name": "Tawang (Arunachal Pradesh)", "lat": 27.5878, "lng": 91.8601, "slope": 45.0, "veg": 0.5},
        {"name": "Kohima (Nagaland)", "lat": 25.6751, "lng": 94.1086, "slope": 30.0, "veg": 0.8},
    ]
    
    live_records = []
    current_time = time.time()
    
    for spot in hotspots:
        cache_key = spot["name"]
        
        # Use cached data if available and fresh (O(1) Hash Map lookup)
        if cache_key in WEATHER_CACHE and (current_time - WEATHER_CACHE[cache_key]['timestamp']) < CACHE_TTL:
            rain = WEATHER_CACHE[cache_key]['rain']
            moist = WEATHER_CACHE[cache_key]['moist']
        else:
            try:
                url = f"https://api.open-meteo.com/v1/forecast?latitude={spot['lat']}&longitude={spot['lng']}&current=precipitation,relative_humidity_2m"
                resp = requests.get(url, timeout=3).json()
                rain = resp['current']['precipitation'] * 24  
                moist = resp['current']['relative_humidity_2m']
                
                # Store in cache
                WEATHER_CACHE[cache_key] = {'rain': rain, 'moist': moist, 'timestamp': current_time}
            except Exception as e:
                print(f"Weather API Error for {spot['name']}: {e}")
                rain, moist = 0.0, 40.0

        live_records.append({
            'rainfall_24h': rain,
            'soil_moisture': moist,
            'slope_steepness': spot['slope'],
            'vegetation_index': spot['veg']
        })
        
    df_live = pd.DataFrame(live_records)
    features = []
    feature_names = ['rainfall_24h', 'soil_moisture', 'slope_steepness', 'vegetation_index']

    try:
        if GLOBAL_MODEL is None or GLOBAL_EXPLAINER is None:
            raise Exception("Global model not loaded")
            
        # Predict risk probability
        probabilities = GLOBAL_MODEL.predict_proba(df_live)[:, 1] * 100
        
        # Generate Explainable AI (SHAP) insights
        shap_vals = GLOBAL_EXPLAINER.shap_values(df_live)
        
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
                    if feature == 'rainfall_24h': val_str += "mm"
                    elif feature == 'soil_moisture': val_str += "%"
                    
                    explanations.append({
                        "factor": feature.replace("_", " ").title(),
                        "value": val_str,
                        "impact": "High" if impact_val > 0.1 else "Moderate"
                    })
                    
            if not explanations:
                explanations.append({"factor": "Status", "value": "Stable weather conditions", "impact": "None"})

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
            
    return {"type": "FeatureCollection", "features": features}
