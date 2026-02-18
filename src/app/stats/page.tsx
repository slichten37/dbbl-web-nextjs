"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getActiveSeason,
  getSeasonStats,
  BowlerStats,
  TeamStats,
  SeasonStats,
} from "@/api/seasons";
import TabNavigator from "@/components/ui/TabNavigator";

const tabs = [
  { key: "teams", label: "Teams" },
  { key: "bowlers", label: "Bowlers" },
];

type SortDir = "asc" | "desc";

// ============================================================================
// Sort header button
// ============================================================================

function SortHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: string;
  currentKey: string;
  currentDir: SortDir;
  onSort: (key: string) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
        isActive
          ? "text-neon-lime"
          : "text-foreground/30 hover:text-foreground/50"
      }`}
    >
      {label}
      <span className="inline-flex flex-col leading-none -space-y-0.5">
        <span
          className={`text-[7px] ${isActive && currentDir === "asc" ? "text-neon-lime" : "text-foreground/20"}`}
        >
          ▲
        </span>
        <span
          className={`text-[7px] ${isActive && currentDir === "desc" ? "text-neon-lime" : "text-foreground/20"}`}
        >
          ▼
        </span>
      </span>
    </button>
  );
}

// ============================================================================
// Teams stats table
// ============================================================================

type TeamSortKey =
  | "name"
  | "matchWins"
  | "gameWins"
  | "pins"
  | "pinsAgainst"
  | "strikes"
  | "spares"
  | "gutters";

const teamColumns: { key: TeamSortKey; label: string }[] = [
  { key: "name", label: "Team" },
  { key: "matchWins", label: "Match W" },
  { key: "gameWins", label: "Game W" },
  { key: "pins", label: "Pins" },
  { key: "pinsAgainst", label: "Pins Against" },
  { key: "strikes", label: "Strikes" },
  { key: "spares", label: "Spares" },
  { key: "gutters", label: "Gutters" },
];

function TeamsStatsTable({ teams }: { teams: TeamStats[] }) {
  const [sortKey, setSortKey] = useState<TeamSortKey>("matchWins");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: string) => {
    const k = key as TeamSortKey;
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "name" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    return [...teams].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [teams, sortKey, sortDir]);

  if (teams.length === 0) {
    return <p className="text-foreground/40 text-sm">No team stats yet.</p>;
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="rounded-lg border border-border">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-light">
              {teamColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2.5 text-center whitespace-nowrap"
                >
                  <SortHeader
                    label={col.label}
                    sortKey={col.key}
                    currentKey={sortKey}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, i) => (
              <tr
                key={team.id}
                className={`border-b border-border/50 transition-colors hover:bg-surface-light/50 ${
                  i % 2 === 0 ? "bg-surface" : "bg-surface-light/20"
                }`}
              >
                <td className="px-4 py-2.5 min-w-[120px] text-xs font-bold text-neon-cyan">
                  {team.name}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {team.matchWins}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {team.gameWins}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {team.pins.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {team.pinsAgainst.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {team.strikes}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {team.spares}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {team.gutters}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Bowlers stats table
// ============================================================================

type BowlerSortKey = "name" | "pins" | "strikes" | "spares" | "gutters";

const bowlerColumns: { key: BowlerSortKey; label: string }[] = [
  { key: "name", label: "Bowler" },
  { key: "pins", label: "Pins" },
  { key: "strikes", label: "Strikes" },
  { key: "spares", label: "Spares" },
  { key: "gutters", label: "Gutters" },
];

function BowlersStatsTable({ bowlers }: { bowlers: BowlerStats[] }) {
  const [sortKey, setSortKey] = useState<BowlerSortKey>("pins");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: string) => {
    const k = key as BowlerSortKey;
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "name" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    return [...bowlers].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [bowlers, sortKey, sortDir]);

  if (bowlers.length === 0) {
    return <p className="text-foreground/40 text-sm">No bowler stats yet.</p>;
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="rounded-lg border border-border">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-light">
              {bowlerColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2.5 text-center whitespace-nowrap"
                >
                  <SortHeader
                    label={col.label}
                    sortKey={col.key}
                    currentKey={sortKey}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((bowler, i) => (
              <tr
                key={bowler.id}
                className={`border-b border-border/50 transition-colors hover:bg-surface-light/50 ${
                  i % 2 === 0 ? "bg-surface" : "bg-surface-light/20"
                }`}
              >
                <td className="px-4 py-2.5 min-w-[120px] text-xs font-bold text-neon-cyan">
                  {bowler.name}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {bowler.pins.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {bowler.strikes}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {bowler.spares}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {bowler.gutters}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================

export default function StatsPage() {
  const [stats, setStats] = useState<SeasonStats | null>(null);
  const [seasonName, setSeasonName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("teams");

  useEffect(() => {
    (async () => {
      try {
        const season = await getActiveSeason();
        setSeasonName(season.name);
        const s = await getSeasonStats(season.id);
        setStats(s);
      } catch {
        setError("No active season found.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-foreground/40 text-sm animate-pulse">Loading...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <h1 className="text-3xl font-bold text-neon-lime text-glow-lime">
          📊 Stats
        </h1>
        <p className="text-foreground/50 text-sm">
          {error || "No stats available."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28">
      <h1 className="text-2xl font-bold text-neon-lime text-glow-lime mb-1">
        📊 Stats
      </h1>
      <p className="text-xs text-foreground/40 mb-6 uppercase tracking-widest">
        {seasonName}
      </p>

      <TabNavigator
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mt-6">
        {activeTab === "teams" && <TeamsStatsTable teams={stats.teams} />}
        {activeTab === "bowlers" && (
          <BowlersStatsTable bowlers={stats.bowlers} />
        )}
      </div>
    </div>
  );
}
