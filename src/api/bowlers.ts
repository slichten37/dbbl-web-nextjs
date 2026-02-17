import api from ".";

export interface Bowler {
  id: string;
  name: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  teams: { id: string; name: string }[];
}

export async function getBowlers(): Promise<Bowler[]> {
  const res = await api.get<Bowler[]>("/bowlers");
  return res.data;
}

export async function getBowler(id: string): Promise<Bowler> {
  const res = await api.get<Bowler>(`/bowlers/${id}`);
  return res.data;
}

export async function createBowler(data: { name: string }): Promise<Bowler> {
  const res = await api.post<Bowler>("/bowlers", data);
  return res.data;
}

export async function updateBowler(
  id: string,
  data: { name?: string },
): Promise<Bowler> {
  const res = await api.patch<Bowler>(`/bowlers/${id}`, data);
  return res.data;
}
