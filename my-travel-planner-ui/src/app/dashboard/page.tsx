"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe, Plane, Sparkles, MapPin, DollarSign, Calendar, Compass,
  Trash2, LogOut, Plus, Loader2, BarChart3, Clock, ArrowRight, Check,
  Train, Bus, Car
} from "lucide-react";
import { Trip, AuthUser } from "../../types";

function formatFriendlyError(errorMsg: string): string {
  if (!errorMsg) return "An unexpected error occurred. Please try again.";

  try {
    const jsonStartIdx = errorMsg.indexOf("{");
    if (jsonStartIdx !== -1) {
      const potentialJson = errorMsg.substring(jsonStartIdx);
      const parsed = JSON.parse(potentialJson);
      
      const innerMessage = 
        parsed.error?.message || 
        parsed.message || 
        (parsed.error && typeof parsed.error === "string" ? parsed.error : null);
        
      if (innerMessage) {
        errorMsg = innerMessage;
      }
    }
  } catch (e) {
    // Fall back to clean up regex search if parsing failed
    if (errorMsg.includes('{"error":')) {
      const match = errorMsg.match(/"message"\s*:\s*"([^"]+)"/);
      if (match && match[1]) {
        errorMsg = match[1];
      }
    }
  }

  const lowerMsg = errorMsg.toLowerCase();
  
  if (lowerMsg.includes("high demand") || lowerMsg.includes("unavailable") || lowerMsg.includes("503") || lowerMsg.includes("busy")) {
    return "The AI system is currently experiencing high demand and is temporarily busy. Please wait a few seconds and try again.";
  }
  if (lowerMsg.includes("api_key") || lowerMsg.includes("api key") || lowerMsg.includes("api-key")) {
    return "Configuration Error: The system's Gemini API key is missing or invalid. Please configure the GEMINI_API_KEY environment variable.";
  }
  if (lowerMsg.includes("quota") || lowerMsg.includes("limit") || lowerMsg.includes("429") || lowerMsg.includes("too many requests")) {
    return "The AI rate limit has been reached. Please wait a minute before requesting another travel plan.";
  }
  if (lowerMsg.includes("timeout") || lowerMsg.includes("deadline")) {
    return "The AI request timed out. Please try generating again with different parameters or during off-peak times.";
  }
  if (lowerMsg.includes("fetch failed") || lowerMsg.includes("network") || lowerMsg.includes("conn")) {
    return "Unable to communicate with the server. Please check your network connection and try again.";
  }

  let displayMsg = errorMsg;
  if (displayMsg.startsWith("Failed to generate travel plan: ")) {
    displayMsg = displayMsg.replace("Failed to generate travel plan: ", "");
  }
  
  return `Failed to generate travel plan: ${displayMsg}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // New Trip form states
  const [showForm, setShowForm] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(5);
  const [budgetType, setBudgetType] = useState<"Low" | "Medium" | "High">("Medium");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Culture"]);
  const [travelMode, setTravelMode] = useState<"Flight" | "Train" | "Bus" | "Driving">("Flight");
  const [departureTime, setDepartureTime] = useState<"Early Morning" | "Afternoon" | "Overnight/Night">("Early Morning");

  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState("");

  const interestsOptions = ["Food", "Culture", "Adventure", "Shopping", "Nature", "Nightlife"];

  const getApiUrl = (endpoint: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? (window as any).env?.VITE_API_URL : null) || "/api";
    return `${baseUrl.replace(/\/$/, "")}${endpoint}`;
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("travel_token");
    const savedUser = localStorage.getItem("travel_user");

    if (!savedToken || !savedUser) {
      router.push("/login");
      return;
    }

    setToken(savedToken);
    setUser(JSON.parse(savedUser));
  }, [router]);

  const loadTrips = async (authToken: string) => {
    try {
      const res = await fetch(getApiUrl("/trips"), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setTrips(data.trips);
      }
    } catch (err) {
      console.error("Failed to fetch trips.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadTrips(token);
    }
  }, [token]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating) {
      interval = setInterval(() => {
        setGenerationStep((prev) => (prev >= 3 ? prev : prev + 1));
      }, 1500);
    } else {
      setGenerationStep(0);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const handleLogout = () => {
    localStorage.removeItem("travel_token");
    localStorage.removeItem("travel_user");
    router.push("/");
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!origin.trim() || !destination.trim()) {
      setError("Please fill in both origin and destination cities.");
      return;
    }

    if (selectedInterests.length === 0) {
      setError("Please select at least one interest tag.");
      return;
    }

    setGenerating(true);
    setGenerationStep(0);

    try {
      const res = await fetch(getApiUrl("/trips/generate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          origin,
          destination,
          days,
          budgetType,
          interests: selectedInterests,
          travelMode,
          departureTime,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to generate travel plan");
      }

      // Navigate to the newly generated card
      router.push(`/trips/${data.trip._id}`);
    } catch (err: any) {
      setError(formatFriendlyError(err.message || "An error occurred calling Gemini API."));
      setGenerating(false);
    }
  };

  const handleDeleteTrip = async (tripId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (!confirm("Are you sure you want to delete this plan permanently?")) {
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/trips/${tripId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTrips(trips.filter((t) => t._id !== tripId));
      } else {
        alert(data.message || "Failed to delete.");
      }
    } catch {
      alert("Error deleting trip.");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-slate-500 text-sm font-medium">Loading your planner...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="dashboard-app">
      {/* Absolute Loading Overlay */}
      {generating && (
        <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-6 text-center" id="loading-overlay">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 animate-bounce shadow-inner">
            <Compass className="w-10 h-10 animate-spin" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">Creating your travel plan...</h2>
          <p className="text-slate-500 text-sm max-w-sm mb-8 font-medium">
            Gemini is crafting a custom itinerary using coordinates, estimation tables, and recommended lodging.
          </p>

          <div className="space-y-3.5 max-w-xs w-full text-left" id="step-loader">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${generationStep >= 0 ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-200 text-slate-400"}`}>
                {generationStep > 0 ? <Check className="w-3.5 h-3.5" /> : "1"}
              </div>
              <span className={`text-sm ${generationStep >= 0 ? "text-slate-800 font-bold" : "text-slate-400"}`}>Understanding destination</span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${generationStep >= 1 ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-200 text-slate-400"}`}>
                {generationStep > 1 ? <Check className="w-3.5 h-3.5" /> : "2"}
              </div>
              <span className={`text-sm ${generationStep >= 1 ? "text-slate-800 font-bold" : "text-slate-400"}`}>Building day-by-day itinerary</span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${generationStep >= 2 ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-200 text-slate-400"}`}>
                {generationStep > 2 ? <Check className="w-3.5 h-3.5" /> : "3"}
              </div>
              <span className={`text-sm ${generationStep >= 2 ? "text-slate-800 font-bold" : "text-slate-400"}`}>Estimating local costs</span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${generationStep >= 3 ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-200 text-slate-400"}`}>
                {generationStep > 3 ? <Check className="w-3.5 h-3.5" /> : "4"}
              </div>
              <span className={`text-sm ${generationStep >= 3 ? "text-slate-800 font-bold" : "text-slate-400"}`}>Finding suited hotels</span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-slate-800 tracking-tight">
          <Globe className="w-6 h-6 text-indigo-600" />
          <span>Travel Planner AI</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-500 hidden sm:inline">Hello, <strong className="text-slate-700">{user.name}</strong></span>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-600 p-2 rounded-lg transition-colors cursor-pointer"
            id="logout-btn"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="bg-white border-b border-slate-200 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Workspace</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Configure destinations or browse your personalized saved itineraries</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/10 cursor-pointer transition-all shrink-0"
            id="create-trip-btn"
          >
            <Plus className="w-4 h-4" />
            Create New Trip
          </button>
        </div>
      </div>

      {/* Main Containers */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-8">
        
        {/* Core Requirement 2 Content form */}
        {showForm && (
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-md shadow-indigo-500/5 transition-all">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600 animate-spin" />
              Specify Trip Settings
            </h2>
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 font-bold mb-4">
                ⚠️ {error}
              </div>
            )}
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Origin City</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Destination City</label>
                  <input
                    type="text"
                    placeholder="e.g. Tokyo"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trip Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={days}
                    onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value))))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Budget Class</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Low", "Medium", "High"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setBudgetType(level as any)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          budgetType === level
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Travel Mode & Departure Timing Preference row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Preferred Travel Mode
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {([
                      { name: "Flight", icon: Plane },
                      { name: "Train", icon: Train },
                      { name: "Bus", icon: Bus },
                      { name: "Driving", icon: Car },
                    ] as const).map((mode) => {
                      const IconComponent = mode.icon;
                      const isSelected = travelMode === mode.name;
                      return (
                        <button
                          key={mode.name}
                          type="button"
                          onClick={() => setTravelMode(mode.name)}
                          className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                          title={mode.name}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span className="text-[10px] font-bold">{mode.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Departure Timing
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { name: "Early Morning", label: "Morning" },
                      { name: "Afternoon", label: "Afternoon" },
                      { name: "Overnight/Night", label: "Overnight" },
                    ] as const).map((time) => {
                      const isSelected = departureTime === time.name;
                      return (
                        <button
                          key={time.name}
                          type="button"
                          onClick={() => setDepartureTime(time.name)}
                          className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                          title={time.name}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold leading-none">{time.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Interests (Select Multiple)</label>
                <div className="flex flex-wrap gap-2">
                  {interestsOptions.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 text-indigo-800 border-indigo-300 font-bold shadow-xs"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-55"
                        }`}
                      >
                        {isSelected ? "✓ " : ""}
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Generate AI Travel Plan
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dashboard Stat Counters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard-statistics">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Guided Journeys</span>
              <span className="text-3xl font-extrabold text-slate-800 leading-tight">{trips.length} Trips</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Last Created Adventure</span>
              <span className="text-base font-bold text-slate-700 leading-tight truncate max-w-[240px] block">
                {trips.length > 0 ? trips[0].destination : "None yet"}
              </span>
            </div>
          </div>
        </div>

        {/* Saved Trips Display */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Plane className="w-5 h-5 text-indigo-600" />
            Your Saved Travel Plans
          </h2>

          {trips.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center" id="empty-trips-display">
              <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-bold mb-2">No itineraries developed yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                Fill out the specifications setting form using Gemini AI to craft high-fidelity cost estimations and days.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer"
              >
                Set Destination Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard-trips-grid">
              {trips.map((t) => (
                <div
                  key={t._id}
                  onClick={() => router.push(`/trips/${t._id}`)}
                  className="bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all p-5 shadow-xs flex flex-col justify-between cursor-pointer relative group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">ID: {t._id.slice(-6)}</span>
                      <button
                        onClick={(e) => handleDeleteTrip(t._id, e)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-lg text-slate-800 leading-tight">{t.destination}</h3>
                      <p className="text-xs text-slate-500 font-medium">Departing from {t.origin}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded">
                        {t.numberOfDays} Days
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded">
                        {t.budgetType} Budget
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between text-xs font-bold text-indigo-600">
                    <span>Inspect itinerary details</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-auto bg-white">
        <p>© 2026 Travel Planner AI. Decoupled production architecture.</p>
      </footer>
    </div>
  );
}
