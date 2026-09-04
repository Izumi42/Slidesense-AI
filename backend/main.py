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
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

try:
    GLOBAL_MODEL = joblib.load(os.path.join(os.path.dirname(__file__), 'landslide_model.pkl'))
    GLOBAL_EXPLAINER = shap.TreeExplainer(GLOBAL_MODEL)
except:
    GLOBAL_MODEL, GLOBAL_EXPLAINER = None, None

WEATHER_CACHE = {}

@app.get("/api/risk-data")
def get_risk_data(demo: bool = False, date: str = None):
    hotspots = [
        {"name": "Gangtok (Sikkim)", "lat": 27.3389, "lng": 88.6065, "slope": 35.0, "veg": 0.6},
        {"name": "Guwahati (Assam)", "lat": 26.1445, "lng": 91.7362, "slope": 15.0, "veg": 0.4},
        {"name": "Shillong (Meghalaya)", "lat": 25.5788, "lng": 91.8933, "slope": 25.0, "veg": 0.7},
        {"name": "Tawang (Arunachal Pradesh)", "lat": 27.5878, "lng": 91.8601, "slope": 45.0, "veg": 0.5},
        {"name": "Kohima (Nagaland)", "lat": 25.6751, "lng": 94.1086, "slope": 30.0, "veg": 0.8},
    ]
    
    live_records, features, current_time = [], [], time.time()
    
    for spot in hotspots:
        name = spot["name"]
        cache_key = f"{name}_{date}_{demo}"
        
        if cache_key in WEATHER_CACHE and (current_time - WEATHER_CACHE[cache_key]['timestamp']) < 300:
            rain, moist = WEATHER_CACHE[cache_key]['rain'], WEATHER_CACHE[cache_key]['moist']
        else:
            try:
                if date:
                    # Fetch Historical Data for the exact date selected
                    url = f"https://archive-api.open-meteo.com/v1/archive?latitude={spot['lat']}&longitude={spot['lng']}&start_date={date}&end_date={date}&daily=precipitation_sum&timezone=auto"
                    resp = requests.get(url, timeout=3).json()
                    rain = resp['daily']['precipitation_sum'][0]
                    if rain is None: rain = 0.0
                    moist = min(95.0, 30.0 + (rain * 0.8)) # Derived historical moisture
                else:
                    # Fetch Live Current Data
                    resp = requests.get(f"https://api.open-meteo.com/v1/forecast?latitude={spot['lat']}&longitude={spot['lng']}&current=precipitation,relative_humidity_2m", timeout=3).json()
                    rain, moist = resp['current']['precipitation'] * 24, resp['current']['relative_humidity_2m']
                    
                WEATHER_CACHE[cache_key] = {'rain': rain, 'moist': moist, 'timestamp': current_time}
            except Exception as e:
                print(f"Weather Fetch Error: {e}")
                rain, moist = 0.0, 40.0

        # --- HACKATHON DEMO OVERRIDE ---
        if demo and "Tawang" in name:
            rain, moist = 260.0, 88.0
        # -------------------------------

        live_records.append({'rainfall_24h': rain, 'soil_moisture': moist, 'slope_steepness': spot['slope'], 'vegetation_index': spot['veg']})
        
    df_live = pd.DataFrame(live_records)
    feature_names = ['rainfall_24h', 'soil_moisture', 'slope_steepness', 'vegetation_index']

    try:
        probabilities = GLOBAL_MODEL.predict_proba(df_live)[:, 1] * 100
        shap_vals = GLOBAL_EXPLAINER.shap_values(df_live)
        
        if isinstance(shap_vals, list): shap_vals = shap_vals[1]
        elif len(np.shape(shap_vals)) == 3: shap_vals = shap_vals[:, :, 1]

        for i, spot in enumerate(hotspots):
            risk_score, local_shap, exps = round(probabilities[i], 1), shap_vals[i], []
            for j, f in enumerate(feature_names):
                impact = float(local_shap[j])
                if impact > 0.02:
                    val = f"{df_live.iloc[i][f]:.1f}{'mm' if f == 'rainfall_24h' else '%' if f == 'soil_moisture' else ''}"
                    exps.append({"factor": f.replace("_", " ").title(), "value": val, "impact": "High" if impact > 0.1 else "Moderate"})
                    
            if not exps: exps.append({"factor": "Status", "value": "Stable weather conditions", "impact": "None"})

            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [spot["lng"], spot["lat"]]},
                "properties": {"location": spot["name"], "riskScore": risk_score, "explanations": exps}
            })
    except Exception as e:
        return {"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [0,0]}, "properties": {"location": "Error", "riskScore": 0, "explanations": [{"factor": "Error", "value": str(e), "impact": "None"}]}}]}
        
    return {"type": "FeatureCollection", "features": features}
