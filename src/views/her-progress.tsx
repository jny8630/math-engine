import type { AppState } from '../types';

export type HerProgressViewProps = {
  appState: AppState;
  onBackHome: () => void;
};

export function HerProgressView({ appState, onBackHome }: HerProgressViewProps) {
  const sprints = appState.sprints;
  const totalProblems = sprints.reduce((sum, s) => sum + s.attempts.length, 0);
  const totalCorrect = sprints.reduce(
    (sum, s) => sum + s.attempts.filter((a) => a.result === 'correct').length,
    0,
  );
  const accuracy =
    totalProblems > 0 ? Math.round((totalCorrect / totalProblems) * 100) : 0;

  return (
    <main class="progress-screen">
      <nav class="progress-nav no-print">
        <button class="link-btn" onClick={onBackHome}>
          ← Home
        </button>
        <button class="link-btn" onClick={() => window.print()}>
          Print
        </button>
      </nav>

      <header class="progress-header">
        <h1>Beatrix's progress</h1>
        <p class="progress-subhead">Everything you've practiced so far.</p>
      </header>

      <section class="progress-stats">
        <Stat value={sprints.length} label="sprints" />
        <Stat value={totalProblems} label="problems attempted" />
        <Stat value={totalCorrect} label="correct on first try" emphasis />
        <Stat value={`${accuracy}%`} label="accuracy" />
        <Stat value={appState.streak.currentDays} label="day streak" />
        <Stat value={appState.streak.longestDays} label="longest streak" />
      </section>

      {(appState.streak.bronze || appState.streak.silver || appState.streak.gold) && (
        <section class="badges">
          <h2>Badges earned</h2>
          <div class="badge-row">
            {appState.streak.bronze && <Badge medal="🥉" label="Bronze — 3-day streak" />}
            {appState.streak.silver && <Badge medal="🥈" label="Silver — 7-day streak" />}
            {appState.streak.gold && <Badge medal="🥇" label="Gold — 14-day streak" />}
          </div>
        </section>
      )}

      <section class="sprint-history">
        <h2>Sprint history</h2>
        {sprints.length === 0 ? (
          <p class="empty">No sprints yet — start your first one from the home page.</p>
        ) : (
          <table class="sprint-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Attempted</th>
                <th>First try</th>
                <th>Retry</th>
                <th>Flagged</th>
              </tr>
            </thead>
            <tbody>
              {sprints
                .slice()
                .reverse()
                .map((s) => {
                  const correct = s.attempts.filter((a) => a.result === 'correct').length;
                  const retry = s.attempts.filter((a) => a.result === 'wrong-first').length;
                  const flagged = s.attempts.filter((a) => a.result === 'flagged').length;
                  return (
                    <tr key={s.id}>
                      <td>{new Date(s.endedAt).toLocaleDateString()}</td>
                      <td>{s.attempts.length}</td>
                      <td>{correct}</td>
                      <td>{retry}</td>
                      <td>{flagged}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function Stat({
  value,
  label,
  emphasis,
}: {
  value: number | string;
  label: string;
  emphasis?: boolean;
}) {
  return (
    <div class={emphasis ? 'stat stat-emphasis' : 'stat'}>
      <div class="stat-value">{value}</div>
      <div class="stat-label">{label}</div>
    </div>
  );
}

function Badge({ medal, label }: { medal: string; label: string }) {
  return (
    <div class="badge">
      <span class="badge-medal">{medal}</span>
      <span class="badge-label">{label}</span>
    </div>
  );
}
