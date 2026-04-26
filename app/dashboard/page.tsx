"use client";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import RecruiterDashboard from "@/components/features/RecruiterDashboard";
import CandidateDashboard from "@/components/features/CandidateDashboard";

export default function DashboardPage() {
  // Pass no role requirement, so it accepts both
  const { user, isHydrated } = useAuth();

  if (!isHydrated || !user) return null; // Avoid hydration flash

  return user.role === "recruiter"
    ? <RecruiterDashboard user={{ _id: user._id, name: user.name }} />
    : <CandidateDashboard user={{ _id: user._id, name: user.name }} />;
}