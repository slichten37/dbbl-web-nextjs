"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Season,
  SeasonMatch,
  SeasonTeam,
  getActiveSeason,
  autoFillWeek,
} from "@/api/seasons";
import {
  Match,
  MatchGame,
  BowlerFrameData,
  ScorecardAnalysisResult,
  getMatch,
  analyzeScorecard,
  submitScores,
  createSubstitution,
  deleteSubstitution,
} from "@/api/matches";
import { Bowler, getBowlers } from "@/api/bowlers";
import BowlingScoreboard, {
  BowlingScoreboardEditable,
} from "@/components/BowlingScoreboard";

export default function ScoresTab() {
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActiveSeason()
      .then(setSeason)
      .catch(() => setError("No active season found."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-foreground/40 text-sm animate-pulse">Loading...</p>
    );
  }

  if (error || !season) {
    return (
      <p className="text-foreground/40 text-sm">
        {error || "No active season."}
      </p>
    );
  }

  return (
    <SubmitScoresPanel
      seasonId={season.id}
      matches={season.matches}
      teams={season.teams}
    />
  );
}

function SubmitScoresPanel({
  seasonId,
  matches,
  teams,
}: {
  seasonId: string;
  matches: SeasonMatch[];
  teams: SeasonTeam[];
}) {
  // ---- Week / match picker ----
  const weeks = useMemo(() => {
    const set = new Set(matches.map((m) => m.week));
    return Array.from(set).sort((a, b) => a - b);
  }, [matches]);

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedGameNumber, setSelectedGameNumber] = useState<number>(1);

  // ---- Full match data ----
  const [fullMatch, setFullMatch] = useState<Match | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // ---- All bowlers (for sub picker) ----
  const [allBowlers, setAllBowlers] = useState<Bowler[]>([]);

  // ---- Substitution form ----
  const [subTeamId, setSubTeamId] = useState<string>("");
  const [subOriginalId, setSubOriginalId] = useState<string>("");
  const [subSubstituteId, setSubSubstituteId] = useState<string>("");
  const [subSaving, setSubSaving] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  // ---- Auto-fill ----
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);

  // ---- Upload & analysis ----
  const [analysisResult, setAnalysisResult] =
    useState<ScorecardAnalysisResult | null>(null);
  const [editableBowlers, setEditableBowlers] = useState<
    BowlerFrameData[] | null
  >(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first week
  useEffect(() => {
    if (weeks.length > 0 && selectedWeek === null) {
      setSelectedWeek(weeks[0]);
    }
  }, [weeks, selectedWeek]);

  // Fetch full match data
  const loadMatch = useCallback(async (matchId: string) => {
    setSelectedMatchId(matchId);
    setAnalysisResult(null);
    setEditableBowlers(null);
    setUploadError(null);
    setMatchLoading(true);
    try {
      const [m, bowlers] = await Promise.all([getMatch(matchId), getBowlers()]);
      setFullMatch(m);
      setAllBowlers(bowlers);
    } catch {
      setUploadError("Failed to load match details.");
    } finally {
      setMatchLoading(false);
    }
  }, []);

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMatchId) return;

    setAnalyzing(true);
    setUploadError(null);
    setAnalysisResult(null);
    setEditableBowlers(null);

    try {
      const result = await analyzeScorecard(selectedMatchId, file);
      if (!result.success) {
        setUploadError(
          result.errorMessage ||
            `Analysis failed (${result.confidence}): ${result.reasoning}`,
        );
      } else {
        setAnalysisResult(result);
        setEditableBowlers(
          JSON.parse(JSON.stringify(result.bowlers)) as BowlerFrameData[],
        );
      }
    } catch {
      setUploadError("Failed to analyze scorecard. Please try again.");
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Accept & save
  const handleAccept = async () => {
    if (!editableBowlers || !selectedMatchId) return;
    setSubmitting(true);
    setUploadError(null);
    try {
      const updatedMatch = await submitScores(
        selectedMatchId,
        selectedGameNumber,
        editableBowlers,
      );
      setFullMatch(updatedMatch);
      setAnalysisResult(null);
      setEditableBowlers(null);
    } catch {
      setUploadError("Failed to save scores. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Retry
  const handleRetry = () => {
    setAnalysisResult(null);
    setEditableBowlers(null);
    setUploadError(null);
  };

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

  // Substitution helpers
  const teamBowlersForSub = useMemo(() => {
    if (!fullMatch || !subTeamId) return [];
    const team =
      subTeamId === fullMatch.homeTeamId
        ? fullMatch.homeTeam
        : fullMatch.awayTeam;
    const alreadySubbed = new Set(
      (fullMatch.substitutions ?? []).map((s) => s.originalBowlerId),
    );
    return team.bowlers.filter((b) => !alreadySubbed.has(b.id));
  }, [fullMatch, subTeamId]);

  const availableSubs = useMemo(() => {
    if (!fullMatch) return [];
    const matchTeamBowlerIds = new Set([
      ...fullMatch.homeTeam.bowlers.map((b) => b.id),
      ...fullMatch.awayTeam.bowlers.map((b) => b.id),
    ]);
    const alreadySubbing = new Set(
      (fullMatch.substitutions ?? []).map((s) => s.substituteBowlerId),
    );
    return allBowlers.filter(
      (b) =>
        b.teams.length === 0 &&
        !matchTeamBowlerIds.has(b.id) &&
        !alreadySubbing.has(b.id),
    );
  }, [fullMatch, allBowlers]);

  const handleAddSub = async () => {
    if (!selectedMatchId || !subOriginalId || !subSubstituteId || !subTeamId)
      return;
    setSubSaving(true);
    setSubError(null);
    try {
      const updated = await createSubstitution(selectedMatchId, {
        originalBowlerId: subOriginalId,
        substituteBowlerId: subSubstituteId,
        teamId: subTeamId,
      });
      setFullMatch(updated);
      setSubOriginalId("");
      setSubSubstituteId("");
      setSubTeamId("");
    } catch {
      setSubError("Failed to add substitution.");
    } finally {
      setSubSaving(false);
    }
  };

  const handleRemoveSub = async (subId: string) => {
    if (!selectedMatchId) return;
    try {
      const updated = await deleteSubstitution(selectedMatchId, subId);
      setFullMatch(updated);
    } catch {
      setSubError("Failed to remove substitution.");
    }
  };

  if (matches.length === 0) {
    return (
      <p className="text-foreground/40 text-sm">No matches in this season.</p>
    );
  }

  const filteredMatches = matches.filter((m) => m.week === selectedWeek);

  const selectedGame: MatchGame | undefined = fullMatch?.games?.find(
    (g) => g.gameNumber === selectedGameNumber,
  );
  const hasExistingScores = selectedGame && selectedGame.frames.length > 0;

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
              setAnalysisResult(null);
              setEditableBowlers(null);
              setUploadError(null);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
              selectedWeek === w
                ? "border-neon-amber bg-neon-amber/15 text-neon-amber"
                : "border-border text-foreground/40 hover:border-foreground/30"
            }`}
          >
            Week {w}
          </button>
        ))}
      </div>

      {/* Match selector */}
      {!selectedMatchId && (
        <div className="space-y-4">
          <div className="grid gap-3">
            {filteredMatches.map((match) => (
              <button
                key={match.id}
                onClick={() => loadMatch(match.id)}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-light px-4 py-3 transition-all hover:border-neon-amber/40 hover:bg-surface-light/80"
              >
                <span className="flex-1 text-sm font-medium text-neon-magenta">
                  {match.homeTeam.name}
                </span>
                <span className="text-xs text-foreground/30 uppercase tracking-widest">
                  vs
                </span>
                <span className="flex-1 text-right text-sm font-medium text-neon-cyan">
                  {match.awayTeam.name}
                </span>
              </button>
            ))}
          </div>

          {/* Auto-fill week button */}
          {selectedWeek !== null && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                onClick={async () => {
                  setAutoFilling(true);
                  setAutoFillError(null);
                  try {
                    await autoFillWeek(seasonId, selectedWeek);
                    // Reload page to reflect new scores
                    window.location.reload();
                  } catch {
                    setAutoFillError("Failed to auto-fill scores.");
                  } finally {
                    setAutoFilling(false);
                  }
                }}
                disabled={autoFilling}
                className="rounded-lg border border-neon-magenta/40 bg-neon-magenta/10 px-5 py-2 text-xs font-medium text-neon-magenta transition-all hover:bg-neon-magenta/20 disabled:opacity-40"
              >
                {autoFilling ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-neon-magenta/30 border-t-neon-magenta rounded-full animate-spin" />
                    Auto-filling…
                  </span>
                ) : (
                  "🎲 Auto-Fill Week " + selectedWeek
                )}
              </button>
              <p className="text-[10px] text-foreground/30">
                Generates random scores for all matches this week
              </p>
              {autoFillError && (
                <p className="text-[10px] text-red-400">{autoFillError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Match selected */}
      {selectedMatchId && (
        <div className="space-y-4">
          <button
            onClick={() => {
              setSelectedMatchId(null);
              setFullMatch(null);
              setAnalysisResult(null);
              setEditableBowlers(null);
              setUploadError(null);
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

          {/* Substitution management */}
          {!matchLoading && fullMatch && (
            <div className="rounded-lg border border-border bg-surface-light p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/40">
                Substitutions
              </h3>

              {/* Current subs */}
              {(fullMatch.substitutions ?? []).length > 0 && (
                <div className="grid gap-2">
                  {fullMatch.substitutions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2"
                    >
                      <div className="text-xs">
                        <span className="text-foreground/40">
                          {sub.team.name}:
                        </span>{" "}
                        <span className="text-foreground/60 line-through">
                          {sub.originalBowler.name}
                        </span>{" "}
                        <span className="text-foreground/30">→</span>{" "}
                        <span className="text-neon-amber font-medium">
                          {sub.substituteBowler.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveSub(sub.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add sub form */}
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-[10px] text-foreground/30 mb-1">
                    Team
                  </label>
                  <select
                    value={subTeamId}
                    onChange={(e) => {
                      setSubTeamId(e.target.value);
                      setSubOriginalId("");
                    }}
                    className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground/80"
                  >
                    <option value="">Select team...</option>
                    <option value={fullMatch.homeTeamId}>
                      {fullMatch.homeTeam.name}
                    </option>
                    <option value={fullMatch.awayTeamId}>
                      {fullMatch.awayTeam.name}
                    </option>
                  </select>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] text-foreground/30 mb-1">
                    Original Bowler
                  </label>
                  <select
                    value={subOriginalId}
                    onChange={(e) => setSubOriginalId(e.target.value)}
                    disabled={!subTeamId}
                    className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground/80 disabled:opacity-40"
                  >
                    <option value="">Select bowler...</option>
                    {teamBowlersForSub.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] text-foreground/30 mb-1">
                    Substitute
                  </label>
                  <select
                    value={subSubstituteId}
                    onChange={(e) => setSubSubstituteId(e.target.value)}
                    disabled={!subOriginalId}
                    className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground/80 disabled:opacity-40"
                  >
                    <option value="">Select sub...</option>
                    {availableSubs.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddSub}
                  disabled={
                    subSaving ||
                    !subOriginalId ||
                    !subSubstituteId ||
                    !subTeamId
                  }
                  className="rounded-md border border-neon-amber/40 bg-neon-amber/10 px-3 py-1.5 text-xs font-medium text-neon-amber transition-all hover:bg-neon-amber/20 disabled:opacity-40"
                >
                  {subSaving ? "..." : "+ Add"}
                </button>
              </div>
              {subError && (
                <p className="text-[10px] text-red-400">{subError}</p>
              )}
            </div>
          )}

          {/* Game selector tabs */}
          {!matchLoading && fullMatch && (
            <div className="flex gap-2">
              {[1, 2, 3].map((gn) => (
                <button
                  key={gn}
                  onClick={() => {
                    setSelectedGameNumber(gn);
                    setAnalysisResult(null);
                    setEditableBowlers(null);
                    setUploadError(null);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                    selectedGameNumber === gn
                      ? "border-neon-amber bg-neon-amber/15 text-neon-amber"
                      : "border-border text-foreground/40 hover:border-foreground/30"
                  }`}
                >
                  Game {gn}
                </button>
              ))}
            </div>
          )}

          {/* Existing scores — show with re-scan option */}
          {!matchLoading && hasExistingScores && !editableBowlers && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-widest">
                  Game {selectedGameNumber} Scores
                </h3>
                <label className="cursor-pointer rounded-lg border border-neon-amber/40 bg-neon-amber/10 px-3 py-1.5 text-xs font-medium text-neon-amber transition-all hover:bg-neon-amber/20">
                  Re-scan Scorecard
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="text-[10px] text-foreground/30">
                ⚠ Re-scanning will overwrite existing scores for Game{" "}
                {selectedGameNumber}
              </p>
              <BowlingScoreboard
                frames={selectedGame!.frames}
                bowlers={matchBowlers}
              />
            </div>
          )}

          {/* No scores — upload prompt */}
          {!matchLoading &&
            !hasExistingScores &&
            !editableBowlers &&
            !analyzing && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface py-12 gap-4">
                <p className="text-sm text-foreground/40">
                  No scores for Game {selectedGameNumber}
                </p>
                <p className="text-xs text-foreground/30 max-w-xs text-center">
                  Take a photo of the full scorecard or upload an image
                </p>
                <label className="cursor-pointer rounded-lg border border-neon-amber/60 bg-neon-amber/10 px-5 py-2.5 text-sm font-medium text-neon-amber transition-all hover:bg-neon-amber/20">
                  📷 Upload Scorecard
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}

          {/* Analyzing spinner */}
          {analyzing && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-neon-amber/30 border-t-neon-amber rounded-full animate-spin" />
              <p className="text-sm text-neon-amber animate-pulse">
                Analyzing scorecard…
              </p>
              <p className="text-xs text-foreground/30">
                This may take a few seconds
              </p>
            </div>
          )}

          {/* Error */}
          {uploadError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-center">
              <p className="text-sm text-red-400">{uploadError}</p>
              <button
                onClick={handleRetry}
                className="mt-2 text-xs text-foreground/40 underline hover:text-foreground/60"
              >
                Try again
              </button>
            </div>
          )}

          {/* Editable confirmation screen */}
          {editableBowlers && !submitting && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-widest">
                  Review & Edit Scores
                </h3>
                {analysisResult && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${
                      analysisResult.confidence === "HIGH"
                        ? "border-neon-lime/40 text-neon-lime"
                        : analysisResult.confidence === "MEDIUM"
                          ? "border-neon-amber/40 text-neon-amber"
                          : "border-red-500/40 text-red-400"
                    }`}
                  >
                    {analysisResult.confidence} confidence
                  </span>
                )}
              </div>

              <BowlingScoreboardEditable
                bowlers={editableBowlers}
                onUpdate={setEditableBowlers}
              />

              {analysisResult?.reasoning && (
                <p className="text-[10px] text-foreground/30 leading-relaxed">
                  {analysisResult.reasoning}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAccept}
                  className="flex-1 rounded-lg border border-neon-lime/60 bg-neon-lime/10 py-2.5 text-sm font-medium text-neon-lime transition-all hover:bg-neon-lime/20 glow-lime"
                >
                  ✓ Save Scores
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium text-foreground/50 transition-all hover:border-foreground/30 hover:text-foreground/70"
                >
                  ✕ Retry
                </button>
              </div>
            </div>
          )}

          {/* Submitting spinner */}
          {submitting && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-neon-lime/30 border-t-neon-lime rounded-full animate-spin" />
              <p className="text-sm text-neon-lime animate-pulse">
                Saving scores…
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
