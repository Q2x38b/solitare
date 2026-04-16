import { motion } from "motion/react";
import clsx from "clsx";
import type { Settings } from "../game/types";

interface Props {
  settings: Settings;
  onChange: (p: Partial<Settings>) => void;
  onNewGame: () => void;
}

export function SettingsPanel({ settings, onChange, onNewGame }: Props) {
  return (
    <div className="space-y-1.5">
      <Row label="Draw" hint="Applies to next deal">
        <Seg
          value={settings.drawCount}
          options={[
            { v: 1, label: "1" },
            { v: 3, label: "3" },
          ]}
          onChange={(v) => onChange({ drawCount: v as 1 | 3 })}
        />
      </Row>

      <Row label="Theme">
        <Seg
          value={settings.theme}
          options={[
            { v: "felt", label: "Dark" },
            { v: "paper", label: "Light" },
          ]}
          onChange={(v) => onChange({ theme: v as "felt" | "paper" })}
        />
      </Row>

      <Row label="Double-click to move">
        <Toggle value={settings.autoMove} onChange={(v) => onChange({ autoMove: v })} />
      </Row>

      <Row label="Sound">
        <Toggle value={settings.sound} onChange={(v) => onChange({ sound: v })} />
      </Row>

      <Row label="Animations">
        <Toggle value={settings.animations} onChange={(v) => onChange({ animations: v })} />
      </Row>

      <div className="pt-4">
        <motion.button
          onClick={onNewGame}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
          className="w-full h-11 pill-accent text-[14px] font-semibold focus-ring tracking-tight"
        >
          New deal
        </motion.button>
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  // Padding generous so there's no dead area between rows (Interfaces: interactivity)
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div>
        <div className="text-[14.5px] font-medium leading-none">{label}</div>
        {hint && (
          <div className="text-[11.5px] text-[color:var(--fg-dim)] mt-1.5 leading-none">
            {hint}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function Seg<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      className="inline-flex p-0.5 rounded-full bg-[color:var(--surface-2)] border border-[color:var(--line)]"
    >
      {options.map((o) => {
        const selected = value === o.v;
        return (
          <motion.button
            key={String(o.v)}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.v)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
            className={clsx(
              "px-3 h-7 rounded-full text-[12.5px] font-semibold focus-ring",
              // Don't change font-weight on selected state — prevents layout shift
              selected
                ? "bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
                : "text-[color:var(--fg-soft)]",
            )}
          >
            {o.label}
          </motion.button>
        );
      })}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={clsx(
        "w-[42px] h-[24px] rounded-full focus-ring relative transition-colors",
        value
          ? "bg-[color:var(--accent)]"
          : "bg-[color:var(--surface-2)] border border-[color:var(--line)]",
      )}
      style={{ transitionDuration: "140ms", transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)" }}
    >
      <motion.span
        className="absolute top-[2px] w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ x: value ? 19 : 2 }}
        transition={{ type: "spring", stiffness: 700, damping: 38, mass: 0.6 }}
      />
    </button>
  );
}
