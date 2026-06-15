/**
 * LLM Quota Enforcement Module
 * 
 * Bypassed for Enterprise/Sovereign deployment.
 * Always allows requests and returns infinite quotas.
 */

import { TRPCError } from "@trpc/server";

export interface QuotaCheckResult {
  allowed: boolean;
  dailyRemaining: number;
  monthlyRemaining: number;
  dailyLimit: number;
  monthlyLimit: number;
  usedToday: number;
  usedThisMonth: number;
  resetInfo?: {
    dailyResetsIn: string;
    monthlyResetsIn: string;
  };
}

export async function checkQuota(userId: number, userRole?: string): Promise<QuotaCheckResult> {
  return {
    allowed: true,
    dailyRemaining: Infinity,
    monthlyRemaining: Infinity,
    dailyLimit: Infinity,
    monthlyLimit: Infinity,
    usedToday: 0,
    usedThisMonth: 0,
    resetInfo: { dailyResetsIn: "Never", monthlyResetsIn: "Never" },
  };
}

export async function incrementUsage(userId: number, count: number = 1): Promise<void> {
  // No-op for Sovereign deployment
}

export async function enforceQuota(userId: number, userRole?: string): Promise<void> {
  // No-op for Sovereign deployment
}

function formatTimeRemaining(ms: number): string {
  return "now";
}
