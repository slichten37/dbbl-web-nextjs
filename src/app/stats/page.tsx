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
  | "totalPoints"
  | "matchRecord"
  | "gameRecord"
  | "ppg"
  | "oppg"
  | "spg"
  | "sparespg"
  | "gpg";

const teamColumns: { key: TeamSortKey; label: string }[] = [
  { key: "name", label: "Team" },
  { key: "totalPoints", label: "Points" },
  { key: "matchRecord", label: "Match" },
  { key: "gameRecord", label: "Game" },
  { key: "ppg", label: "PPG" },
  { key: "oppg", label: "OPPG" },
  { key: "spg", label: "SPG" },
  { key: "sparespg", label: "Spares/G" },
  { key: "gpg", label: "Gutters/G" },
];

function formatRecord(w: number, l: number, t: number): string {
  return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
}

function TeamsStatsTable({ teams }: { teams: TeamStats[] }) {
  const [sortKey, setSortKey] = useState<TeamSortKey>("totalPoints");
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
      if (sortKey === "matchRecord") {
        const diff =
          a.matchWins - a.matchLosses - (b.matchWins - b.matchLosses);
        return sortDir === "asc" ? diff : -diff;
      }
      if (sortKey === "gameRecord") {
        const diff = a.gameWins - a.gameLosses - (b.gameWins - b.gameLosses);
        return sortDir === "asc" ? diff : -diff;
      }
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
                <td className="px-3 py-2.5 text-center text-neon-amber font-bold tabular-nums">
                  {team.totalPoints}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {formatRecord(
                    team.matchWins,
                    team.matchLosses,
                    team.matchTies,
                  )}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {formatRecord(team.gameWins, team.gameLosses, team.gameTies)}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {team.ppg.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {team.oppg.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {team.spg.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {team.sparespg.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {team.gpg.toFixed(2)}
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

type BowlerSortKey = "name" | "ppg" | "spg" | "sparespg" | "gpg";

const bowlerColumns: { key: BowlerSortKey; label: string }[] = [
  { key: "name", label: "Bowler" },
  { key: "ppg", label: "PPG" },
  { key: "spg", label: "SPG" },
  { key: "sparespg", label: "Spares/G" },
  { key: "gpg", label: "Gutters/G" },
];

function BowlersStatsTable({ bowlers }: { bowlers: BowlerStats[] }) {
  const [sortKey, setSortKey] = useState<BowlerSortKey>("ppg");
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
                  {bowler.ppg.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {bowler.spg.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {bowler.sparespg.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-center text-foreground/80 tabular-nums">
                  {bowler.gpg.toFixed(2)}
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
