"use client";
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick, isActive }: { onMapClick: (lat: number, lng: number) => void, isActive: boolean }) {
  useMapEvents({
    click(e) {
      if (isActive) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function Dashboard() {
  const [riskData, setRiskData] = useState<any>(null);
  const [customFeatures, setCustomFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isClickPredictActive, setIsClickPredictActive] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to premium dark mode

  useEffect(() => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    let query = `?demo=${isDemoMode}`;
    if (selectedDate) query += `&date=${selectedDate}`;
    
    fetch(`${apiUrl}/api/risk-data${query}`)
      .then((res) => res.json())
      .then((data) => {
        setRiskData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch risk data:", err);
        setLoading(false);
      });
  }, [isDemoMode, selectedDate]);

  const handleMapClick = async (lat: number, lng: number) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${apiUrl}/api/risk-data/custom?lat=${lat}&lng=${lng}`);
      const newFeature = await res.json();
      if (newFeature && newFeature.type === "Feature") {
        setCustomFeatures((prev) => [...prev, newFeature]);
      }
    } catch (err) {
      console.error("Failed to fetch custom point risk:", err);
    }
  };

  const defaultFeatures = riskData?.features || [];
  const allFeatures = [...defaultFeatures, ...customFeatures];

  // Dynamic Theme Classes
  const bgMain = isDarkMode ? "bg-gray-900" : "bg-gray-50";
  const bgHeader = isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textMain = isDarkMode ? "text-white" : "text-gray-900";
  const textMuted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const bgCard = isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300";
  
  // Clean, professional CartoDB map tiles instead of cluttered OpenStreetMap
  const mapTileUrl = isDarkMode 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className={`flex h-screen flex-col transition-colors duration-300 ${bgMain} ${textMain}`}>
      <header className={`p-4 font-bold text-xl border-b flex justify-between items-center shadow-sm z-10 transition-colors duration-300 ${bgHeader}`}>
        <span className="tracking-wide">SIH26001: <span className="text-blue-500">SlideSense AI</span></span>
        
        <div className="flex items-center space-x-4">
          
          {/* Dark/Light Mode Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center justify-center h-8 w-8 rounded-full border transition-all ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-500 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-indigo-600'}`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          {/* Historical Date Filter */}
          <div className={`flex items-center px-3 py-1.5 rounded-md border transition-colors ${bgCard}`}>
            <span className={`text-xs mr-2 uppercase tracking-wide font-bold ${textMuted}`}>History:</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => { setIsDemoMode(false); setSelectedDate(e.target.value); }}
              className={`text-sm rounded px-2 py-0.5 border focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
              max={new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate("")} className="ml-3 text-xs text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider">Clear</button>
            )}
          </div>

          {/* Hackathon Demo Toggle */}
          <label className={`flex items-center cursor-pointer py-1.5 px-3 rounded-full border transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-300 shadow-sm'}`}>
            <span className="mr-3 text-sm font-bold uppercase tracking-wider">Simulate Storm</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={isDemoMode} onChange={() => { setIsDemoMode(!isDemoMode); setSelectedDate(""); }} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${isDemoMode ? 'bg-red-500' : (isDarkMode ? 'bg-gray-900' : 'bg-gray-200')}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${isDemoMode ? 'translate-x-4' : ''}`}></div>
            </div>
          </label>

          {/* Live/History Status Badge */}
          <span className={`text-sm font-bold flex items-center py-1.5 px-3 rounded-full border transition-colors ${selectedDate ? (isDarkMode ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50' : 'bg-yellow-50 text-yellow-700 border-yellow-300') : (isDarkMode ? 'bg-green-900/20 text-green-400 border-green-800/50' : 'bg-green-50 text-green-700 border-green-300')}`}>
            <span className={`h-2 w-2 rounded-full mr-2 ${selectedDate ? 'bg-yellow-500' : 'animate-pulse bg-green-500'}`}></span>
            {selectedDate ? 'Historical Data' : 'Live Data Synced'}
          </span>
          
          {/* Info Button */}
          <button 
            onClick={() => setShowInfoModal(true)}
            className={`font-bold h-8 w-8 rounded-full flex items-center justify-center border transition shadow ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-500 text-gray-200' : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800'}`}
            title="How SlideSense AI Works"
          >
            ?
          </button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Map View */}
        <main className={`flex-1 relative z-0 ${isClickPredictActive ? 'cursor-crosshair' : ''}`}>
          
          {/* Floating Map Controls */}
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] flex items-center space-x-4 px-5 py-2 rounded-full shadow-xl border transition-all ${isDarkMode ? 'bg-gray-900/95 text-white border-gray-600 backdrop-blur-md' : 'bg-white/95 text-gray-900 border-gray-300 backdrop-blur-md'}`}>
            <label className="flex items-center cursor-pointer hover:text-blue-500 transition">
              <div className="relative mr-3">
                <input type="checkbox" className="sr-only" checked={isClickPredictActive} onChange={() => setIsClickPredictActive(!isClickPredictActive)} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${isClickPredictActive ? 'bg-blue-500' : (isDarkMode ? 'bg-gray-700' : 'bg-gray-200')}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${isClickPredictActive ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="font-bold text-sm tracking-wide">🎯 Click-to-Predict Mode</span>
            </label>
            
            {customFeatures.length > 0 && (
              <>
                <div className={`w-px h-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                <button 
                  onClick={() => setCustomFeatures([])} 
                  className="text-sm text-red-500 hover:text-red-400 font-bold flex items-center transition"
                  title="Delete all custom markers"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Clear ({customFeatures.length})
                </button>
              </>
            )}
          </div>

          <MapContainer 
            center={[26.1445, 91.7362]} 
            zoom={6} 
            className="h-full w-full absolute inset-0"
          >
            <MapClickHandler onMapClick={handleMapClick} isActive={isClickPredictActive} />
            
            {/* Beautiful, minimalistic CartoDB Tiles (No ugly labels) */}
            <TileLayer
              key={isDarkMode ? "dark" : "light"}
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url={mapTileUrl}
            />
            
            {!loading && allFeatures.map((feature: any, index: number) => {
              const [lng, lat] = feature.geometry.coordinates;
              const { location, riskScore, explanations } = feature.properties;
              
              const strokeColor = riskScore >= 80 ? '#ef4444' : riskScore >= 60 ? '#f59e0b' : '#10b981';
              const fillColor = riskScore >= 80 ? '#fca5a5' : riskScore >= 60 ? '#fde047' : '#a7f3d0';

              return (
                <React.Fragment key={index}>
                  <Circle 
                    center={[lat, lng]} 
                    radius={25000} 
                    pathOptions={{ color: strokeColor, fillColor: fillColor, fillOpacity: 0.4, weight: 2 }} 
                  />
                  <Marker position={[lat, lng]}>
                    <Popup>
                      <div className="p-1 min-w-[200px]">
                        <h3 className="font-bold text-lg mb-1 text-gray-900">{location}</h3>
                        <div className={`text-sm font-bold mb-2 ${riskScore >= 80 ? 'text-red-600' : riskScore >= 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                          Risk Score: {riskScore}%
                        </div>
                        <div className="text-xs text-gray-800">
                          <strong className="text-gray-900">AI Explanation (SHAP):</strong>
                          <ul className="mt-1 list-disc pl-4 text-gray-700">
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
        
        {/* Sidebar Alerts */}
        <aside className={`w-[26rem] p-5 overflow-y-auto z-10 border-l shadow-2xl transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h2 className={`text-sm font-extrabold mb-5 border-b pb-2 tracking-widest uppercase ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
            Real-Time Alert Feed
          </h2>
          
          {loading ? (
            <div className={`animate-pulse flex items-center font-bold ${textMuted}`}>
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Syncing with ML Backend...
            </div>
          ) : allFeatures.length === 0 ? (
            <div className="text-red-600 p-4 bg-red-100 border border-red-300 rounded-xl shadow-sm">
              <strong>Connection Error:</strong> Backend returned no data. Ensure Python Uvicorn is running.
            </div>
          ) : (
            [...allFeatures]
              .sort((a: any, b: any) => b.properties.riskScore - a.properties.riskScore)
              .map((feature: any, index: number) => {
                const { location, riskScore, explanations } = feature.properties;
                
                if (riskScore >= 80) {
                  return (
                    <div key={index} className={`p-4 mb-4 rounded-xl shadow-md border transition-all ${isDarkMode ? 'bg-red-900/20 border-red-800 hover:bg-red-900/40' : 'bg-red-50 border-red-200 hover:bg-red-100'}`}>
                      <div className="flex items-center text-red-600 font-extrabold mb-2 text-lg">
                        <span className="relative flex h-3 w-3 mr-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                        </span>
                        CRITICAL: {location}
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-900'}`}>
                        Evacuation recommended. Risk score at <span className="font-bold text-red-500">{riskScore}%</span>. 
                        Primary driver: {explanations[0]?.factor} ({explanations[0]?.value}).
                      </p>
                    </div>
                  );
                } else if (riskScore >= 60) {
                  return (
                    <div key={index} className={`p-4 mb-4 rounded-xl shadow-md border transition-all ${isDarkMode ? 'bg-yellow-900/10 border-yellow-700/50 hover:bg-yellow-900/30' : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'}`}>
                      <div className={`font-extrabold mb-2 text-lg ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`}>WARNING: {location}</div>
                      <p className={`text-sm ${isDarkMode ? 'text-yellow-200' : 'text-yellow-900'}`}>
                        Elevated risk score (<span className="font-bold">{riskScore}%</span>). 
                        Primary driver: {explanations[0]?.factor} ({explanations[0]?.value}).
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div key={index} className={`p-4 mb-4 rounded-xl shadow-sm border transition-all ${isDarkMode ? 'bg-green-900/5 border-green-800/40 hover:bg-green-900/20' : 'bg-white border-green-200 hover:bg-green-50'}`}>
                      <div className={`font-extrabold mb-2 text-lg ${isDarkMode ? 'text-green-500' : 'text-green-600'}`}>STABLE: {location}</div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Low risk (<span className="font-bold">{riskScore}%</span>). Conditions normal.
                      </p>
                    </div>
                  );
                }
              })
          )}
        </aside>
      </div>

      {/* SlideSense Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`border rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}>
            <button 
              onClick={() => setShowInfoModal(false)}
              className={`absolute top-5 right-5 hover:text-red-500 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h2 className={`text-3xl font-extrabold mb-6 border-b pb-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              🏔️ SlideSense AI
            </h2>
            
            <div className="space-y-6 text-sm leading-relaxed">
              <div>
                <h3 className="text-lg font-bold text-blue-500">1. Live Data Pipeline</h3>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>The system bypasses static datasets by autonomously fetching real-time precipitation and soil moisture data from the <strong className={isDarkMode ? 'text-white' : 'text-black'}>Open-Meteo API</strong> for vulnerable regions.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-yellow-500">2. Explainable AI (XAI)</h3>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Predictions are generated using a Random Forest model. To prevent "black box" guessing, we utilize <strong className={isDarkMode ? 'text-white' : 'text-black'}>SHAP (SHapley Additive exPlanations)</strong> to isolate exactly which environmental factor (e.g., rainfall vs. slope) is driving the current risk.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-green-500">3. Enterprise Scalability</h3>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>To ensure the system doesn't crash during a disaster, the backend utilizes <strong className={isDarkMode ? 'text-white' : 'text-black'}>O(1) Hash Map TTL caching</strong> and in-memory model hosting, reducing API latency from ~3000ms down to ~15ms.</p>
              </div>
              
              <div className={`p-4 rounded-xl border mt-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}><strong>💡 Note for Judges:</strong> Use the <em>"Simulate Storm"</em> toggle in the header to forcefully inject extreme weather parameters (260mm rain, 88% moisture) to observe how the AI reacts under disaster conditions.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
