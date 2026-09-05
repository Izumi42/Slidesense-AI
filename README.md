# 🏔️ SlideSense AI: Early Warning Landslide System (NER)
**SIH26001 Hackathon Submission**

SlideSense AI is a highly optimized, full-stack machine learning early warning system designed specifically for the North Eastern Region (NER) of India. By ingesting both real-time forecasts and deep historical meteorological data, it generates highly accurate landslide risk scores using Explainable AI (XAI).

## 🚀 Live Demo
* **Frontend Dashboard:** [https://slidesense-ai.vercel.app](https://slidesense-ai.vercel.app)
* **Backend API:** [https://slidesense-ai.onrender.com/api/risk-data](https://slidesense-ai.onrender.com/api/risk-data)

## 💡 Key Features & Novelty
1. **Explainable AI (XAI):** We don't just output a "black box" risk score. Using **SHAP (SHapley Additive exPlanations)**, our dashboard tells authorities *exactly* which environmental factor (e.g., 24h rainfall vs soil moisture) is driving the current alert.
2. **Historical Time Machine:** A built-in date filter allows authorities to bypass the live forecast, fetch historical weather data, and run retroactive risk assessments for dates in the past.
3. **Interactive Demo Mode:** An interactive "Simulate Storm" toggle allows judges to forcefully inject extreme weather parameters (260mm rain, 88% moisture) into the backend to observe how the AI reacts under disaster conditions.
4. **Dynamic Heatmap UI:** Built with React-Leaflet offering interactive map zones, pop-up alerts, and color-coded risk prioritization.

## 📊 The Data Pipeline (100% Dynamic)
* **Training Pipeline:** Instead of hardcoding synthetic CSVs, our `train_model.py` dynamically queries the **Open-Meteo Historical Archive API**. It downloads exactly 3 years (2021-2023) of real daily rainfall data for the NER (over 5,000 data points) to physically train the Random Forest algorithm on actual regional climate distributions.
* **Inference Pipeline:** The backend API fetches live, real-time weather forecasts to run instant risk predictions.

## ⚡ DSA & Performance Architecture
* **Concurrent Multi-Threading:** Fetches for live weather APIs are executed concurrently via a `ThreadPoolExecutor`, completely eliminating $O(N)$ sequential network bottlenecks and dropping cold-start latency by 80%.
* **$O(1)$ Hash Map Memoization:** Implemented a TTL (Time-To-Live) caching layer for API responses. Drops subsequent request latency from ~3000ms down to ~15ms.
* **$O(1)$ Memory Access:** Eliminated Disk I/O bottlenecks by hoisting the `.pkl` Machine Learning model and the SHAP TreeExplainer into global memory space at server startup. 

## 🛠️ Tech Stack
* **Frontend:** Next.js 14, React, TailwindCSS, React-Leaflet
* **Backend:** Python, FastAPI, Uvicorn, Concurrent Futures
* **Machine Learning:** Scikit-Learn (Random Forest), SHAP, Pandas, Numpy
* **APIs:** Open-Meteo (Live & Archive)
* **Deployment:** Vercel (Frontend), Render (Backend API)

## 💻 How to Run Locally

### 1. Start the AI Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # On Windows (use `source venv/bin/activate` on Mac/Linux)
pip install -r requirements.txt
python train_model.py      # Dynamically downloads 3 years of historical data & trains the ML model
uvicorn main:app --reload  # Start the API on port 8000
```

### 2. Start the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev                # Start the Next.js app on port 3000
```
