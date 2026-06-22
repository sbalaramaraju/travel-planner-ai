import React, { useState, useEffect } from "react";
import { ListTodo, Plus, Trash2, CheckCircle2, RotateCcw, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Trip } from "../../../types";

interface PackingItem {
  id: string;
  text: string;
  category: "Essentials" | "Clothing" | "Electronics" | "Transit & Gear" | "Interests Pack" | "Other";
  checked: boolean;
  reason?: string;
}

interface PackingChecklistProps {
  trip: Trip;
  token: string; // Authentication token for backend requests
}

export default function PackingChecklist({ trip, token }: PackingChecklistProps) {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<PackingItem["category"]>("Other");

  const getApiUrl = (endpoint: string) => {
    const baseUrl = (typeof window !== "undefined" ? (window as any).env?.VITE_API_URL : null) || "/api";
    return `${baseUrl.replace(/\/$/, "")}${endpoint}`;
  };

  // Fetch from the Backend AI Packing Generation Route
  const fetchAiPackingList = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl(`/trips/${trip._id}/packing`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to generate: HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !Array.isArray(data.items)) {
        throw new Error(data.message || "Failed to parse checklist items from server");
      }

      // Map generated items to PackingItem format
      let counter = 1;
      const formattedItems: PackingItem[] = data.items.map((raw: any) => ({
        id: `ai-${counter++}-${Date.now()}`,
        text: raw.text,
        category: raw.category || "Other",
        checked: false,
        reason: raw.reason || undefined,
      }));

      setItems(formattedItems);
      // Save directly to localStorage
      const storageKey = `trip-packing-${trip._id}`;
      localStorage.setItem(storageKey, JSON.stringify(formattedItems));
    } catch (err: any) {
      console.error("Fetch Packing API Error:", err);
      setError(err.message || "Unable to fetch AI packing checklist. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  // Effect to load local items or query the AI backend if first run
  useEffect(() => {
    const storageKey = `trip-packing-${trip._id}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const savedItems = JSON.parse(saved);
        if (Array.isArray(savedItems)) {
          setItems(savedItems);
          setError("");
        } else {
          fetchAiPackingList();
        }
      } catch (err) {
        fetchAiPackingList();
      }
    } else {
      fetchAiPackingList();
    }
  }, [trip._id, token]);

  // Persist local checklist state modifications (like checkboxes and manually added items)
  useEffect(() => {
    if (items.length > 0 && !loading) {
      const storageKey = `trip-packing-${trip._id}`;
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, trip._id, loading]);

  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: PackingItem = {
      id: `custom-${Date.now()}`,
      text: newItemText.trim(),
      category: newItemCategory,
      checked: false,
      reason: "Added manually",
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemText("");
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetChecklist = () => {
    fetchAiPackingList();
  };

  const totalCount = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const percentPacked = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const categoriesList: PackingItem["category"][] = [
    "Essentials",
    "Clothing",
    "Electronics",
    "Transit & Gear",
    "Interests Pack",
    "Other",
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="smart-packing-checklist">
      {/* Title section */}
      <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-indigo-600" />
            AI Smart Packing Assistant
          </h3>
          <p className="text-[11px] font-semibold text-slate-400">Contextual list tailored to your itinerary & choices</p>
        </div>
        <button
          onClick={handleResetChecklist}
          disabled={loading}
          className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-700 disabled:opacity-55 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider border border-slate-200"
          type="button"
          title="Regenerate list using Gemini AI"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Regenerate</span>
        </button>
      </div>

      {/* Progress status bar */}
      <div className="p-5 border-b border-slate-100 bg-indigo-50/40">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="font-bold text-indigo-800 uppercase text-[10px]">Your Transit bag readiness</span>
          <span className="font-extrabold text-indigo-700">{checkedCount} / {totalCount} Packed ({percentPacked}%)</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentPacked}%` }}
          />
        </div>
        
        {percentPacked === 100 && totalCount > 0 && (
          <div className="mt-3 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg flex items-center gap-2 text-emerald-800 text-[11px] font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Awesome! You are 100% prepared to hit the road! Safety first.</span>
          </div>
        )}
      </div>

      {/* Main core checklist area */}
      <div className="p-5 space-y-5 max-h-[350px] overflow-y-auto relative">
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-white/95">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">Refining Packing Details...</p>
              <p className="text-[10px] font-semibold text-slate-400 max-w-xs mx-auto">
                Gemini is analyzing destination attributes, travel mode, weather clues & sacred venues to draft your sleek list...
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>AI Packing Assistance Offline</span>
            </div>
            <p className="font-medium text-rose-700/90">{error}</p>
            <button
              onClick={fetchAiPackingList}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors"
              type="button"
            >
              Retry AI Draft
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {categoriesList.map((category) => {
              const categoryItems = items.filter((i) => i.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center justify-between">
                    <span>{category}</span>
                    {category === "Interests Pack" && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-indigo-500 normal-case font-bold py-0.5 px-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" /> AI customized
                      </span>
                    )}
                  </h4>
                  <div className="space-y-1.5">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                          item.checked
                            ? "bg-slate-50/70 border-slate-200/50 text-slate-400 line-through"
                            : "bg-white border-slate-100 hover:border-slate-200 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleToggleItem(item.id)}
                          className="mt-0.5 w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 flex flex-col justify-center min-w-0" onClick={() => handleToggleItem(item.id)}>
                          <span className="text-xs font-semibold select-none cursor-pointer leading-normal break-words">
                            {item.text}
                          </span>
                          {item.reason && (
                            <div className="mt-1 flex items-center">
                              <span className="text-[9px] text-indigo-600 bg-indigo-50 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider select-none border border-indigo-100/10">
                                {item.reason}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-slate-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer shrink-0 align-self-start"
                          type="button"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {totalCount === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">
                No items in checklist. Tap 'Regen' or add custom packing items below!
              </div>
            )}
          </>
        )}
      </div>

      {/* Manual item footer input form */}
      <form onSubmit={handleAddItem} className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add custom gear, chore or item..."
            className="col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold"
          />
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value as PackingItem["category"])}
            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="Essentials">Essentials</option>
            <option value="Clothing">Clothing</option>
            <option value="Electronics">Electronics</option>
            <option value="Transit & Gear">Transit & Gear</option>
            <option value="Interests Pack">Interest Pack</option>
            <option value="Other">Other Category</option>
          </select>
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </form>
    </div>
  );
}
