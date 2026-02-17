"use client";

import { useMemo, useState } from "react";
import type { MatchFrame, MatchBowler } from "@/api/matches";
import type { FrameData, BowlerFrameData } from "@/api/matches";

// ============================================================================
// Shared scoring helpers
// ============================================================================

interface ScoreFrame {
  frameNumber: number;
  ball1Score: number;
  ball2Score: number | null;
  ball3Score: number | null;
  isBall1Split: boolean;
}

function isStrike(f: ScoreFrame): boolean {
  return f.ball1Score === 10;
}

function isSpare(f: ScoreFrame): boolean {
  if (f.ball2Score === null) return false;
  return !isStrike(f) && f.ball1Score + f.ball2Score === 10;
}

/**
 * Calculate cumulative scores for 10 frames following standard bowling rules.
 * Returns an array of 10 cumulative totals (or null if a frame can't be scored yet).
 */
function calculateRunningTotals(frames: ScoreFrame[]): (number | null)[] {
  const sorted = [...frames].sort((a, b) => a.frameNumber - b.frameNumber);
  const totals: (number | null)[] = [];
  let cumulative = 0;

  for (let i = 0; i < 10; i++) {
    const frame = sorted[i];
    if (!frame) {
      totals.push(null);
      continue;
    }

    if (i < 9) {
      // Frames 1-9
      if (isStrike(frame)) {
        // Need next two balls
        const next1 = sorted[i + 1];
        const next2 = sorted[i + 2];
        if (!next1) {
          totals.push(null);
          continue;
        }
        const firstBonus = next1.ball1Score;
        let secondBonus: number;
        if (isStrike(next1) && i < 8) {
          // Next frame is also a strike (not 10th) — need the frame after
          secondBonus = next2 ? next2.ball1Score : 0;
        } else if (isStrike(next1) && i === 8) {
          // Next frame is the 10th and starts with a strike
          secondBonus = next1.ball2Score ?? 0;
        } else {
          secondBonus = next1.ball2Score ?? 0;
        }
        cumulative += 10 + firstBonus + secondBonus;
      } else if (isSpare(frame)) {
        const next1 = sorted[i + 1];
        if (!next1) {
          totals.push(null);
          continue;
        }
        cumulative += 10 + next1.ball1Score;
      } else {
        cumulative += frame.ball1Score + (frame.ball2Score ?? 0);
      }
    } else {
      // Frame 10
      cumulative +=
        frame.ball1Score +
        (frame.ball2Score ?? 0) +
        (frame.ball3Score ?? 0);
    }

    totals.push(cumulative);
  }

  return totals;
}

// ============================================================================
// Ball display helpers
// ============================================================================

function ball1Display(f: ScoreFrame): string {
  if (f.frameNumber < 10) {
    return f.ball1Score === 10 ? "X" : f.ball1Score === 0 ? "–" : String(f.ball1Score);
  }
  // Frame 10
  return f.ball1Score === 10 ? "X" : f.ball1Score === 0 ? "–" : String(f.ball1Score);
}

function ball2Display(f: ScoreFrame): string {
  if (f.ball2Score === null) return "";
  if (f.frameNumber < 10) {
    if (f.ball1Score + f.ball2Score === 10) return "/";
    return f.ball2Score === 0 ? "–" : String(f.ball2Score);
  }
  // Frame 10
  if (f.ball1Score === 10) {
    // After a strike in the 10th, ball2 is an independent ball
    return f.ball2Score === 10 ? "X" : f.ball2Score === 0 ? "–" : String(f.ball2Score);
  }
  if (f.ball1Score + f.ball2Score === 10) return "/";
  return f.ball2Score === 0 ? "–" : String(f.ball2Score);
}

function ball3Display(f: ScoreFrame): string {
  if (f.ball3Score === null) return "";
  // Ball 3 only exists in 10th frame
  if (f.ball2Score !== null) {
    // If previous two balls were strikes, or ball2 made a spare
    const prevTotal =
      f.ball1Score === 10
        ? f.ball2Score ?? 0
        : f.ball1Score + (f.ball2Score ?? 0);
    if (f.ball1Score === 10 && f.ball2Score === 10) {
      return f.ball3Score === 10 ? "X" : f.ball3Score === 0 ? "–" : String(f.ball3Score);
    }
    if (f.ball1Score === 10) {
      // Strike then non-strike on ball2
      if ((f.ball2Score ?? 0) + f.ball3Score === 10) return "/";
      return f.ball3Score === 0 ? "–" : String(f.ball3Score);
    }
    // Spare on balls 1+2
    if (prevTotal === 10) {
      return f.ball3Score === 10 ? "X" : f.ball3Score === 0 ? "–" : String(f.ball3Score);
    }
  }
  return f.ball3Score === 0 ? "–" : String(f.ball3Score);
}

// ============================================================================
// Main component (for saved match data)
// ============================================================================

interface BowlingScoreboardProps {
  frames: MatchFrame[];
  bowlers: MatchBowler[];
}

export default function BowlingScoreboard({
  frames,
  bowlers,
}: BowlingScoreboardProps) {
  const bowlerRows = useMemo(() => {
    return bowlers.map((bowler) => {
      const bowlerFrames = frames
        .filter((f) => f.bowlerId === bowler.id)
        .sort((a, b) => a.frameNumber - b.frameNumber);

      const totals = calculateRunningTotals(bowlerFrames);

      return { bowler, frames: bowlerFrames, totals };
    });
  }, [frames, bowlers]);

  if (frames.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-border bg-surface px-2 py-1.5 text-left text-[10px] uppercase tracking-widest text-foreground/40 w-24">
              Bowler
            </th>
            {Array.from({ length: 10 }, (_, i) => (
              <th
                key={i}
                className={`border border-border bg-surface px-1 py-1.5 text-center text-[10px] uppercase tracking-widest text-foreground/40 ${
                  i === 9 ? "w-20" : "w-14"
                }`}
              >
                {i + 1}
              </th>
            ))}
            <th className="border border-border bg-surface px-2 py-1.5 text-center text-[10px] uppercase tracking-widest text-neon-cyan w-14">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {bowlerRows.map(({ bowler, frames: bf, totals }) => (
            <tr key={bowler.id}>
              <td className="border border-border bg-surface-light px-2 py-1 font-medium text-foreground/80 whitespace-nowrap">
                {bowler.name}
              </td>
              {Array.from({ length: 10 }, (_, i) => {
                const frame = bf.find((f) => f.frameNumber === i + 1);
                const total = totals[i];
                const isTenth = i === 9;

                return (
                  <td
                    key={i}
                    className="border border-border bg-surface-light p-0"
                  >
                    {frame ? (
                      <FrameCell
                        frame={frame}
                        total={total}
                        isTenth={isTenth}
                      />
                    ) : (
                      <div className="h-12" />
                    )}
                  </td>
                );
              })}
              <td className="border border-border bg-surface-light px-2 py-1 text-center font-bold text-neon-lime text-glow-lime text-sm">
                {totals[9] ?? "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Preview variant (read-only, for confirmation screen, uses BowlerFrameData)
// ============================================================================

interface BowlingScoreboardPreviewProps {
  bowlers: BowlerFrameData[];
}

export function BowlingScoreboardPreview({
  bowlers,
}: BowlingScoreboardPreviewProps) {
  const bowlerRows = useMemo(() => {
    return bowlers.map((b) => {
      const sorted = [...b.frames].sort(
        (a, c) => a.frameNumber - c.frameNumber,
      );
      const totals = calculateRunningTotals(sorted);
      return { name: b.bowlerName, frames: sorted, totals };
    });
  }, [bowlers]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-border bg-surface px-2 py-1.5 text-left text-[10px] uppercase tracking-widest text-foreground/40 w-24">
              Bowler
            </th>
            {Array.from({ length: 10 }, (_, i) => (
              <th
                key={i}
                className={`border border-border bg-surface px-1 py-1.5 text-center text-[10px] uppercase tracking-widest text-foreground/40 ${
                  i === 9 ? "w-20" : "w-14"
                }`}
              >
                {i + 1}
              </th>
            ))}
            <th className="border border-border bg-surface px-2 py-1.5 text-center text-[10px] uppercase tracking-widest text-neon-cyan w-14">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {bowlerRows.map(({ name, frames: bf, totals }, idx) => (
            <tr key={idx}>
              <td className="border border-border bg-surface-light px-2 py-1 font-medium text-foreground/80 whitespace-nowrap">
                {name}
              </td>
              {Array.from({ length: 10 }, (_, i) => {
                const frame = bf.find((f) => f.frameNumber === i + 1);
                const total = totals[i];
                const isTenth = i === 9;

                return (
                  <td
                    key={i}
                    className="border border-border bg-surface-light p-0"
                  >
                    {frame ? (
                      <FrameCell
                        frame={frame}
                        total={total}
                        isTenth={isTenth}
                      />
                    ) : (
                      <div className="h-12" />
                    )}
                  </td>
                );
              })}
              <td className="border border-border bg-surface-light px-2 py-1 text-center font-bold text-neon-lime text-glow-lime text-sm">
                {totals[9] ?? "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Editable variant (for score submission page — click a frame to edit)
// ============================================================================

interface BowlingScoreboardEditableProps {
  bowlers: BowlerFrameData[];
  onUpdate: (bowlers: BowlerFrameData[]) => void;
}

export function BowlingScoreboardEditable({
  bowlers,
  onUpdate,
}: BowlingScoreboardEditableProps) {
  const [editTarget, setEditTarget] = useState<{
    bowlerIdx: number;
    frameIdx: number;
  } | null>(null);

  const bowlerRows = useMemo(() => {
    return bowlers.map((b) => {
      const sorted = [...b.frames].sort(
        (a, c) => a.frameNumber - c.frameNumber,
      );
      const totals = calculateRunningTotals(sorted);
      return { name: b.bowlerName, frames: sorted, totals };
    });
  }, [bowlers]);

  const handleSaveFrame = (
    bowlerIdx: number,
    frameNumber: number,
    updated: { ball1Score: number; ball2Score: number | null; ball3Score: number | null },
  ) => {
    const next = bowlers.map((b, bi) => {
      if (bi !== bowlerIdx) return b;
      return {
        ...b,
        frames: b.frames.map((f) =>
          f.frameNumber === frameNumber ? { ...f, ...updated } : f,
        ),
      };
    });
    onUpdate(next);
    setEditTarget(null);
  };

  const editFrame =
    editTarget !== null
      ? bowlerRows[editTarget.bowlerIdx]?.frames[editTarget.frameIdx]
      : null;

  return (
    <>
      <div className="overflow-x-auto">
        <p className="text-[10px] text-foreground/30 mb-2">
          Tap any frame to edit scores
        </p>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-border bg-surface px-2 py-1.5 text-left text-[10px] uppercase tracking-widest text-foreground/40 w-24">
                Bowler
              </th>
              {Array.from({ length: 10 }, (_, i) => (
                <th
                  key={i}
                  className={`border border-border bg-surface px-1 py-1.5 text-center text-[10px] uppercase tracking-widest text-foreground/40 ${
                    i === 9 ? "w-20" : "w-14"
                  }`}
                >
                  {i + 1}
                </th>
              ))}
              <th className="border border-border bg-surface px-2 py-1.5 text-center text-[10px] uppercase tracking-widest text-neon-cyan w-14">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {bowlerRows.map(({ name, frames: bf, totals }, bowlerIdx) => (
              <tr key={bowlerIdx}>
                <td className="border border-border bg-surface-light px-2 py-1 font-medium text-foreground/80 whitespace-nowrap">
                  {name}
                </td>
                {Array.from({ length: 10 }, (_, i) => {
                  const frame = bf.find((f) => f.frameNumber === i + 1);
                  const total = totals[i];
                  const isTenth = i === 9;
                  const isEditing =
                    editTarget?.bowlerIdx === bowlerIdx &&
                    editTarget?.frameIdx === i;

                  return (
                    <td
                      key={i}
                      className={`border p-0 cursor-pointer transition-colors ${
                        isEditing
                          ? "border-neon-cyan bg-neon-cyan/10"
                          : "border-border bg-surface-light hover:bg-surface-light/60 hover:border-neon-cyan/30"
                      }`}
                      onClick={() =>
                        frame && setEditTarget({ bowlerIdx, frameIdx: i })
                      }
                    >
                      {frame ? (
                        <FrameCell
                          frame={frame}
                          total={total}
                          isTenth={isTenth}
                        />
                      ) : (
                        <div className="h-12" />
                      )}
                    </td>
                  );
                })}
                <td className="border border-border bg-surface-light px-2 py-1 text-center font-bold text-neon-lime text-glow-lime text-sm">
                  {totals[9] ?? "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editTarget !== null && editFrame && (
        <FrameEditModal
          bowlerName={bowlerRows[editTarget.bowlerIdx].name}
          frame={editFrame}
          isTenth={editFrame.frameNumber === 10}
          onSave={(updated) =>
            handleSaveFrame(editTarget.bowlerIdx, editFrame.frameNumber, updated)
          }
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}

// ============================================================================
// Frame edit modal
// ============================================================================

function FrameEditModal({
  bowlerName,
  frame,
  isTenth,
  onSave,
  onClose,
}: {
  bowlerName: string;
  frame: ScoreFrame;
  isTenth: boolean;
  onSave: (updated: {
    ball1Score: number;
    ball2Score: number | null;
    ball3Score: number | null;
  }) => void;
  onClose: () => void;
}) {
  const [b1, setB1] = useState(String(frame.ball1Score));
  const [b2, setB2] = useState(
    frame.ball2Score !== null ? String(frame.ball2Score) : "",
  );
  const [b3, setB3] = useState(
    frame.ball3Score !== null ? String(frame.ball3Score) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const ball1 = parseInt(b1, 10);
    const ball2 = b2 !== "" ? parseInt(b2, 10) : null;
    const ball3 = b3 !== "" ? parseInt(b3, 10) : null;

    // Validate
    if (isNaN(ball1) || ball1 < 0 || ball1 > 10) {
      setError("Ball 1 must be 0–10");
      return;
    }

    if (!isTenth) {
      // Frames 1-9
      if (ball1 === 10) {
        // Strike — ball2 should be null
        onSave({ ball1Score: 10, ball2Score: null, ball3Score: null });
        return;
      }
      if (ball2 === null || isNaN(ball2) || ball2 < 0 || ball2 > 10) {
        setError("Ball 2 must be 0–10");
        return;
      }
      if (ball1 + ball2 > 10) {
        setError(`Ball 1 + Ball 2 cannot exceed 10 (got ${ball1 + ball2})`);
        return;
      }
      onSave({ ball1Score: ball1, ball2Score: ball2, ball3Score: null });
    } else {
      // Frame 10
      if (ball2 === null || isNaN(ball2) || ball2 < 0 || ball2 > 10) {
        setError("Ball 2 must be 0–10");
        return;
      }

      const isStrikeB1 = ball1 === 10;
      const isSpareB1B2 = !isStrikeB1 && ball1 + ball2 === 10;

      if (!isStrikeB1 && ball1 + ball2 > 10) {
        setError(`Ball 1 + Ball 2 cannot exceed 10 (got ${ball1 + ball2})`);
        return;
      }

      if (isStrikeB1 || isSpareB1B2) {
        // Needs ball 3
        if (ball3 === null || isNaN(ball3) || ball3 < 0 || ball3 > 10) {
          setError("Ball 3 is required (0–10) after a strike or spare");
          return;
        }
        // If strike then non-strike on ball2, ball2+ball3 <= 10 unless ball2 is also a strike
        if (isStrikeB1 && ball2 !== 10 && ball2 + ball3 > 10) {
          setError(
            `Ball 2 + Ball 3 cannot exceed 10 (got ${ball2 + ball3})`,
          );
          return;
        }
        onSave({ ball1Score: ball1, ball2Score: ball2, ball3Score: ball3 });
      } else {
        // Open frame — no ball 3
        onSave({ ball1Score: ball1, ball2Score: ball2, ball3Score: null });
      }
    }
  };

  // Determine if ball2 / ball3 fields should show
  const showBall2 = isTenth || b1 !== "10";
  const showBall3 = isTenth;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xs rounded-xl border border-border bg-surface p-5 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground/80">
            Edit Frame {frame.frameNumber}
          </h4>
          <p className="text-xs text-foreground/40">{bowlerName}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-foreground/40 block mb-1">
              Ball 1
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={10}
              value={b1}
              onChange={(e) => {
                setB1(e.target.value);
                setError(null);
              }}
              className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
            />
          </div>

          {showBall2 && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-foreground/40 block mb-1">
                Ball 2
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={10}
                value={b2}
                onChange={(e) => {
                  setB2(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
          )}

          {showBall3 && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-foreground/40 block mb-1">
                Ball 3{" "}
                <span className="text-foreground/20">
                  (only if strike or spare)
                </span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={10}
                value={b3}
                onChange={(e) => {
                  setB3(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg border border-neon-cyan/60 bg-neon-cyan/10 py-2 text-sm font-medium text-neon-cyan transition-all hover:bg-neon-cyan/20"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-surface py-2 text-sm font-medium text-foreground/50 transition-all hover:border-foreground/30"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Shared frame cell
// ============================================================================

function FrameCell({
  frame,
  total,
  isTenth,
}: {
  frame: ScoreFrame;
  total: number | null;
  isTenth: boolean;
}) {
  const b1 = ball1Display(frame);
  const b2 = ball2Display(frame);
  const b3 = isTenth ? ball3Display(frame) : "";

  const isStrikeFrame = isStrike(frame) && !isTenth;

  return (
    <div className="flex flex-col">
      {/* Ball boxes row */}
      <div className={`flex justify-end border-b border-border/50 ${isTenth ? "gap-0" : ""}`}>
        {isStrikeFrame ? (
          /* Strike on frames 1-9: show X spanning full width in the right box area */
          <>
            <div className="w-1/2 border-r border-border/50 h-5" />
            <div className="w-1/2 flex items-center justify-center h-5 text-neon-magenta font-bold">
              X
            </div>
          </>
        ) : isTenth ? (
          /* 10th frame: 3 ball boxes */
          <>
            <div className="flex-1 flex items-center justify-center h-5 border-r border-border/50">
              <span className={`${b1 === "X" ? "text-neon-magenta font-bold" : frame.isBall1Split ? "text-neon-amber" : "text-foreground/70"}`}>
                {b1}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center h-5 border-r border-border/50">
              <span className={`${b2 === "X" ? "text-neon-magenta font-bold" : b2 === "/" ? "text-neon-cyan font-bold" : "text-foreground/70"}`}>
                {b2}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center h-5">
              <span className={`${b3 === "X" ? "text-neon-magenta font-bold" : b3 === "/" ? "text-neon-cyan font-bold" : "text-foreground/70"}`}>
                {b3}
              </span>
            </div>
          </>
        ) : (
          /* Regular frame: 2 ball boxes */
          <>
            <div className="w-1/2 flex items-center justify-center h-5 border-r border-border/50">
              <span className={`${frame.isBall1Split ? "text-neon-amber" : "text-foreground/70"}`}>
                {b1}
              </span>
            </div>
            <div className="w-1/2 flex items-center justify-center h-5">
              <span className={`${b2 === "/" ? "text-neon-cyan font-bold" : "text-foreground/70"}`}>
                {b2}
              </span>
            </div>
          </>
        )}
      </div>
      {/* Running total */}
      <div className="flex items-center justify-center h-7 text-foreground/60 font-medium">
        {total ?? ""}
      </div>
    </div>
  );
}
