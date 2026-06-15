import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

type Portal = "intel" | "orbit" | "sigint" | "contribute";

interface UpgradeButtonProps {
  portal: Portal;
  /** compact = icon + text, icon-only = just the star */
  variant?: "compact" | "icon-only";
  className?: string;
}

const PREMIUM_FEATURES = [
  { icon: "🛰️", label: "Изолированное развертывание", desc: "Полностью автономный суверенный экземпляр" },
  { icon: "⚡", label: "SIGINT-лента в реальном времени", desc: "Живой поток данных радиоэлектронной разведки" },
  { icon: "🔗", label: "Интеграция C4ISR", desc: "Прямое подключение к системам управления" },
  { icon: "🧠", label: "Собственные модели ИИ", desc: "Обученные на вашем ландшафте угроз" },
  { icon: "🔒", label: "SLA и поддержка 24/7", desc: "Выделенный канал поддержки аналитиков" },
  { icon: "📡", label: "Расширение источников", desc: "Проприетарные и закрытые каналы данных" },
];

export function UpgradeButton({ portal, variant = "compact", className = "" }: UpgradeButtonProps) {
  // Bypassed for Enterprise/Sovereign deployment
  return null;
}

      {/* ── Keyframe styles injected once ── */}
      <style>{`
        @keyframes upgradeShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes upgradeCardIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
