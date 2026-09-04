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
      if (isActive) onMapClick(e.latlng.lat, e.latlng.lng);
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
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to Light Mode

  useEffect(() => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    let query = `?demo=${isDemoMode}`;
    if (selectedDate) query += `&date=${selectedDate}`;
    
    fetch(`${apiUrl}/api/risk-data${query}`)
      .then((res) => res.json())
      .then((data) => { setRiskData(data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, [isDemoMode, selectedDate]);

  const handleMapClick = async (lat: number, lng: number) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${apiUrl}/api/risk-data/custom?lat=${lat}&lng=${lng}`);
      const newFeature = await res.json();
      if (newFeature?.type === "Feature") setCustomFeatures((prev) => [...prev, newFeature]);
    } catch (err) { console.error(err); }
  };

  const allFeatures = [...(riskData?.features || []), ...customFeatures];

  // Map base URLs (Esri ArcGIS - 100% Free, No API Key Required)
  const mapUrl = isDarkMode 
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
    
  const attribution = "&copy; Esri, DeLorme, NAVTEQ";

  return (
    <div className={`flex h-screen flex-col font-sans transition-colors duration-300 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* --- HEADER (Glassmorphic) --- */}
      <header className={`px-6 py-3 flex justify-between items-center border-b backdrop-blur-md z-[500] shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="font-extrabold text-2xl tracking-tight">SlideSense <span className="text-blue-500">AI</span></span>
        </div>

        <div className="flex items-center space-x-4">
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center py-1.5 px-3 rounded-full border ${selectedDate ? 'bg-yellow-900/30 text-yellow-500 border-yellow-700/50' : isDarkMode ? 'bg-green-900/20 text-green-400 border-green-800/50' : 'bg-green-100 text-green-700 border-green-200'}`}>
            <span className={`h-2 w-2 rounded-full mr-2 ${selectedDate ? 'bg-yellow-500' : 'animate-pulse bg-green-500 shadow-[0_0_8px_#22c55e]'}`}></span>
            {selectedDate ? 'Historical Record' : 'Live Synced'}
          </span>

          <div className={`flex items-center px-3 py-1.5 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
            <span className="text-xs text-gray-400 mr-2 uppercase tracking-wide font-semibold">History:</span>
            <input 
              type="date" value={selectedDate}
              onChange={(e) => { setIsDemoMode(false); setSelectedDate(e.target.value); }}
              className={`text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
              max={new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate("")} className="ml-2 text-xs text-blue-500 hover:text-blue-400 font-bold uppercase">Clear</button>
            )}
          </div>

          {/* Theme Toggle */}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-yellow-400' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-indigo-600'}`}>
            {isDarkMode 
              ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 4.22a1 1 0 011.415 0l.708.708a1 1 0 01-1.414 1.414l-.708-.708a1 1 0 010-1.414zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM14.22 15.636a1 1 0 010 1.414l-.708.708a1 1 0 01-1.414-1.414l.708-.708a1 1 0 011.414 0zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.22-1.414a1 1 0 01-1.415 0l-.708-.708a1 1 0 011.414-1.414l.708.708a1 1 0 010 1.414zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm1.414-4.95a1 1 0 010-1.414l.708-.708a1 1 0 011.414 1.414l-.708.708a1 1 0 01-1.414 0zM10 5a5 5 0 100 10 5 5 0 000-10z"/></svg> 
              : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            }
          </button>
          
          <button onClick={() => setShowInfoModal(true)} className={`h-9 w-9 rounded-lg border flex items-center justify-center font-bold transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700'}`}>?</button>
        </div>
      </header>

      {/* --- MAIN BODY --- */}
      <div className="flex flex-1 overflow-hidden relative">
        
        <main className={`flex-1 relative z-0 ${isClickPredictActive ? 'cursor-crosshair' : ''} ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
          {/* Floating Map Controls */}
          <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 z-[1000] flex items-center space-x-4 px-6 py-2.5 rounded-full shadow-2xl border backdrop-blur-xl transition-colors ${isDarkMode ? 'bg-gray-900/90 border-gray-700 text-white' : 'bg-white/90 border-gray-300 text-gray-900'}`}>
            <label className="flex items-center cursor-pointer group">
              <div className="relative mr-3">
                <input type="checkbox" className="sr-only" checked={isClickPredictActive} onChange={() => setIsClickPredictActive(!isClickPredictActive)} />
                <div className={`block w-11 h-6 rounded-full transition-colors ${isClickPredictActive ? 'bg-blue-500' : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform shadow-sm ${isClickPredictActive ? 'translate-x-5' : ''}`}></div>
              </div>
              <span className={`font-bold text-sm tracking-wide transition-colors ${isClickPredictActive ? 'text-blue-500' : ''}`}>🎯 Click-to-Predict Mode</span>
            </label>
            
            {customFeatures.length > 0 && (
              <>
                <div className={`w-px h-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                <button onClick={() => setCustomFeatures([])} className="text-sm text-red-500 hover:text-red-400 font-bold flex items-center transition">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Clear ({customFeatures.length})
                </button>
              </>
            )}
          </div>

          <MapContainer center={[26.1445, 91.7362]} zoom={6} className="h-full w-full absolute inset-0 z-0">
            <MapClickHandler onMapClick={handleMapClick} isActive={isClickPredictActive} />
            <TileLayer key={isDarkMode ? 'dark' : 'light'} url={mapUrl} attribution={attribution} />
            
            {!loading && allFeatures.map((feature: any, index: number) => {
              const [lng, lat] = feature.geometry.coordinates;
              const { location, riskScore, explanations } = feature.properties;
              const strokeColor = riskScore >= 80 ? '#ef4444' : riskScore >= 60 ? '#f59e0b' : '#10b981';
              const fillColor = riskScore >= 80 ? '#f87171' : riskScore >= 60 ? '#fbbf24' : '#34d399';

              return (
                <React.Fragment key={index}>
                  <Circle center={[lat, lng]} radius={25000} pathOptions={{ color: strokeColor, fillColor: fillColor, fillOpacity: 0.3, weight: 2 }} />
                  <Marker position={[lat, lng]}>
                    <Popup>
                      <div className="p-1 min-w-[200px]">
                        <h3 className="font-bold text-lg mb-1">{location}</h3>
                        <div className={`text-sm font-bold mb-3 ${riskScore >= 80 ? 'text-red-600' : riskScore >= 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                          Risk Score: {riskScore}%
                        </div>
                        <div className="text-xs bg-gray-50 p-2 rounded border border-gray-100">
                          <strong className="text-gray-800 uppercase tracking-wide">SHAP Explanation:</strong>
                          <ul className="mt-1 list-disc pl-4 text-gray-600 space-y-1">
                            {explanations.map((exp: any, i: number) => (
                              <li key={i}><span className="font-semibold">{exp.factor}</span>: {exp.value}</li>
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
        
        {/* --- SIDEBAR --- */}
        <aside className={`w-[420px] p-6 overflow-y-auto border-l backdrop-blur-xl z-[400] transition-colors duration-300 shadow-2xl ${isDarkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'}`}>
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-700/50">
            <h2 className="text-lg font-extrabold tracking-wide uppercase text-gray-400">Live Alerts</h2>
            
            <label className="flex items-center cursor-pointer group" title="Simulates an extreme storm over Tawang">
              <span className={`mr-2 text-xs font-bold uppercase tracking-wider ${isDemoMode ? 'text-red-500' : 'text-gray-500'}`}>Storm Demo</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={isDemoMode} onChange={() => { setIsDemoMode(!isDemoMode); setSelectedDate(""); }} />
                <div className={`block w-9 h-5 rounded-full transition-colors ${isDemoMode ? 'bg-red-500' : isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-[2px] top-[2px] bg-white w-4 h-4 rounded-full transition transform ${isDemoMode ? 'translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          
          {loading ? (
            <div className="text-gray-400 animate-pulse flex items-center justify-center p-8 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Processing ML Models...
            </div>
          ) : allFeatures.length === 0 ? (
            <div className="text-red-400 p-4 bg-red-900/20 border border-red-800 rounded-xl">
              <strong>Connection Error:</strong> Backend API offline.
            </div>
          ) : (
            <div className="space-y-4">
              {[...allFeatures].sort((a: any, b: any) => b.properties.riskScore - a.properties.riskScore).map((feature: any, index: number) => {
                const { location, riskScore, explanations } = feature.properties;
                
                if (riskScore >= 80) {
                  return (
                    <div key={index} className={`p-5 rounded-xl border transition-all transform hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-red-950/40 border-red-800/80 shadow-[0_0_15px_rgba(220,38,38,0.15)]' : 'bg-red-50 border-red-200 shadow-sm'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center text-red-500 font-bold text-sm tracking-wider uppercase">
                          <span className="relative flex h-3 w-3 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                          Critical Alert
                        </div>
                        <span className="font-extrabold text-2xl text-red-500">{riskScore}%</span>
                      </div>
                      <div className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{location}</div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Evacuation recommended. Primary driver: {explanations[0]?.factor} ({explanations[0]?.value}).</p>
                    </div>
                  );
                } else if (riskScore >= 60) {
                  return (
                    <div key={index} className={`p-5 rounded-xl border transition-all ${isDarkMode ? 'bg-yellow-950/30 border-yellow-800/50' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-yellow-500 font-bold text-sm tracking-wider uppercase">Warning</div>
                        <span className="font-extrabold text-xl text-yellow-500">{riskScore}%</span>
                      </div>
                      <div className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{location}</div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Elevated risk. Driver: {explanations[0]?.factor} ({explanations[0]?.value}).</p>
                    </div>
                  );
                } else {
                  return (
                    <div key={index} className={`p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
                      <div className="flex justify-between items-center">
                        <div className={`font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{location}</div>
                        <span className="font-bold text-green-500">{riskScore}%</span>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </aside>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative">
            <button onClick={() => setShowInfoModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors bg-gray-800 p-2 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h2 className="text-3xl font-extrabold text-white mb-6 border-b border-gray-800 pb-4 flex items-center">
              <span className="bg-blue-500/20 text-blue-400 p-2 rounded-lg mr-3">🧠</span> Architecture
            </h2>
            
            <div className="space-y-6 text-gray-300">
              <div>
                <h3 className="text-lg font-bold text-blue-400 flex items-center">1. Live Data Pipeline</h3>
                <p className="text-sm mt-1 leading-relaxed">The system bypasses static datasets by autonomously fetching real-time precipitation and soil moisture data from the <strong className="text-white">Open-Meteo API</strong> for vulnerable regions.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-purple-400 flex items-center">2. Explainable AI (XAI)</h3>
                <p className="text-sm mt-1 leading-relaxed">Predictions are generated using a Random Forest model. To prevent "black box" guessing, we utilize <strong className="text-white">SHAP (SHapley Additive exPlanations)</strong> to isolate exactly which environmental factor is driving the current risk.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-green-400 flex items-center">3. Enterprise Scalability</h3>
                <p className="text-sm mt-1 leading-relaxed">To ensure the system doesn't crash during a disaster, the backend utilizes <strong className="text-white">O(1) Hash Map TTL caching</strong> and in-memory model hosting, reducing API latency from ~3000ms down to ~15ms.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
