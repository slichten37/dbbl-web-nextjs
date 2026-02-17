"use client";

import { useEffect, useState } from "react";
import { Bowler, getBowlers, createBowler, updateBowler } from "@/api/bowlers";
import { NeonButton, NeonInput } from "@/components/ui";

export default function BowlersTab() {
  const [bowlers, setBowlers] = useState<Bowler[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setBowlers(await getBowlers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateBowler(editingId, { name: name.trim() });
      } else {
        await createBowler({ name: name.trim() });
      }
      setName("");
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (bowler: Bowler) => {
    setEditingId(bowler.id);
    setName(bowler.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <NeonInput
          variant="cyan"
          label={editingId ? "Edit Bowler Name" : "New Bowler Name"}
          placeholder="Enter bowler name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          id="bowler-name"
        />
        <NeonButton
          type="submit"
          variant="cyan"
          disabled={saving || !name.trim()}
        >
          {saving ? "Saving..." : editingId ? "Update" : "Add"}
        </NeonButton>
        {editingId && (
          <NeonButton type="button" variant="magenta" onClick={cancelEdit}>
            Cancel
          </NeonButton>
        )}
      </form>

      {loading ? (
        <p className="text-foreground/40 text-sm">Loading bowlers...</p>
      ) : bowlers.length === 0 ? (
        <p className="text-foreground/40 text-sm">
          No bowlers yet. Add one above.
        </p>
      ) : (
        <div className="grid gap-3">
          {bowlers.map((bowler) => (
            <div
              key={bowler.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-light px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-neon-cyan">
                  {bowler.name}
                </p>
                {bowler.teams.length > 0 && (
                  <p className="text-xs text-foreground/40 mt-0.5">
                    Teams: {bowler.teams.map((t) => t.name).join(", ")}
                  </p>
                )}
              </div>
              <NeonButton variant="amber" onClick={() => startEdit(bowler)}>
                Edit
              </NeonButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
