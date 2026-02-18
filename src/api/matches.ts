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
  gameId: string;
  bowler: MatchBowler;
}

export interface MatchGame {
  id: string;
  gameNumber: number;
  matchId: string;
  homeTeamScore: number | null;
  awayTeamScore: number | null;
  homeTeamStrikes: number | null;
  awayTeamStrikes: number | null;
  homeTeamPoints: number | null;
  awayTeamPoints: number | null;
  frames: MatchFrame[];
}

export interface MatchSubstitution {
  id: string;
  matchId: string;
  originalBowlerId: string;
  substituteBowlerId: string;
  teamId: string;
  originalBowler: MatchBowler;
  substituteBowler: MatchBowler;
  team: { id: string; name: string };
}

export interface Match {
  id: string;
  week: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  homeTeamId: string;
  awayTeamId: string;
  seasonId: string;
  winningTeamId: string | null;
  homeTeamPoints: number | null;
  awayTeamPoints: number | null;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  season: { id: string; name: string };
  games: MatchGame[];
  substitutions: MatchSubstitution[];
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
  homeTeamId: string;
  awayTeamId: string;
  seasonId: string;
  week: number;
}): Promise<Match> {
  const res = await api.post<Match>("/matches", data);
  return res.data;
}

export async function updateMatch(
  id: string,
  data: {
    homeTeamId?: string;
    awayTeamId?: string;
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
  gameNumber: number,
  bowlers: BowlerFrameData[],
): Promise<Match> {
  const payload = {
    gameNumber,
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

export async function createSubstitution(
  matchId: string,
  data: {
    originalBowlerId: string;
    substituteBowlerId: string;
    teamId: string;
  },
): Promise<Match> {
  const res = await api.post<Match>(`/matches/${matchId}/substitutions`, data);
  return res.data;
}

export async function deleteSubstitution(
  matchId: string,
  substitutionId: string,
): Promise<Match> {
  const res = await api.delete<Match>(
    `/matches/${matchId}/substitutions/${substitutionId}`,
  );
  return res.data;
}
