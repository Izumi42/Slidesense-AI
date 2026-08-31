"use client";
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
import L from 'leaflet';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Dashboard() {
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch AI risk data from FastAPI backend when dashboard loads
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/risk-data")
      .then((res) => res.json())
      .then((data) => {
        setRiskData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch risk data:", err);
        setLoading(false);
      });
  }, []);

  const features = riskData?.features || [];

  return (
    <div className="flex h-screen flex-col">
      <header className="p-4 bg-gray-800 font-bold text-xl border-b border-gray-700 flex justify-between items-center">
        <span>SIH26001: AI Landslide Risk Monitoring (NER)</span>
        <span className="text-sm font-normal text-green-400 flex items-center">
          <span className="animate-pulse h-2 w-2 bg-green-500 rounded-full mr-2"></span>
          Live Data Synced
        </span>
      </header>
      
      <div className="flex flex-1">
        {/* Main Map View */}
        <main className="flex-1 relative z-0 bg-gray-200">
          <MapContainer 
            center={[26.1445, 91.7362]} // Centered near Guwahati, Assam
            zoom={6} 
            className="h-full w-full absolute inset-0"
          >
            {/* Switched to standard OpenStreetMap to remove Carto API key watermarks */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Dynamically render markers from the AI Backend */}
            {!loading && features.map((feature: any, index: number) => {
              const [lng, lat] = feature.geometry.coordinates;
              const { location, riskScore, explanations } = feature.properties;
              
              const strokeColor = riskScore >= 80 ? '#ef4444' : riskScore >= 60 ? '#eab308' : '#22c55e';
              const fillColor = riskScore >= 80 ? '#fca5a5' : riskScore >= 60 ? '#fde047' : '#86efac';

              return (
                <React.Fragment key={index}>
                  <Circle 
                    center={[lat, lng]} 
                    radius={25000} // 25km radius heat-zone
                    pathOptions={{ color: strokeColor, fillColor: fillColor, fillOpacity: 0.4, weight: 2 }} 
                  />
                  <Marker position={[lat, lng]}>
                    <Popup>
                      <div className="p-1 min-w-[200px]">
                        <h3 className="font-bold text-lg mb-1">{location}</h3>
                        <div className={`text-sm font-bold mb-2 ${riskScore >= 80 ? 'text-red-600' : riskScore >= 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                          Risk Score: {riskScore}%
                        </div>
                        <div className="text-xs">
                          <strong className="text-gray-700">AI Explanation (SHAP):</strong>
                          <ul className="mt-1 list-disc pl-4 text-gray-600">
                            {explanations.map((exp: any, i: number) => (
                              <li key={i}>
                                <span className="font-semibold">{exp.factor}</span>: {exp.value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        </main>
        
        {/* Sidebar Alerts (Dynamic Alerting System) */}
        <aside className="w-96 bg-gray-900 p-4 border-l border-gray-700 overflow-y-auto z-10">
          <h2 className="text-lg font-semibold mb-4 text-white">Real-Time Alerts</h2>
          
          {loading ? (
            <div className="text-gray-400 animate-pulse flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Syncing with AI Backend...
            </div>
          ) : features.length === 0 ? (
            <div className="text-red-400 p-4 bg-red-900/20 border border-red-800 rounded">
              <strong>Connection Error:</strong> Backend returned no data. Ensure Python Uvicorn is running on Port 8000.
            </div>
          ) : (
            [...features]
              .sort((a: any, b: any) => b.properties.riskScore - a.properties.riskScore)
              .map((feature: any, index: number) => {
                const { location, riskScore, explanations } = feature.properties;
                
                if (riskScore >= 80) {
                  return (
                    <div key={index} className="p-4 mb-3 bg-red-900/30 border border-red-700 rounded shadow-sm transition-all hover:bg-red-900/40">
                      <div className="flex items-center text-red-500 font-bold mb-2">
                        <span className="relative flex h-3 w-3 mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        CRITICAL: {location}
                      </div>
                      <p className="text-sm text-gray-300">
                        Evacuation recommended. Risk score at <span className="font-bold text-red-400">{riskScore}%</span>. 
                        Primary driver: {explanations[0]?.factor} ({explanations[0]?.value}).
                      </p>
                    </div>
                  );
                } else if (riskScore >= 60) {
                  return (
                    <div key={index} className="p-4 mb-3 bg-yellow-900/30 border border-yellow-700 rounded shadow-sm transition-all hover:bg-yellow-900/40">
                      <div className="text-yellow-500 font-bold mb-2">WARNING: {location}</div>
                      <p className="text-sm text-gray-300">
                        Elevated risk score (<span className="font-bold text-yellow-400">{riskScore}%</span>). 
                        Primary driver: {explanations[0]?.factor} ({explanations[0]?.value}).
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div key={index} className="p-4 mb-3 bg-green-900/20 border border-green-800 rounded shadow-sm transition-all hover:bg-green-900/30">
                      <div className="text-green-500 font-bold mb-2">STABLE: {location}</div>
                      <p className="text-sm text-gray-400">
                        Low risk (<span className="font-bold text-green-500">{riskScore}%</span>). Conditions are currently normal.
                      </p>
                    </div>
                  );
                }
              })
          )}
        </aside>
      </div>
    </div>
  );
}
