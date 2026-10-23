'use client';

// Root-level fallback: replaces the entire document because the root layout
// itself failed. Locale is unknowable here, so the message is tri-lingual.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const retry = 'Try again · Попробовать снова · Қайталап көру';
  return (
    <html lang="ru">
      <body style={{ fontFamily: 'Arial, sans-serif', margin: 0 }}>
        <main
          style={{
            width: 'min(100% - 40px, 640px)',
            margin: '10vh auto',
            textAlign: 'center',
          }}
        >
          <p>Something went wrong. Произошла ошибка. Қате орын алды.</p>
          <button onClick={reset}>{retry}</button>
          <p style={{ fontSize: 12, marginTop: 24 }}>
            JETU Admissions{error.digest ? ` · ${error.digest}` : ''}
          </p>
        </main>
      </body>
    </html>
  );
}
