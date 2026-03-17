"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import type { MatchFrame, MatchBowler } from "@/api/matches";
import type {
  FrameData,
  BowlerFrameData,
  FrameCorrection,
} from "@/api/matches";

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
        frame.ball1Score + (frame.ball2Score ?? 0) + (frame.ball3Score ?? 0);
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
    return f.ball1Score === 10
      ? "X"
      : f.ball1Score === 0
        ? "–"
        : String(f.ball1Score);
  }
  // Frame 10
  return f.ball1Score === 10
    ? "X"
    : f.ball1Score === 0
      ? "–"
      : String(f.ball1Score);
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
    return f.ball2Score === 10
      ? "X"
      : f.ball2Score === 0
        ? "–"
        : String(f.ball2Score);
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
        ? (f.ball2Score ?? 0)
        : f.ball1Score + (f.ball2Score ?? 0);
    if (f.ball1Score === 10 && f.ball2Score === 10) {
      return f.ball3Score === 10
        ? "X"
        : f.ball3Score === 0
          ? "–"
          : String(f.ball3Score);
    }
    if (f.ball1Score === 10) {
      // Strike then non-strike on ball2
      if ((f.ball2Score ?? 0) + f.ball3Score === 10) return "/";
      return f.ball3Score === 0 ? "–" : String(f.ball3Score);
    }
    // Spare on balls 1+2
    if (prevTotal === 10) {
      return f.ball3Score === 10
        ? "X"
        : f.ball3Score === 0
          ? "–"
          : String(f.ball3Score);
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
// Editable variant (inline inputs — type and Tab through balls)
// ============================================================================

interface BowlingScoreboardEditableProps {
  bowlers: BowlerFrameData[];
  onUpdate: (bowlers: BowlerFrameData[]) => void;
  corrections?: FrameCorrection[];
}

export function BowlingScoreboardEditable({
  bowlers,
  onUpdate,
  corrections,
}: BowlingScoreboardEditableProps) {
  // Ref map: inputRefs[bowlerIdx][globalBallIndex] = HTMLInputElement
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const setInputRef = useCallback(
    (bowlerIdx: number, ballKey: string, el: HTMLInputElement | null) => {
      const key = `${bowlerIdx}-${ballKey}`;
      if (el) inputRefs.current.set(key, el);
      else inputRefs.current.delete(key);
    },
    [],
  );

  // Build an ordered list of focusable ball keys per bowler
  const getBallKeys = useCallback(
    (bowlerIdx: number): string[] => {
      const b = bowlers[bowlerIdx];
      if (!b) return [];
      const keys: string[] = [];
      const sorted = [...b.frames].sort(
        (a, c) => a.frameNumber - c.frameNumber,
      );
      for (const f of sorted) {
        keys.push(`f${f.frameNumber}-b1`);
        if (f.frameNumber < 10) {
          // Frames 1-9: skip ball2 if strike
          if (f.ball1Score !== 10) {
            keys.push(`f${f.frameNumber}-b2`);
          }
        } else {
          // Frame 10: always has ball2, ball3 if strike or spare
          keys.push(`f${f.frameNumber}-b2`);
          if (
            f.ball1Score === 10 ||
            f.ball1Score + (f.ball2Score ?? 0) === 10
          ) {
            keys.push(`f${f.frameNumber}-b3`);
          }
        }
      }
      return keys;
    },
    [bowlers],
  );

  const focusNext = useCallback(
    (bowlerIdx: number, currentKey: string) => {
      const keys = getBallKeys(bowlerIdx);
      const idx = keys.indexOf(currentKey);
      if (idx >= 0 && idx < keys.length - 1) {
        const nextKey = `${bowlerIdx}-${keys[idx + 1]}`;
        // Small delay to let React re-render (ball2/ball3 visibility may change)
        setTimeout(() => inputRefs.current.get(nextKey)?.focus(), 0);
      }
    },
    [getBallKeys],
  );

  const bowlerRows = useMemo(() => {
    return bowlers.map((b) => {
      const sorted = [...b.frames].sort(
        (a, c) => a.frameNumber - c.frameNumber,
      );
      const totals = calculateRunningTotals(sorted);
      return { name: b.bowlerName, frames: sorted, totals };
    });
  }, [bowlers]);

  const handleBallChange = (
    bowlerIdx: number,
    frameNumber: number,
    ball: "ball1Score" | "ball2Score" | "ball3Score",
    raw: string,
  ) => {
    const val = raw === "" ? 0 : parseInt(raw, 10);
    if (isNaN(val) || val < 0 || val > 10) return;

    const next = bowlers.map((b, bi) => {
      if (bi !== bowlerIdx) return b;
      return {
        ...b,
        frames: b.frames.map((f) => {
          if (f.frameNumber !== frameNumber) return f;
          const updated = { ...f, [ball]: val };

          if (frameNumber < 10) {
            // Strike in frames 1-9: clear ball2
            if (ball === "ball1Score" && val === 10) {
              updated.ball2Score = null;
            }
            // If ball1 changed from strike to non-strike, ensure ball2 exists
            if (ball === "ball1Score" && val < 10 && updated.ball2Score === null) {
              updated.ball2Score = 0;
            }
            // Clamp ball2 so ball1+ball2 <= 10
            if (
              updated.ball2Score !== null &&
              updated.ball1Score + updated.ball2Score > 10
            ) {
              updated.ball2Score = 10 - updated.ball1Score;
            }
            updated.ball3Score = null;
          } else {
            // Frame 10 logic
            const b1 = updated.ball1Score;
            const b2 = updated.ball2Score ?? 0;
            const needsBall3 = b1 === 10 || b1 + b2 === 10;

            // Clamp: if not strike on b1, b1+b2 <= 10
            if (b1 !== 10 && b1 + b2 > 10) {
              updated.ball2Score = 10 - b1;
            }
            // Clamp: if strike on b1, non-strike b2, then b2+b3 <= 10
            if (
              b1 === 10 &&
              (updated.ball2Score ?? 0) !== 10 &&
              updated.ball3Score !== null &&
              (updated.ball2Score ?? 0) + (updated.ball3Score ?? 0) > 10
            ) {
              updated.ball3Score =
                10 - (updated.ball2Score ?? 0);
            }

            if (needsBall3 && updated.ball3Score === null) {
              updated.ball3Score = 0;
            }
            if (!needsBall3) {
              updated.ball3Score = null;
            }
          }

          return updated;
        }),
      };
    });
    onUpdate(next);
  };

  return (
    <div className="overflow-x-auto">
      <p className="text-[10px] text-foreground/30 mb-2">
        Type pin counts and press Tab to advance
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
                const isCorrected = corrections?.some(
                  (c) =>
                    c.bowlerIndex === bowlerIdx && c.frameNumber === i + 1,
                );

                if (!frame) return <td key={i} className="border border-border bg-surface-light p-0"><div className="h-12" /></td>;

                const isStrikeF = isStrike(frame) && !isTenth;

                return (
                  <td
                    key={i}
                    className={`border p-0 transition-colors ${
                      isCorrected
                        ? "border-neon-amber bg-neon-amber/10"
                        : "border-border bg-surface-light"
                    }`}
                    title={
                      isCorrected
                        ? corrections
                            ?.filter(
                              (c) =>
                                c.bowlerIndex === bowlerIdx &&
                                c.frameNumber === i + 1,
                            )
                            .map((c) => c.reason)
                            .join("; ")
                        : undefined
                    }
                  >
                    <div className="flex flex-col relative">
                      {isCorrected && (
                        <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-neon-amber z-10" title="Auto-corrected" />
                      )}
                      {/* Ball inputs row */}
                      <div className={`flex justify-end border-b border-border/50 ${isTenth ? "gap-0" : ""}`}>
                        {isStrikeF ? (
                          /* Strike frames 1-9: show ball1 input spanning left, X display right */
                          <>
                            <div className="w-1/2 border-r border-border/50 h-6 flex items-center justify-center">
                              <BallInput
                                value={frame.ball1Score}
                                onChange={(v) => handleBallChange(bowlerIdx, frame.frameNumber, "ball1Score", v)}
                                onAdvance={() => focusNext(bowlerIdx, `f${frame.frameNumber}-b1`)}
                                inputRef={(el) => setInputRef(bowlerIdx, `f${frame.frameNumber}-b1`, el)}
                              />
                            </div>
                            <div className="w-1/2 flex items-center justify-center h-6 text-neon-magenta font-bold text-[10px]">
                              X
                            </div>
                          </>
                        ) : isTenth ? (
                          /* 10th frame: up to 3 inputs */
                          <>
                            <div className="flex-1 flex items-center justify-center h-6 border-r border-border/50">
                              <BallInput
                                value={frame.ball1Score}
                                onChange={(v) => handleBallChange(bowlerIdx, frame.frameNumber, "ball1Score", v)}
                                onAdvance={() => focusNext(bowlerIdx, `f${frame.frameNumber}-b1`)}
                                inputRef={(el) => setInputRef(bowlerIdx, `f${frame.frameNumber}-b1`, el)}
                              />
                            </div>
                            <div className="flex-1 flex items-center justify-center h-6 border-r border-border/50">
                              <BallInput
                                value={frame.ball2Score ?? 0}
                                onChange={(v) => handleBallChange(bowlerIdx, frame.frameNumber, "ball2Score", v)}
                                onAdvance={() => focusNext(bowlerIdx, `f${frame.frameNumber}-b2`)}
                                inputRef={(el) => setInputRef(bowlerIdx, `f${frame.frameNumber}-b2`, el)}
                              />
                            </div>
                            <div className="flex-1 flex items-center justify-center h-6">
                              {frame.ball3Score !== null ? (
                                <BallInput
                                  value={frame.ball3Score}
                                  onChange={(v) => handleBallChange(bowlerIdx, frame.frameNumber, "ball3Score", v)}
                                  onAdvance={() => focusNext(bowlerIdx, `f${frame.frameNumber}-b3`)}
                                  inputRef={(el) => setInputRef(bowlerIdx, `f${frame.frameNumber}-b3`, el)}
                                />
                              ) : (
                                <span className="text-foreground/20 text-[10px]">–</span>
                              )}
                            </div>
                          </>
                        ) : (
                          /* Regular frame: 2 inputs */
                          <>
                            <div className="w-1/2 flex items-center justify-center h-6 border-r border-border/50">
                              <BallInput
                                value={frame.ball1Score}
                                onChange={(v) => handleBallChange(bowlerIdx, frame.frameNumber, "ball1Score", v)}
                                onAdvance={() => focusNext(bowlerIdx, `f${frame.frameNumber}-b1`)}
                                inputRef={(el) => setInputRef(bowlerIdx, `f${frame.frameNumber}-b1`, el)}
                              />
                            </div>
                            <div className="w-1/2 flex items-center justify-center h-6">
                              <BallInput
                                value={frame.ball2Score ?? 0}
                                onChange={(v) => handleBallChange(bowlerIdx, frame.frameNumber, "ball2Score", v)}
                                onAdvance={() => focusNext(bowlerIdx, `f${frame.frameNumber}-b2`)}
                                inputRef={(el) => setInputRef(bowlerIdx, `f${frame.frameNumber}-b2`, el)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                      {/* Running total */}
                      <div className="flex items-center justify-center h-7 text-foreground/60 font-medium">
                        {total ?? ""}
                      </div>
                    </div>
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
// Inline ball input — tiny number input for a single ball
// ============================================================================

function BallInput({
  value,
  onChange,
  onAdvance,
  inputRef,
}: {
  value: number;
  onChange: (raw: string) => void;
  onAdvance: () => void;
  inputRef: (el: HTMLInputElement | null) => void;
}) {
  return (
    <input
      ref={inputRef}
      type="number"
      inputMode="numeric"
      min={0}
      max={10}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        // Auto-advance on single digit entry (0-9)
        const v = parseInt(e.target.value, 10);
        if (!isNaN(v) && v >= 0 && v <= 9) {
          onAdvance();
        }
      }}
      onKeyDown={(e) => {
        // Advance on Tab (default behavior) or Enter
        if (e.key === "Enter") {
          e.preventDefault();
          onAdvance();
        }
      }}
      onFocus={(e) => e.target.select()}
      className="w-full h-full bg-transparent text-center text-[11px] text-foreground/80 focus:outline-none focus:bg-neon-cyan/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}

// ============================================================================
// Shared frame cell
// ============================================================================

function FrameCell({
  frame,
  total,
  isTenth,
  isCorrected,
}: {
  frame: ScoreFrame;
  total: number | null;
  isTenth: boolean;
  isCorrected?: boolean;
}) {
  const b1 = ball1Display(frame);
  const b2 = ball2Display(frame);
  const b3 = isTenth ? ball3Display(frame) : "";

  const isStrikeFrame = isStrike(frame) && !isTenth;

  return (
    <div className="flex flex-col relative">
      {/* Correction indicator dot */}
      {isCorrected && (
        <div
          className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-neon-amber z-10"
          title="Auto-corrected — please verify"
        />
      )}
      {/* Ball boxes row */}
      <div
        className={`flex justify-end border-b border-border/50 ${isTenth ? "gap-0" : ""}`}
      >
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
              <span
                className={`${b1 === "X" ? "text-neon-magenta font-bold" : frame.isBall1Split ? "text-neon-amber" : "text-foreground/70"}`}
              >
                {b1}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center h-5 border-r border-border/50">
              <span
                className={`${b2 === "X" ? "text-neon-magenta font-bold" : b2 === "/" ? "text-neon-cyan font-bold" : "text-foreground/70"}`}
              >
                {b2}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center h-5">
              <span
                className={`${b3 === "X" ? "text-neon-magenta font-bold" : b3 === "/" ? "text-neon-cyan font-bold" : "text-foreground/70"}`}
              >
                {b3}
              </span>
            </div>
          </>
        ) : (
          /* Regular frame: 2 ball boxes */
          <>
            <div className="w-1/2 flex items-center justify-center h-5 border-r border-border/50">
              <span
                className={`${frame.isBall1Split ? "text-neon-amber" : "text-foreground/70"}`}
              >
                {b1}
              </span>
            </div>
            <div className="w-1/2 flex items-center justify-center h-5">
              <span
                className={`${b2 === "/" ? "text-neon-cyan font-bold" : "text-foreground/70"}`}
              >
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
