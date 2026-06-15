import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  X, Lock, ShieldCheck, Database, Eye,
  FileSearch, Network, CheckCircle2, ChevronDown,
} from "lucide-react";

interface WaitingListModalProps {
  open: boolean;
  onClose: () => void;
}

const ANALYST_CAPABILITIES = [
  { icon: Eye, label: "Ленты и SIGINT", desc: "Региональные потоки данных, разведка SIGINT/OSINT" },
  { icon: FileSearch, label: "АНАЛИЗ и Нарративы", desc: "6-слойная проверка источников, отслеживание нарративов" },
  { icon: Database, label: "Геополитические данные", desc: "Объекты, оценки угроз, демографические данные" },
];

const ADMIN_CAPABILITIES = [
  { icon: Network, label: "Курирование нарративов", desc: "Создание, редактирование и архивация нарративов" },
  { icon: Database, label: "Сбор данных", desc: "Управление агентствами, RSS-лентами, расписание сбора" },
  { icon: ShieldCheck, label: "Управление платформой", desc: "Для верифицированных орг-ций и институциональных партнеров" },
];

export function WaitingListModal({ open, onClose }: WaitingListModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    role: "analyst" as "analyst" | "admin",
    contribution: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.waitingList.submit.useMutation({
    onSuccess: (data) => {
      if (data.duplicate) {
        toast.info("Ваш email уже в списке ожидания. Мы свяжемся с вами.");
      }
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error("Ошибка при отправке: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    submitMutation.mutate(form);
  };

  if (!open) return null;

  const isAnalyst = form.role === "analyst";
  const caps = isAnalyst ? ANALYST_CAPABILITIES : ADMIN_CAPABILITIES;
  const accentColor = isAnalyst ? "rgba(0,200,255,1)" : "rgba(251,191,36,1)";
  const accentMuted = isAnalyst ? "rgba(0,200,255,0.15)" : "rgba(251,191,36,0.12)";
  const accentBorder = isAnalyst ? "rgba(0,200,255,0.35)" : "rgba(251,191,36,0.35)";
  const accentText = isAnalyst ? "text-cyan-400" : "text-amber-400";
  const accentRing = isAnalyst ? "focus:ring-cyan-500/40" : "focus:ring-amber-500/40";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-2xl rounded-lg overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(160deg, #080d16 0%, #0b1220 60%, #0a0f1a 100%)",
          border: `1px solid ${accentBorder}`,
          boxShadow: `0 0 60px ${accentMuted}, 0 24px 80px rgba(0,0,0,0.7)`,
          transition: "border-color 0.3s, box-shadow 0.3s",
          maxHeight: 'calc(100dvh - 2rem)',
        }}
      >
        {/* Top scan-line accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, opacity: 0.6 }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded flex items-center justify-center"
              style={{ background: accentMuted, border: `1px solid ${accentBorder}` }}
            >
              <Lock className={`w-4 h-4 ${accentText}`} />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-widest font-mono">ЗАПРОСИТЬ ДОСТУП</div>
              <div className="text-[11px] font-mono" style={{ color: accentColor, opacity: 0.7 }}>
                REDROOM · СПИСОК ОЖИДАНИЯ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-white/8"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {submitted ? (
          /* ── Success state ── */
          <div className="px-8 py-12 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: accentMuted, border: `1px solid ${accentBorder}` }}
            >
              <CheckCircle2 className={`w-8 h-8 ${accentText}`} />
            </div>
            <div className="text-white font-bold text-base tracking-widest font-mono mb-1">ЗАПРОС ПРИНЯТ</div>
            <div className="text-xs font-mono mb-4" style={{ color: accentColor, opacity: 0.6 }}>
              ЗАПИСЬ СОХРАНЕНА · ОЖИДАЕТ ПРОВЕРКИ
            </div>
            <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
              Ваш запрос был зарегистрирован. Наша команда рассмотрит ваш профиль и свяжется с вами
              по поводу предоставления доступа. Благодарим за интерес к Redroom.
            </p>
            <button
              onClick={onClose}
              className={`mt-7 px-7 py-2.5 rounded text-xs font-mono font-bold tracking-widest transition-all ${accentText}`}
              style={{ background: accentMuted, border: `1px solid ${accentBorder}` }}
            >
              ЗАКРЫТЬ
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-5 overflow-y-auto">

            {/* ── Account Level Selector ── */}
            <div>
              <div className="text-[10px] font-mono font-semibold tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                УРОВЕНЬ ДОСТУПА *
              </div>
              <div className="flex flex-col gap-2">
                {(["analyst", "admin"] as const).map((role) => {
                  const isActive = form.role === role;
                  const roleAccent = role === "analyst" ? "rgba(0,200,255,1)" : "rgba(251,191,36,1)";
                  const roleAccentMuted = role === "analyst" ? "rgba(0,200,255,0.1)" : "rgba(251,191,36,0.08)";
                  const roleText = role === "analyst" ? "text-cyan-400" : "text-amber-400";
                  const roleCaps = role === "analyst" ? ANALYST_CAPABILITIES : ADMIN_CAPABILITIES;
                  const roleLabel = role === "analyst" ? "АНАЛИТИК РАЗВЕДКИ" : "АДМИНИСТРАТОР ПЛАТФОРМЫ";
                  const roleTagline = role === "analyst"
                    ? "Исследователи · Журналисты · Полисмейкеры · Профессионалы безопасности"
                    : "Верифицированные орг-ции · Подразделения разведки · Институциональные партнеры";

                  return (
                    <div
                      key={role}
                      className="rounded overflow-hidden transition-all duration-200"
                      style={{
                        background: isActive ? roleAccentMuted : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isActive ? roleAccent : "rgba(255,255,255,0.08)"}`,
                        boxShadow: isActive ? `0 0 16px ${roleAccentMuted}` : "none",
                      }}
                    >
                      {/* Clickable header row */}
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, role }))}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                      >
                        <div>
                          <div className={`text-xs font-mono font-bold tracking-widest leading-none ${isActive ? roleText : "text-gray-500"}`}>
                            {roleLabel}
                          </div>
                          <div className="text-[9px] mt-0.5 leading-tight" style={{ color: "rgba(255,255,255,0.28)" }}>
                            {roleTagline}
                          </div>
                        </div>
                        <ChevronDown
                          size={13}
                          className={`shrink-0 ml-3 transition-transform duration-200 ${isActive ? roleText : "text-gray-600"}`}
                          style={{ transform: isActive ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                      </button>

                      {/* Expandable capabilities — only shown when selected */}
                      {isActive && (
                        <div
                          className="px-4 pb-3 pt-1 border-t grid grid-cols-3 gap-2"
                          style={{ borderColor: `${roleAccent}18` }}
                        >
                          {roleCaps.map(({ icon: Icon, label, desc }) => (
                            <div key={label} className="flex flex-col items-start gap-1">
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                                style={{
                                  background: `${roleAccent}18`,
                                  border: `1px solid ${roleAccent}30`,
                                }}
                              >
                                <Icon className={`w-2.5 h-2.5 ${roleText}`} />
                              </div>
                              <div className={`text-[9px] font-mono font-semibold leading-tight ${roleText}`}>{label}</div>
                              <div className="text-[8px] leading-tight" style={{ color: "rgba(255,255,255,0.28)" }}>{desc}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* ── Name + Email ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-semibold tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  ПОЛНОЕ ИМЯ *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ваше имя"
                  className={`w-full px-3 py-2 rounded text-sm text-white placeholder-gray-700 outline-none focus:ring-1 font-mono ${accentRing}`}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-semibold tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  EMAIL *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@org.com"
                  className={`w-full px-3 py-2 rounded text-sm text-white placeholder-gray-700 outline-none focus:ring-1 font-mono ${accentRing}`}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                />
              </div>
            </div>

            {/* ── Organisation + Phone ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-semibold tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  ОРГАНИЗАЦИЯ
                </label>
                <input
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Компания / Учреждение"
                  className={`w-full px-3 py-2 rounded text-sm text-white placeholder-gray-700 outline-none focus:ring-1 font-mono ${accentRing}`}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-semibold tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  ТЕЛЕФОН <span style={{ color: "rgba(255,255,255,0.2)" }}>— НЕОБЯЗАТЕЛЬНО</span>
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+7 000 000 0000"
                  className={`w-full px-3 py-2 rounded text-sm text-white placeholder-gray-700 outline-none focus:ring-1 font-mono ${accentRing}`}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                />
              </div>
            </div>

            {/* ── Contribution ── */}
            <div>
              <label className="block text-[10px] font-mono font-semibold tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                ВАШ ВКЛАД В ПРОЕКТ
              </label>
              <textarea
                rows={3}
                value={form.contribution}
                onChange={(e) => setForm((f) => ({ ...f, contribution: e.target.value }))}
                placeholder="Опишите ваш опыт, компетенции или то, как вы планируете использовать платформу или участвовать в её развитии..."
                className={`w-full px-3 py-2 rounded text-sm text-white placeholder-gray-700 outline-none focus:ring-1 font-mono resize-none ${accentRing}`}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
              />
            </div>

            {/* ── Submit row ── */}
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 pb-1 border-t"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <p className="text-[10px] font-mono leading-relaxed sm:max-w-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                Письмо с подтверждением не отправляется. Наша команда свяжется с вами, если доступ будет одобрен.
              </p>
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className={`sm:ml-4 shrink-0 px-6 py-2.5 rounded text-xs font-mono font-bold tracking-widest transition-all disabled:opacity-40 w-full sm:w-auto ${accentText}`}
                style={{
                  background: accentMuted,
                  border: `1px solid ${accentBorder}`,
                  boxShadow: submitMutation.isPending ? "none" : `0 0 16px ${accentMuted}`,
                }}
              >
                {submitMutation.isPending ? "ОТПРАВКА…" : "ОТПРАВИТЬ ЗАПРОС"}
              </button>
            </div>
          </form>
        )}

        {/* Bottom scan-line accent */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, opacity: 0.25 }}
        />
      </div>
    </div>
  );
}
