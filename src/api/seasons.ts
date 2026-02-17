import api from ".";

export interface SeasonTeam {
  id: string;
  name: string;
  bowlers: { id: string; name: string }[];
}

export interface SeasonMatch {
  id: string;
  week: number;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
  winningTeamId: string | null;
  team1Score: number | null;
  team2Score: number | null;
  team1Strikes: number | null;
  team2Strikes: number | null;
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
