import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "Travel Planner AI",
  description: "AI-Powered itinerary, budget and custom lodging suggestions planner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
