import api from ".";

export interface SeasonTeam {
  id: string;
  name: string;
  bowlers: { id: string; name: string }[];
}

export interface SeasonMatch {
  id: string;
  week: number;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  winningTeamId: string | null;
  homeTeamPoints: number | null;
  awayTeamPoints: number | null;
}

export interface Season {
  id: string;
  name: string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  teams: SeasonTeam[];
  matches: SeasonMatch[];
}

export async function getSeasons(): Promise<Season[]> {
  const res = await api.get<Season[]>("/seasons");
  return res.data;
}

export async function getActiveSeason(): Promise<Season> {
  const res = await api.get<Season>("/seasons/active");
  return res.data;
}

export async function getSeason(id: string): Promise<Season> {
  const res = await api.get<Season>(`/seasons/${id}`);
  return res.data;
}

export async function createSeason(data: {
  name: string;
  isActive?: boolean;
  teamIds?: string[];
}): Promise<Season> {
  const res = await api.post<Season>("/seasons", data);
  return res.data;
}

export async function updateSeason(
  id: string,
  data: { name?: string; isActive?: boolean; teamIds?: string[] },
): Promise<Season> {
  const res = await api.patch<Season>(`/seasons/${id}`, data);
  return res.data;
}

export async function generateSchedule(id: string): Promise<Season> {
  const res = await api.post<Season>(`/seasons/${id}/generate-schedule`);
  return res.data;
}

// ============================================================================
// Stats types
// ============================================================================

export interface BowlerStats {
  id: string;
  name: string;
  pins: number;
  strikes: number;
  spares: number;
  gutters: number;
}

export interface TeamStats {
  id: string;
  name: string;
  matchWins: number;
  gameWins: number;
  pins: number;
  pinsAgainst: number;
  strikes: number;
  spares: number;
  gutters: number;
}

export interface SeasonStats {
  bowlers: BowlerStats[];
  teams: TeamStats[];
}

export async function getSeasonStats(id: string): Promise<SeasonStats> {
  const res = await api.get<SeasonStats>(`/seasons/${id}/stats`);
  return res.data;
}

export async function autoFillWeek(
  seasonId: string,
  week: number,
): Promise<Season> {
  const res = await api.post<Season>(`/seasons/${seasonId}/auto-fill-week`, {
    week,
  });
  return res.data;
}
