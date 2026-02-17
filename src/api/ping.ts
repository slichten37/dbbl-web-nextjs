import api from '.';

export async function ping(): Promise<string> {
  const response = await api.get<string>('/');
  return response.data;
}
