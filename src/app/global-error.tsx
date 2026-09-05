'use client';

/**
 * Letzte Instanz: greift nur, wenn schon das Root-Layout fehlschlägt.
 * Muss deshalb eigenes <html>/<body> mitbringen und darf nichts importieren,
 * was selbst fehlschlagen könnte.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="de">
            <body
                style={{
                    margin: 0,
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f2d98b',
                    fontFamily: 'system-ui, sans-serif',
                    color: '#331f16',
                    padding: '24px',
                }}
            >
                <div style={{ textAlign: 'center', maxWidth: '32rem' }}>
                    <div style={{ fontSize: '64px' }}>🍪</div>
                    <h1 style={{ fontSize: '28px', marginBottom: '12px' }}>
                        Der Shop ist gerade nicht erreichbar
                    </h1>
                    <p style={{ lineHeight: 1.6, marginBottom: '28px' }}>
                        Bitte versuch es in ein paar Minuten noch einmal. Wenn das Problem bleibt,
                        schreib mir an kontakt@thecookielady.de.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            background: '#331f16',
                            color: '#fff',
                            border: 'none',
                            padding: '14px 28px',
                            borderRadius: '999px',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                    >
                        Nochmal versuchen
                    </button>
                </div>
            </body>
        </html>
    );
}
