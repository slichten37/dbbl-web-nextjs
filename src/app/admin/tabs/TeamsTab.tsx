"use client";

import { useEffect, useState } from "react";
import { Team, getTeams, createTeam, updateTeam } from "@/api/teams";
import { Bowler, getBowlers } from "@/api/bowlers";
import { NeonButton, NeonInput } from "@/components/ui";

export default function TeamsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [allBowlers, setAllBowlers] = useState<Bowler[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [selectedBowlerIds, setSelectedBowlerIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [teamsData, bowlersData] = await Promise.all([
        getTeams(),
        getBowlers(),
      ]);
      setTeams(teamsData);
      setAllBowlers(bowlersData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleBowler = (id: string) => {
    setSelectedBowlerIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateTeam(editingId, {
          name: name.trim(),
          bowlerIds: selectedBowlerIds,
        });
      } else {
        await createTeam({
          name: name.trim(),
          bowlerIds: selectedBowlerIds,
        });
      }
      setName("");
      setSelectedBowlerIds([]);
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (team: Team) => {
    setEditingId(team.id);
    setName(team.name);
    setSelectedBowlerIds(team.bowlers.map((b) => b.id));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setSelectedBowlerIds([]);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-end gap-3">
          <NeonInput
            variant="lime"
            label={editingId ? "Edit Team Name" : "New Team Name"}
            placeholder="Enter team name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            id="team-name"
          />
          <NeonButton
            type="submit"
            variant="lime"
            disabled={saving || !name.trim()}
          >
            {saving ? "Saving..." : editingId ? "Update" : "Add"}
          </NeonButton>
          {editingId && (
            <NeonButton type="button" variant="magenta" onClick={cancelEdit}>
              Cancel
            </NeonButton>
          )}
        </div>

        {allBowlers.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-foreground/60 mb-2">
              Select Bowlers
            </p>
            <div className="flex flex-wrap gap-2">
              {allBowlers.map((bowler) => {
                const selected = selectedBowlerIds.includes(bowler.id);
                return (
                  <button
                    key={bowler.id}
                    type="button"
                    onClick={() => toggleBowler(bowler.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                      selected
                        ? "border-neon-lime bg-neon-lime/15 text-neon-lime"
                        : "border-border text-foreground/40 hover:border-foreground/30"
                    }`}
                  >
                    {bowler.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </form>

      {loading ? (
        <p className="text-foreground/40 text-sm">Loading teams...</p>
      ) : teams.length === 0 ? (
        <p className="text-foreground/40 text-sm">
          No teams yet. Add one above.
        </p>
      ) : (
        <div className="grid gap-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-light px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-neon-lime">
                  {team.name}
                </p>
                <p className="text-xs text-foreground/40 mt-0.5">
                  {team.bowlers.length > 0
                    ? team.bowlers.map((b) => b.name).join(", ")
                    : "No bowlers assigned"}
                </p>
                {team.seasons.length > 0 && (
                  <p className="text-xs text-neon-magenta/60 mt-0.5">
                    Seasons: {team.seasons.map((s) => s.name).join(", ")}
                  </p>
                )}
              </div>
              <NeonButton variant="amber" onClick={() => startEdit(team)}>
                Edit
              </NeonButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
