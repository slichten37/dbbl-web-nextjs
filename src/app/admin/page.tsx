"use client";

import { useEffect, useState } from "react";
import { TabNavigator } from "@/components/ui";
import { NeonButton, NeonInput } from "@/components/ui";
import {
  BowlersTab,
  SeasonsTab,
  TeamsTab,
  MatchesTab,
  ScoresTab,
} from "./tabs";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "yesIGeeb";

const tabs = [
  { key: "seasons", label: "Seasons" },
  { key: "teams", label: "Teams" },
  { key: "bowlers", label: "Bowlers" },
  { key: "matches", label: "Matches" },
  { key: "scores", label: "Scores" },
];

const tabPanels: Record<string, React.ReactNode> = {
  seasons: <SeasonsTab />,
  teams: <TeamsTab />,
  bowlers: <BowlersTab />,
  matches: <MatchesTab />,
  scores: <ScoresTab />,
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("seasons");
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("dbbl-admin-auth");
    if (stored === "true") {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError(false);
      sessionStorage.setItem("dbbl-admin-auth", "true");
    } else {
      setError(true);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="flex flex-col items-center gap-5"
        >
          <h1 className="text-2xl font-bold tracking-wider uppercase text-neon-cyan text-glow-cyan">
            🎳 dbbl admin
          </h1>
          <p className="text-sm text-foreground/50">
            Are you the commissioner?
          </p>
          <NeonInput
            variant="cyan"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            id="admin-password"
          />
          {error && (
            <p className="text-xs text-neon-magenta text-glow-magenta">
              {"No you're not, don't lie"}
            </p>
          )}
          <NeonButton type="submit" variant="cyan" disabled={!password}>
            Enter
          </NeonButton>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-5">
        <h1 className="text-2xl font-bold tracking-wider uppercase text-neon-cyan text-glow-cyan">
          🎳 dbbl admin
        </h1>
      </header>

      <div className="px-6 pt-4">
        <TabNavigator
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <main className="px-6 py-6 max-w-4xl">{tabPanels[activeTab]}</main>
    </div>
  );
}
