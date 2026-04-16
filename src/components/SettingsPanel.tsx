import clsx from "clsx";
import type { Settings } from "../game/types";

interface Props {
  settings: Settings;
  onChange: (p: Partial<Settings>) => void;
  onNewGame: () => void;
}

export function SettingsPanel({ settings, onChange, onNewGame }: Props) {
  return (
    <div className="space-y-5">
      <Row label="Draw" hint="Changes apply to next deal">
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
            { v: "felt", label: "Felt" },
            { v: "paper", label: "Paper" },
          ]}
          onChange={(v) => onChange({ theme: v as "felt" | "paper" })}
        />
      </Row>

      <Row label="Auto-move on double-click">
        <Toggle value={settings.autoMove} onChange={(v) => onChange({ autoMove: v })} />
      </Row>

      <Row label="Sound">
        <Toggle value={settings.sound} onChange={(v) => onChange({ sound: v })} />
      </Row>

      <Row label="Animations">
        <Toggle value={settings.animations} onChange={(v) => onChange({ animations: v })} />
      </Row>

      <div className="hair" />

      <button
        onClick={onNewGame}
        className={clsx(
          "w-full h-10 rounded-full font-display italic tracking-wide",
          "bg-[color:var(--accent)] text-[color:var(--bg)] hover:brightness-110 focus-ring transition",
        )}
      >
        new deal
      </button>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="font-display text-[16px] leading-none">{label}</div>
        {hint && (
          <div className="font-display italic text-[11px] text-[color:var(--fg-soft)] mt-1">
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
    <div className="inline-flex p-0.5 rounded-full border border-[color:var(--rule)] bg-[color:var(--bg)]">
      {options.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className={clsx(
            "px-3 h-7 rounded-full text-[13px] font-display transition focus-ring",
            value === o.v
              ? "bg-[color:var(--accent)] text-[color:var(--bg)]"
              : "text-[color:var(--fg-soft)] hover:text-[color:var(--fg)]",
          )}
        >
          {o.label}
        </button>
      ))}
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
        "w-10 h-6 rounded-full transition focus-ring relative",
        value ? "bg-[color:var(--accent)]" : "bg-[color:color-mix(in_oklab,var(--fg)_16%,transparent)]",
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 w-5 h-5 rounded-full bg-[color:var(--bg)] transition-transform",
          value ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
