export default function LabIndex() {
  const routes: string[] = [];
  return (
    <main className="p-8">
      <h1 className="text-ink font-sans mb-4">Lab</h1>
      {routes.length === 0 ? (
        <p className="text-ink-muted font-sans">No experiments yet.</p>
      ) : (
        <ul>
          {routes.map((r) => (
            <li key={r}>
              <a href={r} className="text-accent font-sans">{r}</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
