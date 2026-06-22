import type { AppState } from '../types';

export type HomeViewProps = {
  appState: AppState;
  onStartSprint: () => void;
  onOpenProgress: () => void;
  onOpenSettings?: () => void;
};

export function HomeView({ appState, onStartSprint, onOpenProgress, onOpenSettings }: HomeViewProps) {
  const recent = appState.sprints.slice(-3).reverse();
  return (
    <main class="home-screen">
      <header class="home-header">
        <h1>Hi, Beatrix</h1>
        <p class="home-subhead">10 minutes of math is enough to move the needle.</p>
      </header>

      <section class="streak-banner">
        <StreakBadge state={appState.streak} />
      </section>

      <section class="home-cta">
        <button class="primary-btn home-start-btn" onClick={onStartSprint}>
          Start a sprint
        </button>
      </section>

      {recent.length > 0 && (
        <section class="recent-sprints">
          <h2>Recent sprints</h2>
          <ul>
            {recent.map((s) => {
              const correct = s.attempts.filter((a) => a.result === 'correct').length;
              return (
                <li key={s.id}>
                  <span class="recent-date">{new Date(s.endedAt).toLocaleDateString()}</span>
                  <span class="recent-stats">
                    {correct}/{s.attempts.length} on first try
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer class="home-footer">
        <button class="link-btn" onClick={onOpenProgress}>
          See your progress →
        </button>
        {onOpenSettings && (
          <button class="link-btn" onClick={onOpenSettings}>
            Settings
          </button>
        )}
      </footer>
    </main>
  );
}

function StreakBadge({ state }: { state: AppState['streak'] }) {
  if (state.currentDays === 0) {
    return <div class="streak-empty">First sprint? Let's start your streak today.</div>;
  }
  const medal = state.gold ? '🥇' : state.silver ? '🥈' : state.bronze ? '🥉' : '';
  return (
    <div class="streak">
      <span class="streak-medal">{medal}</span>
      <span class="streak-text">
        <strong>{state.currentDays}-day streak</strong>
        {state.longestDays > state.currentDays && (
          <span class="streak-long"> (longest: {state.longestDays})</span>
        )}
      </span>
    </div>
  );
}
