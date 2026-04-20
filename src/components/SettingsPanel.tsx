import type { ReactNode } from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import type { AutoSpeed, Settings } from "../game/types";

interface Props {
  settings: Settings;
  onChange: (p: Partial<Settings>) => void;
  onNewGame: () => void;
}

export function SettingsPanel({ settings, onChange, onNewGame }: Props) {
  return (
    <div className="space-y-1.5">
      <Row label="Draw" hint="Applies to next deal">
        <ToggleGroup
          type="single"
          value={String(settings.drawCount)}
          onValueChange={(v) => {
            if (v) onChange({ drawCount: Number(v) as 1 | 2 | 3 });
          }}
        >
          <ToggleGroupItem value="1" aria-label="Draw 1">1</ToggleGroupItem>
          <ToggleGroupItem value="2" aria-label="Draw 2">2</ToggleGroupItem>
          <ToggleGroupItem value="3" aria-label="Draw 3">3</ToggleGroupItem>
        </ToggleGroup>
      </Row>

      <Row label="Auto-play speed" hint="Pace of the Auto button">
        <ToggleGroup
          type="single"
          value={settings.autoSpeed}
          onValueChange={(v) => {
            if (v) onChange({ autoSpeed: v as AutoSpeed });
          }}
        >
          <ToggleGroupItem value="slow" aria-label="Slow">Slow</ToggleGroupItem>
          <ToggleGroupItem value="normal" aria-label="Normal">Normal</ToggleGroupItem>
          <ToggleGroupItem value="fast" aria-label="Fast">Fast</ToggleGroupItem>
          <ToggleGroupItem value="turbo" aria-label="Turbo">Turbo</ToggleGroupItem>
        </ToggleGroup>
      </Row>

      <Row label="Double-click to move">
        <Switch
          checked={settings.autoMove}
          onCheckedChange={(v) => onChange({ autoMove: v })}
        />
      </Row>

      <Row label="Sound">
        <Switch
          checked={settings.sound}
          onCheckedChange={(v) => onChange({ sound: v })}
        />
      </Row>

      <Row label="Animations">
        <Switch
          checked={settings.animations}
          onCheckedChange={(v) => onChange({ animations: v })}
        />
      </Row>

      <div className="pt-4">
        <Button
          onClick={onNewGame}
          variant="default"
          size="lg"
          className="w-full"
        >
          New deal
        </Button>
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
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
