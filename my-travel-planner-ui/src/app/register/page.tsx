"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, Mail, Globe, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("travel_token");
    if (savedToken) router.push("/dashboard");
  }, [router]);

  const getApiUrl = (endpoint: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? (window as any).env?.VITE_API_URL : null) || "/api";
    return `${baseUrl.replace(/\/$/, "")}${endpoint}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all register fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(getApiUrl("/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Registration failed. Try again.");
      }

      localStorage.setItem("travel_token", data.token);
      localStorage.setItem("travel_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans px-4 relative">
      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-semibold cursor-pointer"
        id="auth-back-to-landing"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Auth Card */}
      <div className="bg-white border border-slate-200 w-full max-w-md p-8 rounded-2xl shadow-lg shadow-indigo-500/5 relative">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 shadow-inner">
            <Globe className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Create your Account
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Join Travel Planner AI today
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-100 text-sm rounded-lg mb-4 text-center font-bold" id="auth-error-display">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5" htmlFor="name-input">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="name-input"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5" htmlFor="email-input">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email-input"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5" htmlFor="password-input">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5" htmlFor="confirm-password-input">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="confirm-password-input"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed mt-6 shadow-md shadow-indigo-500/10"
            id="auth-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Please wait...
              </>
            ) : (
              <span className="flex items-center gap-1">
                Register <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm">
          <span className="text-slate-500">
            Already have an account?
          </span>{" "}
          <Link
            href="/login"
            className="text-indigo-600 hover:text-indigo-700 font-bold tracking-tight transition-colors focus:outline-none cursor-pointer"
            id="auth-toggle-mode"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
