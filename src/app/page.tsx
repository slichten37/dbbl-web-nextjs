"use client";

import { useState } from "react";
import { ping } from "@/api/ping";

export default function Home() {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePing = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ping();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">dbbl</h1>
      <button
        onClick={handlePing}
        disabled={loading}
        className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {loading ? "Pinging..." : "Ping API"}
      </button>
      {response && (
        <p className="text-green-400 text-sm">API responded: {response}</p>
      )}
      {error && <p className="text-red-400 text-sm">Error: {error}</p>}
    </div>
  );
}
