# 🏔️ SlideSense AI (SIH26001)

**AI-Based Early Warning and Landslide Risk Monitoring System for the North Eastern Region (NER).**

This repository contains the complete full-stack solution for the Smart India Hackathon (SIH26001).

## ✨ Key Novelty & Features
- **Hybrid Ensemble Machine Learning:** Uses Scikit-Learn (Random Forest) trained on historical meteorological data to accurately predict landslide probabilities.
- **Explainable AI (XAI):** Avoids the dangerous "Black Box" AI problem by integrating SHAP values. The dashboard explicitly tells authorities exactly *why* a location is high risk (e.g., "Soil Moisture > 80%").
- **Dynamic Geospatial Dashboard:** Built with Next.js and Leaflet, displaying live 25km heat-radius zones (Red = Critical, Yellow = Warning, Green = Stable).
- **Hardware-less Scalability:** Relies on weather APIs and topographical models rather than expensive, fragile physical IoT sensors, allowing it to scale instantly across the entire NER.

## 🏗️ Tech Stack
- **Frontend:** Next.js (React), Tailwind CSS, React-Leaflet
- **Backend:** FastAPI (Python), Pandas, Uvicorn
- **AI/ML:** Scikit-Learn, SHAP, NumPy

## 🚀 How to Run Locally

### 1. Start the AI Backend
```bash
cd backend
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### 2. Start the Map Dashboard
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` to view the live risk monitoring command center.
