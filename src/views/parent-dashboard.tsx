import type { AppState } from '../types';
import {
  today,
  thisWeek,
  flaggedAttempts,
  misconceptionStruggles,
  conceptStruggles,
  totalAttempts,
  totalCorrect,
} from '../analytics/tagging';
import { humanize } from '../reports/tutor-narrative';
import { MathText } from './katex';

export type ParentDashboardProps = {
  appState: AppState;
  asOfMs: number;
  onOpenReport: () => void;
  onBackHome: () => void;
  onOpenSettings?: () => void;
};

export function ParentDashboard({
  appState,
  asOfMs,
  onOpenReport,
  onBackHome,
  onOpenSettings,
}: ParentDashboardProps) {
  const todaySprints = today(appState.sprints, asOfMs);
  const weekSprints = thisWeek(appState.sprints, asOfMs);
  const weekFlagged = flaggedAttempts(weekSprints);
  const weekMisconceptions = misconceptionStruggles(weekSprints).slice(0, 3);
  const weekConcepts = conceptStruggles(weekSprints).filter((c) => c.count >= 3);

  return (
    <main class="dashboard-screen">
      <nav class="dashboard-nav no-print">
        <button class="link-btn" onClick={onBackHome}>
          ← Beatrix's view
        </button>
        <div class="dashboard-nav-right">
          {onOpenSettings && (
            <button class="link-btn" onClick={onOpenSettings}>
              Settings
            </button>
          )}
          <button class="primary-btn report-btn" onClick={onOpenReport}>
            Open tutor report
          </button>
        </div>
      </nav>

      <header class="dashboard-header">
        <h1>Parent dashboard</h1>
        <p class="dashboard-subhead">
          Updated {new Date(asOfMs).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}.
        </p>
      </header>

      <section class="tidy-banner">
        Tidy mode: <strong>{appState.tidyMode ? 'ON' : 'OFF'}</strong>
        {appState.tidyModeHistory.length > 0 && (
          <span class="tidy-history">
            {' '}
            (last changed {new Date(appState.tidyModeHistory[appState.tidyModeHistory.length - 1]!.at).toLocaleDateString()})
          </span>
        )}
      </section>

      <section class="dashboard-stats">
        <h2>Today</h2>
        <div class="stats-row">
          <Stat value={todaySprints.length} label="sprints" />
          <Stat value={totalAttempts(todaySprints)} label="attempted" />
          <Stat value={totalCorrect(todaySprints)} label="correct on first try" emphasis />
          <Stat value={flaggedAttempts(todaySprints).length} label="flagged" />
        </div>

        <h2 class="week-heading">This week</h2>
        <div class="stats-row">
          <Stat value={weekSprints.length} label="sprints" />
          <Stat value={totalAttempts(weekSprints)} label="attempted" />
          <Stat value={totalCorrect(weekSprints)} label="correct on first try" emphasis />
          <Stat value={weekFlagged.length} label="flagged" />
        </div>
      </section>

      {weekMisconceptions.length > 0 && (
        <section class="struggle-section">
          <h2>Mistake patterns this week</h2>
          <p class="section-hint">Most actionable signal for the tutor — what kind of mistake she's making, not just what topic.</p>
          <ul class="struggle-list">
            {weekMisconceptions.map((m) => (
              <li key={m.tag}>
                <span class="struggle-count">{m.count}×</span>
                <span class="struggle-name">{humanize(m.tag)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {weekConcepts.length > 0 && (
        <section class="struggle-section">
          <h2>Struggle areas (by topic)</h2>
          <p class="section-hint">Topics where she missed 3 or more problems this week.</p>
          <ul class="struggle-list">
            {weekConcepts.map((c) => (
              <li key={c.tag}>
                <span class="struggle-count">{c.count}</span>
                <span class="struggle-name">{humanize(c.tag)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section class="flagged-section">
        <h2>Flagged for help this week</h2>
        {weekFlagged.length === 0 ? (
          <p class="empty">Nothing flagged this week.</p>
        ) : (
          <ul class="flagged-detail-list">
            {weekFlagged.map((a) => (
              <li key={`${a.problemId}-${a.startedAt}`}>
                <div class="flagged-problem">
                  <MathText text={a.problem.text} />
                </div>
                <div class="flagged-meta">
                  Entered <code>{a.enteredFirst}</code> then <code>{a.enteredRetry}</code> —
                  correct answer was <strong>{a.problem.answer.canonical}</strong>.
                </div>
              </li>
            ))}
          </ul>
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
