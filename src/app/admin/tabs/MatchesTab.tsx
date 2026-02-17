"use client";

import { useEffect, useState } from "react";
import {
  Match,
  getMatches /* createMatch, updateMatch */,
} from "@/api/matches";
// import { Team, getTeams } from "@/api/teams";
// import { Season, getSeasons } from "@/api/seasons";
// import { NeonButton, NeonInput, NeonSelect } from "@/components/ui";

export default function MatchesTab() {
  const [matches, setMatches] = useState<Match[]>([]);
  // const [allTeams, setAllTeams] = useState<Team[]>([]);
  // const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  // const [team1Id, setTeam1Id] = useState("");
  // const [team2Id, setTeam2Id] = useState("");
  // const [seasonId, setSeasonId] = useState("");
  // const [week, setWeek] = useState("");
  // const [editingId, setEditingId] = useState<string | null>(null);
  // const [saving, setSaving] = useState(false);
  const [filterWeek, setFilterWeek] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [matchesData] = await Promise.all([
        getMatches(),
        // getTeams(),
        // getSeasons(),
      ]);
      setMatches(matchesData);
      // setAllTeams(teamsData);
      // setAllSeasons(seasonsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // const resetForm = () => {
  //   setTeam1Id("");
  //   setTeam2Id("");
  //   setSeasonId("");
  //   setWeek("");
  //   setEditingId(null);
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!team1Id || !team2Id || !seasonId || !week) return;
  //   setSaving(true);
  //   try {
  //     const data = {
  //       team1Id,
  //       team2Id,
  //       seasonId,
  //       week: parseInt(week, 10),
  //     };
  //     if (editingId) {
  //       await updateMatch(editingId, data);
  //     } else {
  //       await createMatch(data);
  //     }
  //     resetForm();
  //     await load();
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // const startEdit = (match: Match) => {
  //   setEditingId(match.id);
  //   setTeam1Id(match.team1Id);
  //   setTeam2Id(match.team2Id);
  //   setSeasonId(match.seasonId);
  //   setWeek(String(match.week));
  // };

  // const teamOptions = allTeams.map((t) => ({ value: t.id, label: t.name }));
  // const seasonOptions = allSeasons.map((s) => ({ value: s.id, label: s.name }));

  // const isValid = team1Id && team2Id && seasonId && week && team1Id !== team2Id;

  return (
    <div className="space-y-6">
      {/* <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <NeonSelect
            variant="amber"
            label="Team 1"
            id="match-team1"
            options={teamOptions}
            placeholder="Select team 1..."
            value={team1Id}
            onChange={(e) => setTeam1Id(e.target.value)}
          />
          <NeonSelect
            variant="amber"
            label="Team 2"
            id="match-team2"
            options={teamOptions}
            placeholder="Select team 2..."
            value={team2Id}
            onChange={(e) => setTeam2Id(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NeonSelect
            variant="amber"
            label="Season"
            id="match-season"
            options={seasonOptions}
            placeholder="Select season..."
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
          />
          <NeonInput
            variant="amber"
            label="Week"
            id="match-week"
            type="number"
            min={1}
            placeholder="1"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <NeonButton
            type="submit"
            variant="amber"
            disabled={saving || !isValid}
          >
            {saving ? "Saving..." : editingId ? "Update Match" : "Add Match"}
          </NeonButton>
          {editingId && (
            <NeonButton type="button" variant="magenta" onClick={resetForm}>
              Cancel
            </NeonButton>
          )}
        </div>
      </form> */}

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
            .map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-light px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    <span className="text-neon-cyan">{match.team1.name}</span>
                    <span className="text-foreground/40 mx-2">vs</span>
                    <span className="text-neon-magenta">
                      {match.team2.name}
                    </span>
                  </p>
                  <p className="text-xs text-foreground/40 mt-0.5">
                    {match.season.name} · Week {match.week} ·{" "}
                    {match.frames.length} frame
                    {match.frames.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {/* <NeonButton variant="amber" onClick={() => startEdit(match)}>
                Edit
              </NeonButton> */}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
