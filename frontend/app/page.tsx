"use client";
import dynamic from "next/dynamic";

// Dynamically import the dashboard with SSR disabled.
// This prevents Next.js from trying to render Leaflet maps on the server,
// which fixes the "window is not defined" Vercel build error.
const Dashboard = dynamic(() => import("../components/Dashboard"), {
  ssr: false,
});

export default function Page() {
  return <Dashboard />;
}
