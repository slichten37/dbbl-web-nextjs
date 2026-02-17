import api from ".";

export interface Match {
  id: string;
  week: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  team1Id: string;
  team2Id: string;
  seasonId: string;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
  season: { id: string; name: string };
  frames: { id: string; frameNumber: number; bowlerId: string }[];
}

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
