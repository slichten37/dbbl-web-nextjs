import api from ".";

export interface Team {
  id: string;
  name: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  bowlers: { id: string; name: string }[];
  seasons: { id: string; name: string }[];
}

export async function getTeams(): Promise<Team[]> {
  const res = await api.get<Team[]>("/teams");
  return res.data;
}

export async function getTeam(id: string): Promise<Team> {
  const res = await api.get<Team>(`/teams/${id}`);
  return res.data;
}

export async function createTeam(data: {
  name: string;
  bowlerIds?: string[];
}): Promise<Team> {
  const res = await api.post<Team>("/teams", data);
  return res.data;
}

export async function updateTeam(
  id: string,
  data: { name?: string; bowlerIds?: string[] },
): Promise<Team> {
  const res = await api.patch<Team>(`/teams/${id}`, data);
  return res.data;
}
