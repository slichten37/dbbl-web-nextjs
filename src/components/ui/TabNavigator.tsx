"use client";

type Tab = {
  key: string;
  label: string;
};

type Variant = "cyan" | "magenta" | "lime" | "amber";

const tabColors: Variant[] = ["cyan", "magenta", "lime", "amber"];

const activeStyles: Record<Variant, string> = {
  cyan: "border-neon-cyan text-neon-cyan text-glow-cyan",
  magenta: "border-neon-magenta text-neon-magenta text-glow-magenta",
  lime: "border-neon-lime text-neon-lime text-glow-lime",
  amber: "border-neon-amber text-neon-amber text-glow-amber",
};

interface TabNavigatorProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function TabNavigator({
  tabs,
  activeTab,
  onTabChange,
}: TabNavigatorProps) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab, i) => {
        const color = tabColors[i % tabColors.length];
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-5 py-3 text-sm font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 ${
              isActive
                ? activeStyles[color]
                : "border-transparent text-foreground/40 hover:text-foreground/70"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
