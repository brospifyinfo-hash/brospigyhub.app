'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#09090b', color: '#fafafa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 400, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Etwas ist schiefgelaufen</h1>
          <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 24 }}>
            Bitte lade die Seite komplett neu (Strg+Shift+R) oder versuche es später erneut.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              background: '#95BF47',
              color: '#09090b',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Erneut versuchen
          </button>
          <p style={{ fontSize: 12, color: '#71717a', marginTop: 24 }}>
            <a href="/" style={{ color: '#95BF47', textDecoration: 'none' }}>Zur Startseite</a>
          </p>
        </div>
      </body>
    </html>
  );
}
