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
        <button
          onClick={onNewGame}
          className={clsx(
            "w-full h-11 pill-accent text-[14px] font-semibold focus-ring tracking-tight",
          )}
        >
          New deal
        </button>
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
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
    <div className="inline-flex p-0.5 rounded-full bg-[color:var(--surface-2)] border border-[color:var(--line)]">
      {options.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className={clsx(
            "px-3 h-7 rounded-full text-[12.5px] font-semibold transition focus-ring",
            value === o.v
              ? "bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
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
        "w-[42px] h-[24px] rounded-full transition focus-ring relative",
        value ? "bg-[color:var(--accent)]" : "bg-[color:var(--surface-2)] border border-[color:var(--line)]",
      )}
    >
      <span
        className={clsx(
          "absolute top-[2px] w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
          value ? "translate-x-[19px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}
