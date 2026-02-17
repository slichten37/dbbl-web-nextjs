"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Season,
  SeasonMatch,
  SeasonTeam,
  getActiveSeason,
} from "@/api/seasons";
import {
  Match,
  BowlerFrameData,
  ScorecardAnalysisResult,
  getMatch,
  analyzeScorecard,
  submitScores,
} from "@/api/matches";
import BowlingScoreboard, {
  BowlingScoreboardEditable,
} from "@/components/BowlingScoreboard";

export default function ScoresPage() {
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-foreground/40 text-sm animate-pulse">Loading...</p>
      </div>
    );
  }

  if (error || !season) {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <h1 className="text-2xl font-bold tracking-wider uppercase text-neon-amber text-glow-amber">
          🎳 Submit Scores
        </h1>
        <p className="text-foreground/40 text-sm mt-4">
          {error || "No active season."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-28">
      <h1 className="text-2xl font-bold text-neon-amber text-glow-amber mb-1">
        Submit Scores
      </h1>
      <p className="text-xs text-foreground/40 mb-6 uppercase tracking-widest">
        {season.name}
      </p>

      <SubmitScoresPanel
        matches={season.matches}
        teams={season.teams}
      />
    </div>
  );
}

function SubmitScoresPanel({
  matches,
  teams,
}: {
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

  // ---- Full match data ----
  const [fullMatch, setFullMatch] = useState<Match | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // ---- Upload & analysis ----
  const [analysisResult, setAnalysisResult] =
    useState<ScorecardAnalysisResult | null>(null);
  const [editableBowlers, setEditableBowlers] = useState<BowlerFrameData[] | null>(null);
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
      const m = await getMatch(matchId);
      setFullMatch(m);
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
        // Deep-clone bowlers so edits don't mutate the original result
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
      const updatedMatch = await submitScores(selectedMatchId, editableBowlers);
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

  if (matches.length === 0) {
    return (
      <p className="text-foreground/40 text-sm">No matches in this season.</p>
    );
  }

  const filteredMatches = matches.filter((m) => m.week === selectedWeek);
  const hasExistingScores =
    fullMatch && fullMatch.frames && fullMatch.frames.length > 0;

  const matchBowlers = useMemo(() => {
    if (!fullMatch) return [];
    return [...fullMatch.team1.bowlers, ...fullMatch.team2.bowlers];
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
              setAnalysisResult(null);
              setEditableBowlers(null);
              setUploadError(null);
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
          {filteredMatches.map((match) => (
            <button
              key={match.id}
              onClick={() => loadMatch(match.id)}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-light px-4 py-3 transition-all hover:border-neon-cyan/40 hover:bg-surface-light/80"
            >
              <span className="flex-1 text-sm font-medium text-neon-magenta">
                {match.team1.name}
              </span>
              <span className="text-xs text-foreground/30 uppercase tracking-widest">
                vs
              </span>
              <span className="flex-1 text-right text-sm font-medium text-neon-cyan">
                {match.team2.name}
              </span>
            </button>
          ))}
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

          {/* Existing scores — show with re-scan option */}
          {!matchLoading && hasExistingScores && !editableBowlers && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-widest">
                  Current Scores
                </h3>
                <label className="cursor-pointer rounded-lg border border-neon-amber/40 bg-neon-amber/10 px-3 py-1.5 text-xs font-medium text-neon-amber transition-all hover:bg-neon-amber/20">
                  Re-scan Scorecard
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="text-[10px] text-foreground/30">
                ⚠ Re-scanning will overwrite existing scores
              </p>
              <BowlingScoreboard
                frames={fullMatch!.frames}
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
                  No scores recorded yet
                </p>
                <p className="text-xs text-foreground/30 max-w-xs text-center">
                  Take a photo of the full scorecard or upload an image
                </p>
                <label className="cursor-pointer rounded-lg border border-neon-cyan/60 bg-neon-cyan/10 px-5 py-2.5 text-sm font-medium text-neon-cyan transition-all hover:bg-neon-cyan/20 glow-cyan">
                  📷 Upload Scorecard
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}

          {/* Analyzing spinner */}
          {analyzing && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
              <p className="text-sm text-neon-cyan animate-pulse">
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
