import "./globals.css";

export const metadata = {
  title: "SIH26001 - Landslide Risk Monitoring",
  description: "AI-Based early warning and landslide Risk Monitoring System in NER",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
