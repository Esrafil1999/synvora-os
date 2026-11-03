"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { getWorkspaceConfig } from "@/lib/api";

export interface LockedFeatureGateProps {
  children: React.ReactNode;
  requiredPlan: "Pro" | "Enterprise";
  title?: string;
  featureName?: string;
  featureTitle?: string;
  description?: string;
  featureDescription?: string;
  benefits?: string[];
}

const PLAN_RANK: Record<string, number> = {
  Starter: 1,
  Pro: 2,
  Enterprise: 3,
};

export default function LockedFeatureGate({
  children,
  requiredPlan,
  title,
  featureName,
  featureTitle,
  description,
  featureDescription,
  benefits,
}: LockedFeatureGateProps) {
  const [activePlan, setActivePlan] = useState<string>("Pro");
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    async function checkPlan() {
      const ws = await getWorkspaceConfig();
      if (ws && ws.active_plan) {
        setActivePlan(String(ws.active_plan));
      }
      setChecking(false);
    }
    checkPlan();
  }, []);

  if (checking) {
    return <div className="py-12 text-center text-sm text-slate-400">Checking workspace subscription...</div>;
  }

  const currentRank = PLAN_RANK[activePlan] || 2;
  const neededRank = PLAN_RANK[requiredPlan] || 2;

  if (currentRank >= neededRank) {
    return <>{children}</>;
  }

  const displayTitle = title || featureTitle || featureName || `${requiredPlan} Plan Feature`;
  const displayDesc =
    featureDescription ||
    description ||
    `Upgrade your workspace to the ${requiredPlan} plan to unlock this module.`;

  return (
    <div className="max-w-2xl mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
        <Lock className="w-7 h-7" />
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
        <Sparkles className="w-3.5 h-3.5" /> Requires {requiredPlan} Plan (Current: {activePlan})
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900">{displayTitle}</h2>
      <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">{displayDesc}</p>

      {Array.isArray(benefits) && benefits.length > 0 && (
        <ul className="max-w-md mx-auto text-left space-y-2 pt-2">
          {benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-2">
        <Link
          href="/billing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md transition"
        >
          <CheckCircle2 className="w-4 h-4" /> Upgrade to {requiredPlan} in Billing <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}