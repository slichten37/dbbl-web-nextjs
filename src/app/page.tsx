"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Season,
  SeasonTeam,
  SeasonMatch,
  getActiveSeason,
} from "@/api/seasons";
import TabNavigator from "@/components/ui/TabNavigator";

const tabs = [
  { key: "teams", label: "Teams" },
  { key: "schedule", label: "Schedule" },
  { key: "scores", label: "Scores" },
];

export default function Home() {
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("teams");

  useEffect(() => {
    getActiveSeason()
      .then(setSeason)
      .catch(() => setError("No active season found."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-foreground/40 text-sm animate-pulse">Loading...</p>
      </div>
    );
  }

  if (error || !season) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <h1 className="text-3xl font-bold text-neon-cyan text-glow-cyan">
          DBBL
        </h1>
        <p className="text-foreground/50 text-sm">
          {error || "No active season."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-28">
      <h1 className="text-2xl font-bold text-neon-cyan text-glow-cyan mb-1">
        {season.name}
      </h1>
      <p className="text-xs text-foreground/40 mb-6 uppercase tracking-widest">
        Active Season
      </p>

      <TabNavigator tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === "teams" && <TeamsPanel teams={season.teams} />}
        {activeTab === "schedule" && (
          <SchedulePanel matches={season.matches} teams={season.teams} />
        )}
        {activeTab === "scores" && <ScoresPanel />}
      </div>
    </div>
  );
}

function TeamsPanel({ teams }: { teams: SeasonTeam[] }) {
  if (teams.length === 0) {
    return <p className="text-foreground/40 text-sm">No teams in this season.</p>;
  }

  return (
    <div className="grid gap-3">
      {teams.map((team) => (
        <div
          key={team.id}
          className="flex items-center justify-between rounded-lg border border-border bg-surface-light px-5 py-3"
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/40">
            {team.name}
          </h3>
          {team.bowlers.length > 0 ? (
            <div className="flex gap-4">
              {team.bowlers.map((b) => (
                <span
                  key={b.id}
                  className="text-base font-medium text-foreground/90"
                >
                  {b.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/30">No bowlers</p>
          )}
        </div>
      ))}
    </div>
  );
}

function SchedulePanel({
  matches,
  teams,
}: {
  matches: SeasonMatch[];
  teams: SeasonTeam[];
}) {
  const weeks = useMemo(() => {
    const set = new Set(matches.map((m) => m.week));
    return Array.from(set).sort((a, b) => a - b);
  }, [matches]);

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  useEffect(() => {
    if (weeks.length > 0 && selectedWeek === null) {
      setSelectedWeek(weeks[0]);
    }
  }, [weeks, selectedWeek]);

  if (matches.length === 0) {
    return <p className="text-foreground/40 text-sm">No schedule generated yet.</p>;
  }

  const filtered = matches.filter((m) => m.week === selectedWeek);

  // Find the team with a bye this week (if odd number of teams)
  const byeTeam = useMemo(() => {
    if (teams.length % 2 === 0) return null;
    const playingIds = new Set(
      filtered.flatMap((m) => [m.team1.id, m.team2.id]),
    );
    return teams.find((t) => !playingIds.has(t.id)) ?? null;
  }, [teams, filtered]);

  return (
    <div className="space-y-4">
      {/* Week chips */}
      <div className="flex flex-wrap gap-2">
        {weeks.map((w) => (
          <button
            key={w}
            onClick={() => setSelectedWeek(w)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
              selectedWeek === w
                ? "border-neon-lime bg-neon-lime/15 text-neon-lime"
                : "border-border text-foreground/40 hover:border-foreground/30"
            }`}
          >
            Week {w}
          </button>
        ))}
      </div>

      {/* Matches */}
      <div className="grid gap-3">
        {filtered.map((match) => (
          <div
            key={match.id}
            className="flex items-center justify-between rounded-lg border border-border bg-surface-light px-4 py-3"
          >
            <span className="text-sm font-medium text-neon-magenta">
              {match.team1.name}
            </span>
            <span className="text-xs text-foreground/30 uppercase tracking-widest">
              vs
            </span>
            <span className="text-sm font-medium text-neon-cyan">
              {match.team2.name}
            </span>
          </div>
        ))}
      </div>

      {/* Bye week */}
      {byeTeam && (
        <div className="rounded-lg border border-dashed border-neon-amber/40 bg-neon-amber/5 px-4 py-3 text-center">
          <span className="text-xs uppercase tracking-widest text-neon-amber/70">
            Bye Week
          </span>
          <p className="text-sm font-semibold text-neon-amber mt-0.5">
            {byeTeam.name}
          </p>
        </div>
      )}
    </div>
  );
}

function ScoresPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <p className="text-lg font-semibold text-neon-amber text-glow-amber">
        Coming Soon
      </p>
      <p className="text-xs text-foreground/40">
        Scores will be available here once games are played.
      </p>
    </div>
  );
}
