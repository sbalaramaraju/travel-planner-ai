"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Sparkles, MapPin, DollarSign, RefreshCw, ChevronRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("travel_token");
    if (savedToken) {
      router.push("/dashboard");
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-medium">Preparing adventure...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans" id="landing-page-container">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-800 tracking-tight">
          <Globe className="w-6 h-6 text-indigo-600 animate-pulse" />
          <span>Travel Planner AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/login")}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            id="login-btn-nav"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/register")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm shadow-indigo-500/10"
            id="register-btn-nav"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-5xl mx-auto px-6 py-16 text-center flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-6 tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Powered by Gemini 3.5 Flash</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mb-6">
          Plan your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">adventure</span> with AI
        </h1>
        
        <p className="text-lg text-slate-600 max-w-2xl leading-relaxed mb-10">
          Instantly generate customized day-by-day itineraries, realistic budget estimates, and hotel recommendations tailored to your budget type and interests using advanced natural language.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <button
            onClick={() => router.push("/register")}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md shadow-indigo-500/20 cursor-pointer transition-all flex items-center justify-center gap-2 group text-base"
            id="cta-create-my-trip"
          >
            Create My Trip
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* How It Works */}
        <div className="mt-24 w-full">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-12 uppercase text-center border-b border-slate-200 pb-4 max-w-xs mx-auto">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Card 1 */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-5 shadow-inner">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">1. Specify details</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Provide your origin, destination, trip duration, budget level (Low, Medium, High), and select personal interests.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50/60 text-slate-700 rounded-xl flex items-center justify-center mb-5 shadow-inner">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">2. Get AI-tailored plans</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Gemini constructs an exhaustive day-by-day estimate, hotel deals matched to limits, and consistent budget categories.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50/60 text-indigo-700 rounded-xl flex items-center justify-center mb-5 shadow-inner">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">3. Refine with natural language</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Use our travel chatbot helper at the bottom: ask to "make day 2 cheaper" or "add more food recommendations" to update instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 bg-white text-center text-sm text-slate-400 mt-auto">
        <p>© 2026 Travel Planner AI. Built with Next.js, precision, and care.</p>
      </footer>
    </div>
  );
}
