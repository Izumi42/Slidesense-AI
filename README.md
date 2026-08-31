# 🏔️ SlideSense AI: Early Warning Landslide System (NER)
**SIH26001 Hackathon Submission**

SlideSense AI is a full-stack, machine learning-powered early warning system designed specifically for the North Eastern Region (NER) of India. It ingests real-time weather data and generates highly accurate landslide risk scores using Explainable AI (XAI).

## 🚀 Live Demo
* **Frontend Dashboard:** [https://slidesense-ai.vercel.app](https://slidesense-ai.vercel.app) *(Note: Tawang is currently in 'Demo Mode' simulating a massive storm for presentation purposes).*
* **Backend API:** [https://slidesense-ai.onrender.com/api/risk-data](https://slidesense-ai.onrender.com/api/risk-data)

## ✨ Key Features & Novelty
1. **Explainable AI (XAI):** We don't just output a raw risk score. Using **SHAP (SHapley Additive exPlanations)**, our dashboard tells authorities *exactly* which environmental factor (e.g., 24h rainfall vs soil moisture) is driving the risk.
2. **Real-Time Data Integration:** Silently fetches live weather data (Open-Meteo) and processes it through our trained Random Forest model.
3. **Dynamic Heatmap UI:** Interactive map built with React-Leaflet offering 25km radius heat zones, pop-up alerts, and color-coded risk prioritization.

## ⚡ DSA & Performance Optimizations
* **$O(1)$ Hash Map Memoization:** Implemented a TTL (Time-To-Live) caching layer to prevent $O(N)$ network bottlenecks when fetching live weather API data. Drops response time from ~3000ms to ~15ms.
* **$O(1)$ Memory Access:** Eliminated Disk I/O bottlenecks by hoisting the `.pkl` Machine Learning model and the SHAP TreeExplainer into global memory space at startup. 
* **Dynamic Training on Boot:** Circumvents cloud library version drift by natively training the Random Forest algorithm on the deployment server right before booting.

## 🛠️ Tech Stack
* **Frontend:** Next.js 14, React, TailwindCSS, React-Leaflet
* **Backend:** Python, FastAPI, Uvicorn
* **Machine Learning:** Scikit-Learn (Random Forest), SHAP, Pandas, Numpy
* **Deployment:** Vercel (Frontend), Render (Backend API)

## 💻 How to Run Locally

### 1. Start the AI Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # On Windows
pip install -r requirements.txt
python train_model.py      # Generate the ML model
uvicorn main:app --reload  # Start the API on port 8000
```

### 2. Start the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev                # Start the Next.js app on port 3000
```
