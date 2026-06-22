"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Globe, Plane, ArrowLeft, Loader2, Sparkles, Send, MapPin, 
  DollarSign, Hotel, Calendar, Tag, RefreshCw, AlertCircle, ChevronDown, ChevronUp,
  Train, Bus, Car, Clock
} from "lucide-react";
import { Trip, AuthUser } from "../../../types";
import PackingChecklist from "./PackingChecklist";

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  // Active view tabs
  const [activeTab, setActiveTab] = useState<"itinerary" | "hotels" | "budget">("itinerary");
  // Expanded days for itinerary view
  const [expandedDays, setExpandedDays] = useState<number[]>([1]);

  // AI assistant states
  const [modificationRequest, setModificationRequest] = useState("");
  const [modifying, setModifying] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  const loadTripDetails = async (authToken: string) => {
    try {
      const res = await fetch(getApiUrl(`/trips/${id}`), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setTrip(data.trip);
      } else {
        setError(data.message || "Failed to load trip description.");
      }
    } catch {
      setError("An error occurred loading the trip.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      loadTripDetails(token);
    }
  }, [token, id]);

  const handleModifyItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modificationRequest.trim() || !token) return;

    setError("");
    setSuccessMsg("");
    setModifying(true);

    try {
      const res = await fetch(getApiUrl(`/trips/${id}/modify`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ modificationRequest: modificationRequest.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to modify itinerary");
      }

      setTrip(data.trip);
      setSuccessMsg("✓ Your travel plan has been refined using AI successfully!");
      setModificationRequest("");
    } catch (err: any) {
      setError(err.message || "An error occurred refining with Gemini.");
    } finally {
      setModifying(false);
    }
  };

  const toggleDay = (day: number) => {
    if (expandedDays.includes(day)) {
      setExpandedDays(expandedDays.filter((d) => d !== day));
    } else {
      setExpandedDays([...expandedDays, day]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-slate-500 text-sm font-medium">Loading itinerary...</span>
        </div>
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to load adventure</h2>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="trip-workspace-app">
      {/* Header Banner */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <Globe className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span className="truncate max-w-[180px] sm:max-w-none">{trip.destination}</span>
          </div>
        </div>
        <div className="bg-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 border border-slate-200 hidden sm:inline-block">
          {trip.numberOfDays} Day Journey
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-6">
        
        {/* Quick meta indicators */}
        <div className="bg-indigo-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-md">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-800/40 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="relative z-10 space-y-4">
            <span className="text-xs uppercase tracking-widest font-mono text-indigo-200">Trip Identifier: {trip._id}</span>
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight">{trip.destination} Planner</h1>
              <p className="text-xs text-indigo-100 font-medium">Departing from <strong className="text-white font-bold">{trip.origin}</strong></p>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2 border-t border-indigo-800">
              <span className="bg-indigo-800/60 text-indigo-100 text-xs px-3 py-1 rounded-full font-bold">
                {trip.budgetType} Budget
              </span>
              {trip.travelMode && (
                <span className="bg-indigo-800/60 text-indigo-100 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 capitalize">
                  {trip.travelMode === "Flight" && <Plane className="w-3.5 h-3.5" />}
                  {trip.travelMode === "Train" && <Train className="w-3.5 h-3.5" />}
                  {trip.travelMode === "Bus" && <Bus className="w-3.5 h-3.5" />}
                  {trip.travelMode === "Driving" && <Car className="w-3.5 h-3.5" />}
                  {trip.travelMode}
                </span>
              )}
              {trip.departureTime && (
                <span className="bg-indigo-800/60 text-indigo-100 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {trip.departureTime}
                </span>
              )}
              {trip.interests.map((interest) => (
                <span key={interest} className="bg-indigo-800/30 text-indigo-100 text-xs px-3 py-1 rounded-full font-bold">
                  #{interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* View Tabs Selector */}
        <div className="grid grid-cols-3 gap-2 p-1 border border-slate-200 bg-white rounded-xl shadow-xs">
          <button
            onClick={() => setActiveTab("itinerary")}
            className={`py-2.5 text-xs font-extrabold uppercase tracking-wide rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === "itinerary"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Itinerary
          </button>
          <button
            onClick={() => setActiveTab("hotels")}
            className={`py-2.5 text-xs font-extrabold uppercase tracking-wide rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === "hotels"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Hotel className="w-4 h-4" />
            Lodging
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className={`py-2.5 text-xs font-extrabold uppercase tracking-wide rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === "budget"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Estimates
          </button>
        </div>

        {/* Dynamic Workspace Container */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs min-h-[300px]">
          
          {/* TAB 1: ITINERARY */}
          {activeTab === "itinerary" && (
            <div className="space-y-6" id="itinerary-tab-content">
              <h2 className="text-lg font-bold text-slate-800">Day-by-Day Travel Guide</h2>
              <p className="text-xs text-slate-500">Click any day bar to expand/collapse details of the scheduled highlights.</p>

              {trip.transitAdvisory && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-900 shadow-sm mt-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800">Transit Choice Advisory</h4>
                    <p className="text-xs font-medium leading-relaxed mt-1 text-amber-700">
                      {trip.transitAdvisory}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                {trip.itinerary.map((itineraryDay) => {
                  const isOpen = expandedDays.includes(itineraryDay.day);
                  return (
                    <div key={itineraryDay.day} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors">
                      <button
                        onClick={() => toggleDay(itineraryDay.day)}
                        className="w-full px-5 py-4 bg-slate-50 text-left flex items-center justify-between font-bold text-slate-800 hover:bg-slate-100/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center justify-center shadow-xs">D{itineraryDay.day}</span>
                          <span>Day {itineraryDay.day} Exploration</span>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </button>

                      {isOpen && (
                        <div className="p-5 border-t border-slate-250 bg-white space-y-4">
                          {itineraryDay.activities.map((act, index) => (
                            <div key={index} className="flex gap-4 border-b border-dashed border-slate-100 last:border-0 pb-4 last:pb-0">
                              <div className="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded h-fit shadow-inner">
                                Act {index + 1}
                              </div>
                              <div className="space-y-1 flex-1">
                                <h4 className="font-extrabold text-sm text-slate-800">{act.title}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">{act.description}</p>
                                <div className="text-xs font-bold text-slate-400 font-mono mt-1 pt-1.5 flex items-center gap-1">
                                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                  Estimated: ${act.estimatedCost.min} - ${act.estimatedCost.max} USD
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: HOTELS */}
          {activeTab === "hotels" && (
            <div className="space-y-6" id="hotels-tab-content">
              <h2 className="text-lg font-bold text-slate-800">Lodging & Accommodation Recommendations</h2>
              <p className="text-xs text-slate-500">Highly-rated matches calibrated against your selected {trip.budgetType} budget setting.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {trip.hotelSuggestions.map((h, i) => (
                  <div key={i} className="border border-slate-200 hover:border-indigo-200 rounded-xl p-5 hover:bg-slate-50/20 transition-all shadow-xs flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold font-mono text-indigo-700 bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded-full uppercase">
                          {h.priceRange} Price Class
                        </span>
                        <Hotel className="w-4 h-4 text-slate-400" />
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{h.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{h.reason}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      {trip.destination} Localized Area
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ESTIMATED BUDGET TABLES COST */}
          {activeTab === "budget" && (
            <div className="space-y-6" id="budget-tab-content">
              <h2 className="text-lg font-bold text-slate-800">Estimated Project Cost Tables</h2>
              <p className="text-xs text-slate-500">All estimates are represented in USD based on standard live pricing index parameters.</p>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs pt-1">
                <table className="w-full text-left text-sm border-collapse" id="budget-comparison-table">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-extrabold text-xs text-slate-500 uppercase tracking-wider">Cost Segment Category</th>
                      <th className="p-4 font-extrabold text-xs text-slate-500 uppercase tracking-wider">Minimum Estimate</th>
                      <th className="p-4 font-extrabold text-xs text-slate-500 uppercase tracking-wider">Maximum Estimate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-500">
                    <tr>
                      <td className="p-4 font-bold text-slate-800">Outgoing/Returning Flights</td>
                      <td className="p-4 font-mono font-bold text-slate-700">${trip.budgetEstimate.flights.min} USD</td>
                      <td className="p-4 font-mono font-bold text-slate-700">${trip.budgetEstimate.flights.max} USD</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-slate-800">Selected Lodging/Hotels</td>
                      <td className="p-4 font-mono font-bold text-slate-700">${trip.budgetEstimate.accommodation.min} USD</td>
                      <td className="p-4 font-mono font-bold text-slate-700">${trip.budgetEstimate.accommodation.max} USD</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-slate-800">Food, Drinks & Local Dining</td>
                      <td className="p-4 font-mono font-bold text-slate-700">${trip.budgetEstimate.food.min} USD</td>
                      <td className="p-4 font-mono font-bold text-slate-700">${trip.budgetEstimate.food.max} USD</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-slate-800">Daily Sightseeing/Activities</td>
                      <td className="p-4 font-mono font-bold text-slate-700">${trip.budgetEstimate.activities.min} USD</td>
                      <td className="p-4 font-mono font-bold text-slate-700">${trip.budgetEstimate.activities.max} USD</td>
                    </tr>
                    <tr className="bg-slate-50/60 font-bold border-t border-slate-200">
                      <td className="p-4 text-slate-900 font-extrabold uppercase tracking-wide bg-slate-50">Total Outgoing Estimate</td>
                      <td className="p-4 text-indigo-700 font-mono font-extrabold text-base bg-slate-50">${trip.budgetEstimate.total.min} USD</td>
                      <td className="p-4 text-indigo-700 font-mono font-extrabold text-base bg-slate-50">${trip.budgetEstimate.total.max} USD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* AI Smart Packing Assistant Custom Feature */}
        {token && (
          <div className="space-y-4">
            <PackingChecklist trip={trip} token={token} />
          </div>
        )}

        {/* AI Assistant Chatbot Box */}
        <section className="bg-slate-900 text-white rounded-2xl p-6 shadow-md shadow-indigo-900/10 space-y-4" id="ai-modification-box">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="font-extrabold text-base tracking-tight">Refine this Itinerary in Real-Time</h3>
          </div>
          
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Need adjustments? Tell the AI to "make day 3 cheaper", "replace adventure activities with local history", "add budget flights from Bengaluru" or "increase dining allocation to $200 min". Gemini recalculates instantly.
          </p>

          {successMsg && (
            <div className="p-3 bg-indigo-950/70 text-indigo-200 text-xs rounded-xl border border-indigo-800 font-semibold" id="modification-success">
              {successMsg}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/70 text-red-300 text-xs rounded-xl border border-red-800 font-semibold" id="modification-error">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleModifyItinerary} className="flex gap-2">
            <input
              type="text"
              required
              disabled={modifying}
              value={modificationRequest}
              onChange={(e) => setModificationRequest(e.target.value)}
              placeholder='e.g. "Add budget flight options and replace day 2 activity with dining and relaxation"'
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-500 font-medium text-slate-100"
            />
            <button
              type="submit"
              disabled={modifying || !modificationRequest.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/40 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed text-center h-fit align-middle"
              id="modify-plan-submit"
            >
              {modifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Refine
                </>
              )}
            </button>
          </form>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-auto bg-white">
        <p>© 2026 Travel Planner AI. Decoupled production architecture.</p>
      </footer>
    </div>
  );
}
