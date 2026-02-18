"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Season,
  SeasonTeam,
  SeasonMatch,
  getActiveSeason,
} from "@/api/seasons";
import { Match, MatchGame, getMatch } from "@/api/matches";
import TabNavigator from "@/components/ui/TabNavigator";
import BowlingScoreboard from "@/components/BowlingScoreboard";

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

      <TabNavigator
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mt-6">
        {activeTab === "teams" && (
          <TeamsPanel teams={season.teams} matches={season.matches} />
        )}
        {activeTab === "schedule" && (
          <SchedulePanel matches={season.matches} teams={season.teams} />
        )}
        {activeTab === "scores" && (
          <ScoresPanel matches={season.matches} teams={season.teams} />
        )}
      </div>
    </div>
  );
}

function TeamsPanel({
  teams,
  matches,
}: {
  teams: SeasonTeam[];
  matches: SeasonMatch[];
}) {
  const teamsWithPoints = useMemo(() => {
    const pointsMap = new Map<string, number>();
    teams.forEach((t) => pointsMap.set(t.id, 0));

    matches.forEach((m) => {
      if (m.homeTeamPoints != null) {
        pointsMap.set(
          m.homeTeam.id,
          (pointsMap.get(m.homeTeam.id) || 0) + m.homeTeamPoints,
        );
      }
      if (m.awayTeamPoints != null) {
        pointsMap.set(
          m.awayTeam.id,
          (pointsMap.get(m.awayTeam.id) || 0) + m.awayTeamPoints,
        );
      }
    });

    return teams
      .map((t) => ({ ...t, totalPoints: pointsMap.get(t.id) || 0 }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [teams, matches]);

  if (teamsWithPoints.length === 0) {
    return (
      <p className="text-foreground/40 text-sm">No teams in this season.</p>
    );
  }

  return (
    <div className="grid gap-3">
      {teamsWithPoints.map((team, index) => (
        <div
          key={team.id}
          className="flex items-center justify-between rounded-lg border border-border bg-surface-light px-5 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-foreground/20 w-4 text-center">
              {index + 1}
            </span>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/40">
                {team.name}
              </h3>
              {team.bowlers.length > 0 ? (
                <p className="text-sm text-foreground/90">
                  {team.bowlers.map((b) => b.name).join(" · ")}
                </p>
              ) : (
                <p className="text-sm text-foreground/30">No bowlers</p>
              )}
            </div>
          </div>
          <span className="text-sm font-bold text-neon-amber">
            {team.totalPoints}{" "}
            <span className="text-[10px] font-normal text-foreground/30">
              pts
            </span>
          </span>
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
    return (
      <p className="text-foreground/40 text-sm">No schedule generated yet.</p>
    );
  }

  const filtered = matches.filter((m) => m.week === selectedWeek);

  // Find the team with a bye this week (if odd number of teams)
  const byeTeam = useMemo(() => {
    if (teams.length % 2 === 0) return null;
    const playingIds = new Set(
      filtered.flatMap((m) => [m.homeTeam.id, m.awayTeam.id]),
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
        {filtered.map((match) => {
          const hasResult =
            match.homeTeamPoints != null && match.awayTeamPoints != null;
          const homeWon = match.winningTeamId === match.homeTeam.id;
          const awayWon = match.winningTeamId === match.awayTeam.id;
          return (
            <div
              key={match.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-light px-4 py-3"
            >
              <div className="flex-1">
                <span
                  className={`text-sm font-medium ${homeWon ? "text-neon-lime" : "text-neon-magenta"}`}
                >
                  {match.homeTeam.name}
                </span>
                {hasResult && (
                  <span
                    className={`ml-2 text-sm font-bold ${homeWon ? "text-neon-lime" : "text-foreground/50"}`}
                  >
                    {match.homeTeamPoints}pts
                  </span>
                )}
              </div>
              <span className="text-xs text-foreground/30 uppercase tracking-widest px-2">
                {hasResult ? "–" : "vs"}
              </span>
              <div className="flex-1 text-right">
                {hasResult && (
                  <span
                    className={`mr-2 text-sm font-bold ${awayWon ? "text-neon-lime" : "text-foreground/50"}`}
                  >
                    {match.awayTeamPoints}pts
                  </span>
                )}
                <span
                  className={`text-sm font-medium ${awayWon ? "text-neon-lime" : "text-neon-cyan"}`}
                >
                  {match.awayTeam.name}
                </span>
              </div>
            </div>
          );
        })}
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

function ScoresPanel({
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
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [fullMatch, setFullMatch] = useState<Match | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedGameNumber, setSelectedGameNumber] = useState<number>(1);

  useEffect(() => {
    if (weeks.length > 0 && selectedWeek === null) {
      setSelectedWeek(weeks[0]);
    }
  }, [weeks, selectedWeek]);

  const loadMatch = useCallback(async (matchId: string) => {
    setSelectedMatchId(matchId);
    setLoadError(null);
    setMatchLoading(true);
    try {
      const m = await getMatch(matchId);
      setFullMatch(m);
    } catch {
      setLoadError("Failed to load match details.");
    } finally {
      setMatchLoading(false);
    }
  }, []);

  if (matches.length === 0) {
    return (
      <p className="text-foreground/40 text-sm">No matches in this season.</p>
    );
  }

  const filteredMatches = matches.filter((m) => m.week === selectedWeek);
  const hasScores =
    fullMatch &&
    fullMatch.games &&
    fullMatch.games.some((g) => g.frames.length > 0);

  const selectedGame: MatchGame | undefined = fullMatch?.games?.find(
    (g) => g.gameNumber === selectedGameNumber,
  );

  const matchBowlers = useMemo(() => {
    if (!fullMatch) return [];
    const subMap = new Map<string, { id: string; name: string }>();
    for (const sub of fullMatch.substitutions ?? []) {
      subMap.set(sub.originalBowlerId, {
        id: sub.substituteBowler.id,
        name: sub.substituteBowler.name,
      });
    }
    const mapBowler = (b: { id: string; name: string }) => {
      const replacement = subMap.get(b.id);
      return replacement ?? b;
    };
    return [
      ...fullMatch.homeTeam.bowlers.map(mapBowler),
      ...fullMatch.awayTeam.bowlers.map(mapBowler),
    ];
  }, [fullMatch]);

  return (
    <div className="space-y-4">
      {/* Week chips */}
      <div className="flex flex-wrap gap-2">
        {weeks.map((w) => (
          <button
            key={w}
            onClick={() => {
              setSelectedWeek(w);
              setSelectedMatchId(null);
              setFullMatch(null);
              setLoadError(null);
            }}
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

      {/* Match selector */}
      {!selectedMatchId && (
        <div className="grid gap-3">
          {filteredMatches.map((match) => {
            const hasResult =
              match.homeTeamPoints != null && match.awayTeamPoints != null;
            const homeWon = match.winningTeamId === match.homeTeam.id;
            const awayWon = match.winningTeamId === match.awayTeam.id;
            return (
              <button
                key={match.id}
                onClick={() => loadMatch(match.id)}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-light px-4 py-3 transition-all hover:border-neon-cyan/40 hover:bg-surface-light/80"
              >
                <div className="flex-1 text-left">
                  <span
                    className={`text-sm font-medium ${homeWon ? "text-neon-lime" : "text-neon-magenta"}`}
                  >
                    {match.homeTeam.name}
                  </span>
                  {hasResult && (
                    <span
                      className={`ml-2 text-sm font-bold ${homeWon ? "text-neon-lime" : "text-foreground/50"}`}
                    >
                      {match.homeTeamPoints}pts
                    </span>
                  )}
                </div>
                <span className="text-xs text-foreground/30 uppercase tracking-widest px-2">
                  {hasResult ? "–" : "vs"}
                </span>
                <div className="flex-1 text-right">
                  {hasResult && (
                    <span
                      className={`mr-2 text-sm font-bold ${awayWon ? "text-neon-lime" : "text-foreground/50"}`}
                    >
                      {match.awayTeamPoints}pts
                    </span>
                  )}
                  <span
                    className={`text-sm font-medium ${awayWon ? "text-neon-lime" : "text-neon-cyan"}`}
                  >
                    {match.awayTeam.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Match detail */}
      {selectedMatchId && (
        <div className="space-y-4">
          <button
            onClick={() => {
              setSelectedMatchId(null);
              setFullMatch(null);
              setLoadError(null);
            }}
            className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            ← Back to matches
          </button>

          {matchLoading && (
            <p className="text-foreground/40 text-sm animate-pulse">
              Loading match...
            </p>
          )}

          {loadError && <p className="text-sm text-red-400">{loadError}</p>}

          {!matchLoading && hasScores && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-widest">
                Scoreboard
              </h3>

              {/* Game tabs */}
              <div className="flex gap-2">
                {[1, 2, 3].map((gn) => (
                  <button
                    key={gn}
                    onClick={() => setSelectedGameNumber(gn)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                      selectedGameNumber === gn
                        ? "border-neon-cyan bg-neon-cyan/15 text-neon-cyan"
                        : "border-border text-foreground/40 hover:border-foreground/30"
                    }`}
                  >
                    Game {gn}
                  </button>
                ))}
              </div>

              {selectedGame && selectedGame.frames.length > 0 ? (
                <BowlingScoreboard
                  frames={selectedGame.frames}
                  bowlers={matchBowlers}
                />
              ) : (
                <p className="text-sm text-foreground/40">
                  No scores for Game {selectedGameNumber} yet.
                </p>
              )}
            </div>
          )}

          {!matchLoading && !hasScores && !loadError && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface py-12 gap-3">
              <p className="text-sm text-foreground/40">
                No scores recorded yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
