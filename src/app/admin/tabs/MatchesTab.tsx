"use client";

import { useEffect, useState } from "react";
import { Match, getMatches, updateMatch } from "@/api/matches";

export default function MatchesTab() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWeek, setFilterWeek] = useState<number | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHome, setEditHome] = useState("");
  const [editAway, setEditAway] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const matchesData = await getMatches();
      setMatches(matchesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (match: Match) => {
    setEditingId(match.id);
    setEditHome(
      match.homeTeamPoints != null ? String(match.homeTeamPoints) : "",
    );
    setEditAway(
      match.awayTeamPoints != null ? String(match.awayTeamPoints) : "",
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditHome("");
    setEditAway("");
  };

  const handleSavePoints = async (match: Match) => {
    const homePoints = editHome === "" ? null : parseInt(editHome, 10);
    const awayPoints = editAway === "" ? null : parseInt(editAway, 10);

    if (editHome !== "" && isNaN(homePoints!)) return;
    if (editAway !== "" && isNaN(awayPoints!)) return;

    let winningTeamId: string | null = null;
    if (homePoints != null && awayPoints != null) {
      if (homePoints > awayPoints) winningTeamId = match.homeTeamId;
      else if (awayPoints > homePoints) winningTeamId = match.awayTeamId;
    }

    setSaving(true);
    try {
      await updateMatch(match.id, {
        homeTeamPoints: homePoints,
        awayTeamPoints: awayPoints,
        winningTeamId,
      });
      await load();
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!loading &&
        matches.length > 0 &&
        (() => {
          const weeks = [...new Set(matches.map((m) => m.week))].sort(
            (a, b) => a - b,
          );
          return (
            <div>
              <p className="text-xs uppercase tracking-widest text-foreground/60 mb-2">
                Filter by Week
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilterWeek(null)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                    filterWeek === null
                      ? "border-neon-amber bg-neon-amber/15 text-neon-amber"
                      : "border-border text-foreground/40 hover:border-foreground/30"
                  }`}
                >
                  All
                </button>
                {weeks.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setFilterWeek(w)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                      filterWeek === w
                        ? "border-neon-amber bg-neon-amber/15 text-neon-amber"
                        : "border-border text-foreground/40 hover:border-foreground/30"
                    }`}
                  >
                    Week {w}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

      {loading ? (
        <p className="text-foreground/40 text-sm">Loading matches...</p>
      ) : matches.length === 0 ? (
        <p className="text-foreground/40 text-sm">
          No matches yet. Add teams and seasons first, then create a match
          above.
        </p>
      ) : (
        <div className="grid gap-3">
          {matches
            .filter((m) => filterWeek === null || m.week === filterWeek)
            .map((match) => {
              const isEditing = editingId === match.id;
              return (
                <div
                  key={match.id}
                  className="rounded-lg border border-border bg-surface-light px-4 py-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        <span className="text-neon-cyan">
                          {match.homeTeam.name}
                        </span>
                        <span className="text-foreground/40 mx-2">vs</span>
                        <span className="text-neon-magenta">
                          {match.awayTeam.name}
                        </span>
                      </p>
                      <p className="text-xs text-foreground/40 mt-0.5">
                        {match.season.name} · Week {match.week} ·{" "}
                        {match.games.length} game
                        {match.games.length !== 1 ? "s" : ""} scored
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(match)}
                        className="rounded-md border border-neon-amber/40 bg-neon-amber/10 px-3 py-1.5 text-xs font-medium text-neon-amber transition-all hover:bg-neon-amber/20"
                      >
                        Edit Points
                      </button>
                    )}
                  </div>

                  {/* Current points display */}
                  {!isEditing &&
                    (match.homeTeamPoints != null ||
                      match.awayTeamPoints != null) && (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-foreground/40">Points:</span>
                        <span className="text-neon-cyan font-medium">
                          {match.homeTeam.name} {match.homeTeamPoints ?? "—"}
                        </span>
                        <span className="text-foreground/30">–</span>
                        <span className="text-neon-magenta font-medium">
                          {match.awayTeamPoints ?? "—"} {match.awayTeam.name}
                        </span>
                        {match.winningTeamId && (
                          <span className="rounded-full border border-neon-lime/30 bg-neon-lime/10 px-2 py-0.5 text-[10px] text-neon-lime">
                            Winner:{" "}
                            {match.winningTeamId === match.homeTeamId
                              ? match.homeTeam.name
                              : match.awayTeam.name}
                          </span>
                        )}
                      </div>
                    )}

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="flex flex-wrap items-end gap-3 pt-1">
                      <div className="min-w-[100px]">
                        <label className="block text-[10px] text-foreground/30 mb-1">
                          {match.homeTeam.name} pts
                        </label>
                        <input
                          type="number"
                          value={editHome}
                          onChange={(e) => setEditHome(e.target.value)}
                          className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground/80 tabular-nums"
                          placeholder="—"
                        />
                      </div>
                      <div className="min-w-[100px]">
                        <label className="block text-[10px] text-foreground/30 mb-1">
                          {match.awayTeam.name} pts
                        </label>
                        <input
                          type="number"
                          value={editAway}
                          onChange={(e) => setEditAway(e.target.value)}
                          className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground/80 tabular-nums"
                          placeholder="—"
                        />
                      </div>
                      <button
                        onClick={() => handleSavePoints(match)}
                        disabled={saving}
                        className="rounded-md border border-neon-lime/40 bg-neon-lime/10 px-3 py-1.5 text-xs font-medium text-neon-lime transition-all hover:bg-neon-lime/20 disabled:opacity-40"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground/40 transition-all hover:border-foreground/30 hover:text-foreground/60"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
