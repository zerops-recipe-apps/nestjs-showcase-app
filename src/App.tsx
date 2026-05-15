import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? '';

type HealthShape = { status?: string } & Record<string, unknown>;

export default function App() {
  const [health, setHealth] = useState<HealthShape | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_URL) {
      setError('VITE_API_URL is not configured');
      return;
    }
    fetch(`${API_URL}/health`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message ?? String(err)));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>NestJS Showcase</h1>
      <p>Frontend SPA scaffold — talks to the API service.</p>

      <section>
        <h2>API connectivity</h2>
        <p>
          API URL: <code>{API_URL || '(unset)'}</code>
        </p>
        {error ? (
          <p style={{ color: 'crimson' }}>Error: {error}</p>
        ) : health ? (
          <pre style={{ background: '#f4f4f4', padding: '0.75rem', borderRadius: 4 }}>
            {JSON.stringify(health, null, 2)}
          </pre>
        ) : (
          <p>Loading...</p>
        )}
      </section>
    </main>
  );
}
