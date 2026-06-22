import { useEffect, useState } from 'preact/hooks';
import { SprintContainer } from './views/sprint';
import { HomeView } from './views/home';
import { HerProgressView } from './views/her-progress';
import { ParentDashboard } from './views/parent-dashboard';
import { TutorReport } from './views/tutor-report';
import { SettingsView } from './views/settings';
import { useRouter } from './views/router';
import { loadState, saveState } from './storage/local';
import { computeStreak } from './analytics/streak';
import { loadSyncConfig, saveSyncConfig } from './storage/sync-config';
import { pullStateFromGitHub, pushStateToGitHub } from './storage/sync';
import type { SprintState } from './sprint/engine';
import type { AppState } from './types';

export function App() {
  const [route, navigate] = useRouter();
  const [appState, setAppState] = useState<AppState>(() => loadState());

  // Auto-pull on parent routes so the dashboard reflects what's on the remote.
  // Best-effort; failures are silent (network down, repo not set yet).
  useEffect(() => {
    if (route.name !== 'parents' && route.name !== 'parents-report') return;
    const config = loadSyncConfig();
    if (!config || !config.owner) return;
    pullStateFromGitHub(config)
      .then((remote) => {
        if (!remote) return;
        saveState(remote);
        setAppState(remote);
        saveSyncConfig({ ...config, lastPulledAt: Date.now() });
      })
      .catch(() => {
        /* silent — local data is still valid */
      });
  }, [route.name]);

  function handleSprintComplete(state: SprintState) {
    if (state.phase.kind !== 'ended') return;
    const next: AppState = {
      ...appState,
      sprints: [...appState.sprints, state.phase.result],
      streak: computeStreak([...appState.sprints, state.phase.result], appState.streak),
    };
    saveState(next);
    setAppState(next);
    // Auto-push if a token is configured; best-effort.
    const config = loadSyncConfig();
    if (config?.token) {
      pushStateToGitHub(next, config)
        .then(() =>
          saveSyncConfig({ ...config, lastPushedAt: Date.now() }),
        )
        .catch(() => {
          /* silent — user can retry from Settings */
        });
    }
  }

  switch (route.name) {
    case 'home':
      return (
        <HomeView
          appState={appState}
          onStartSprint={() => navigate({ name: 'sprint' })}
          onOpenProgress={() => navigate({ name: 'her-progress' })}
          onOpenSettings={() => navigate({ name: 'settings' })}
        />
      );
    case 'sprint':
      return (
        <SprintContainer
          tidyMode={appState.tidyMode}
          onComplete={handleSprintComplete}
        />
      );
    case 'her-progress':
      return (
        <HerProgressView
          appState={appState}
          onBackHome={() => navigate({ name: 'home' })}
        />
      );
    case 'parents':
      return (
        <ParentDashboard
          appState={appState}
          asOfMs={Date.now()}
          onOpenReport={() => navigate({ name: 'parents-report' })}
          onBackHome={() => navigate({ name: 'home' })}
          onOpenSettings={() => navigate({ name: 'settings' })}
        />
      );
    case 'parents-report':
      return (
        <TutorReport
          appState={appState}
          asOfMs={Date.now()}
          onBackDashboard={() => navigate({ name: 'parents' })}
        />
      );
    case 'settings':
      return (
        <SettingsView
          appState={appState}
          onUpdate={setAppState}
          onBackHome={() => navigate({ name: 'home' })}
        />
      );
  }
}
