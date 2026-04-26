"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

export default function AuthPage() {
  const router = useRouter();

  // STATE
  const [view, setView] = useState<"role" | "form">("role");
  const [role, setRole] = useState<"recruiter" | "candidate" | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // FORM DATA
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = authMode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
      const payload = authMode === "signup"
        ? { ...formData, role }
        : { email: formData.email, password: formData.password };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      if (authMode === "signin") {
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push(data.user.role === "recruiter" ? "/dashboard" : "/candidate/dashboard");
      } else {
        setAuthMode("signin");
        // Smooth transition back to signin
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">

      {/* ── Immersive Background ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-mesh" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px] animate-mesh" style={{ animationDelay: '-10s' }} />
        <div className="absolute inset-0 mesh-gradient opacity-30" />
      </div>

      {/* ── Header Logo ── */}
      <div className="absolute top-12 left-12 z-20 hidden md:flex items-center gap-3">
        <Logo size={40} className="drop-shadow-[0_0_8px_rgba(230,126,92,0.5)]" />
        <span className="text-xl font-bold tracking-tight text-white/90">Interview Integrity</span>
      </div>

      {/* ── Role Selection ── */}
      {view === "role" && (
        <div className="z-10 max-w-5xl w-full flex flex-col items-center transition-all duration-700">
          <div className="text-center mb-16 space-y-4 animate-float">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary-light uppercase tracking-widest mb-4">
              Next-Generation Proctoring
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
              Enter the <span className="text-primary-light italic">Portal</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
              Secure, AI-powered interview integrity for the modern workplace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            {/* Recruiter Card */}
            <div
              onClick={() => { setRole("recruiter"); setView("form"); }}
              className="group relative cursor-pointer glass-card p-10 rounded-[2.5rem] transition-all duration-500 hover:-translate-y-2 hover:border-primary/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 border border-primary/20 group-hover:bg-primary/20 transition-all duration-500">
                  <svg className="w-10 h-10 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold mb-3 group-hover:text-primary-light transition-colors">Recruiter</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">Create high-stakes exams, manage candidates, and analyze AI integrity reports in real-time.</p>
                <div className="flex items-center text-xs font-bold text-primary-light uppercase tracking-widest gap-2">
                  Get Started <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
              </div>
            </div>

            {/* Candidate Card */}
            <div
              onClick={() => { setRole("candidate"); setView("form"); }}
              className="group relative cursor-pointer glass-card p-10 rounded-[2.5rem] transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20 group-hover:bg-blue-500/20 transition-all duration-500">
                  <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold mb-3 group-hover:text-blue-400 transition-colors">Candidate</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">Take your assessment in a secure environment. No downloads required, fully browser-based.</p>
                <div className="flex items-center text-xs font-bold text-blue-400 uppercase tracking-widest gap-2">
                  Join Exam <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <Link href="/" className="group flex items-center gap-3 text-sm text-gray-500 hover:text-white transition-all duration-300">
              <span className="w-8 h-[1px] bg-gray-800 group-hover:w-12 group-hover:bg-primary transition-all duration-500" />
              Back to Home
            </Link>
          </div>
        </div>
      )}

      {/* ── Auth Form ── */}
      {view === "form" && (
        <div className="z-10 w-full max-w-md animate-fade-in-up">
          <button onClick={() => setView("role")} className="group flex items-center gap-2 mb-8 text-sm text-gray-500 hover:text-white transition-all">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Selection
          </button>

          <div className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl pointer-events-none" />

            <div className="text-center mb-10">
              <div className="inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-primary-light uppercase tracking-widest mb-4">
                Secure Access · {role}
              </div>
              <h2 className="text-3xl font-bold">
                {authMode === "signin" ? "Welcome Back" : "Get Started"}
              </h2>
              <p className="text-gray-500 text-sm mt-2 font-medium">
                {authMode === "signin" ? "Please enter your credentials" : "Create your account to continue"}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs py-3 px-4 rounded-xl mb-6 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <div className="flex p-1 bg-black/40 rounded-2xl mb-8 border border-white/5">
              <button
                onClick={() => setAuthMode("signin")}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${authMode === "signin" ? "bg-white/10 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"}`}
              >
                SIGN IN
              </button>
              <button
                onClick={() => setAuthMode("signup")}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${authMode === "signup" ? "bg-white/10 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"}`}
              >
                SIGN UP
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {authMode === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                    <input name="name" type="text" placeholder="John Doe" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Mobile Number</label>
                    <input name="mobile" type="tel" placeholder="+44 7911 123456" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all" />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Work Email</label>
                <input name="email" type="email" placeholder="you@company.com" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all" required />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
                  {authMode === "signin" && <button type="button" className="text-[10px] text-primary-light hover:text-primary font-bold transition-colors">FORGOT?</button>}
                </div>
                <input name="password" type="password" placeholder="••••••••" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all" required />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-[0.98] mt-4 relative overflow-hidden group ${role === 'recruiter' ? 'bg-primary shadow-primary/20' : 'bg-blue-600 shadow-blue-500/20'}`}
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing
                  </div>
                ) : (authMode === "signin" ? "Enter Dashboard" : "Initiate Account")}
              </button>
            </form>

            <p className="text-center mt-8 text-[10px] text-gray-600 font-medium">
              Protected by Integrity AI Multi-Factor Security
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
