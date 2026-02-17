"use client";

import { useEffect, useState } from "react";
import {
  Season,
  getSeasons,
  createSeason,
  updateSeason,
  generateSchedule,
} from "@/api/seasons";
import { Team, getTeams } from "@/api/teams";
import { NeonButton, NeonInput } from "@/components/ui";

export default function SeasonsTab() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [seasonsData, teamsData] = await Promise.all([
        getSeasons(),
        getTeams(),
      ]);
      setSeasons(seasonsData);
      setAllTeams(teamsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateSeason(editingId, {
          name: name.trim(),
          isActive,
          teamIds: selectedTeamIds,
        });
      } else {
        await createSeason({
          name: name.trim(),
          isActive,
          teamIds: selectedTeamIds,
        });
      }
      setName("");
      setIsActive(false);
      setSelectedTeamIds([]);
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (season: Season) => {
    setEditingId(season.id);
    setName(season.name);
    setIsActive(season.isActive);
    setSelectedTeamIds(season.teams.map((t) => t.id));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setIsActive(false);
    setSelectedTeamIds([]);
  };

  const handleGenerateSchedule = async (seasonId: string) => {
    setGeneratingId(seasonId);
    try {
      await generateSchedule(seasonId);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to generate schedule");
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-end gap-3">
          <NeonInput
            variant="magenta"
            label={editingId ? "Edit Season Name" : "New Season Name"}
            placeholder="e.g. Fall 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            id="season-name"
          />
          <NeonButton
            type="submit"
            variant="magenta"
            disabled={saving || !name.trim()}
          >
            {saving ? "Saving..." : editingId ? "Update" : "Add"}
          </NeonButton>
          {editingId && (
            <NeonButton type="button" variant="cyan" onClick={cancelEdit}>
              Cancel
            </NeonButton>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-neon-lime w-4 h-4"
          />
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            Active Season
          </span>
        </label>

        {allTeams.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-foreground/60 mb-2">
              Select Teams
            </p>
            <div className="flex flex-wrap gap-2">
              {allTeams.map((team) => {
                const selected = selectedTeamIds.includes(team.id);
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => toggleTeam(team.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                      selected
                        ? "border-neon-magenta bg-neon-magenta/15 text-neon-magenta"
                        : "border-border text-foreground/40 hover:border-foreground/30"
                    }`}
                  >
                    {team.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </form>

      {loading ? (
        <p className="text-foreground/40 text-sm">Loading seasons...</p>
      ) : seasons.length === 0 ? (
        <p className="text-foreground/40 text-sm">
          No seasons yet. Add one above.
        </p>
      ) : (
        <div className="grid gap-3">
          {seasons.map((season) => (
            <div
              key={season.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-light px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-neon-magenta">
                    {season.name}
                  </p>
                  {season.isActive && (
                    <span className="rounded-full bg-neon-lime/15 border border-neon-lime px-2 py-0.5 text-[10px] font-bold text-neon-lime uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/40 mt-0.5">
                  {season.teams.length > 0
                    ? season.teams.map((t) => t.name).join(", ")
                    : "No teams"}
                  {" · "}
                  {season.matches.length} match
                  {season.matches.length !== 1 ? "es" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {season.matches.length === 0 && season.teams.length >= 2 && (
                  <NeonButton
                    variant="lime"
                    onClick={() => handleGenerateSchedule(season.id)}
                    disabled={generatingId === season.id}
                  >
                    {generatingId === season.id
                      ? "Generating..."
                      : "Generate Schedule"}
                  </NeonButton>
                )}
                <NeonButton variant="amber" onClick={() => startEdit(season)}>
                  Edit
                </NeonButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
