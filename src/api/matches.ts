import api from ".";

// ============================================================================
// Frame & Bowler types
// ============================================================================

export interface FrameData {
  frameNumber: number;
  ball1Score: number;
  ball2Score: number | null;
  ball3Score: number | null;
  isBall1Split: boolean;
}

export interface BowlerFrameData {
  bowlerName: string;
  matchedBowlerId: string;
  frames: FrameData[];
}

export interface ScorecardAnalysisResult {
  success: boolean;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "UNREADABLE";
  bowlers: BowlerFrameData[];
  reasoning: string;
  processingTimeMs: number;
  errorMessage?: string;
}

// ============================================================================
// Match types
// ============================================================================

export interface MatchBowler {
  id: string;
  name: string;
}

export interface MatchTeam {
  id: string;
  name: string;
  bowlers: MatchBowler[];
}

export interface MatchFrame {
  id: string;
  frameNumber: number;
  ball1Score: number;
  ball2Score: number | null;
  ball3Score: number | null;
  isBall1Split: boolean;
  bowlerId: string;
  matchId: string;
  bowler: MatchBowler;
}

export interface Match {
  id: string;
  week: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  team1Id: string;
  team2Id: string;
  seasonId: string;
  winningTeamId: string | null;
  team1Score: number | null;
  team2Score: number | null;
  team1Strikes: number | null;
  team2Strikes: number | null;
  team1: MatchTeam;
  team2: MatchTeam;
  season: { id: string; name: string };
  frames: MatchFrame[];
}

// ============================================================================
// API functions
// ============================================================================

export async function getMatches(): Promise<Match[]> {
  const res = await api.get<Match[]>("/matches");
  return res.data;
}

export async function getMatch(id: string): Promise<Match> {
  const res = await api.get<Match>(`/matches/${id}`);
  return res.data;
}

export async function createMatch(data: {
  team1Id: string;
  team2Id: string;
  seasonId: string;
  week: number;
}): Promise<Match> {
  const res = await api.post<Match>("/matches", data);
  return res.data;
}

export async function updateMatch(
  id: string,
  data: {
    team1Id?: string;
    team2Id?: string;
    seasonId?: string;
    week?: number;
  },
): Promise<Match> {
  const res = await api.patch<Match>(`/matches/${id}`, data);
  return res.data;
}

export async function analyzeScorecard(
  matchId: string,
  file: File,
): Promise<ScorecardAnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<ScorecardAnalysisResult>(
    `/matches/${matchId}/analyze-scorecard`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function submitScores(
  matchId: string,
  bowlers: BowlerFrameData[],
): Promise<Match> {
  const payload = {
    bowlers: bowlers.map((b) => ({
      bowlerId: b.matchedBowlerId,
      frames: b.frames,
    })),
  };
  const res = await api.post<Match>(
    `/matches/${matchId}/submit-scores`,
    payload,
  );
  return res.data;
}
