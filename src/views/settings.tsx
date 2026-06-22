import { useState } from 'preact/hooks';
import type { AppState } from '../types';
import {
  loadSyncConfig,
  saveSyncConfig,
  clearSyncConfig,
  type SyncConfig,
} from '../storage/sync-config';
import { pushStateToGitHub, pullStateFromGitHub } from '../storage/sync';
import { saveState } from '../storage/local';

export type SettingsViewProps = {
  appState: AppState;
  onUpdate: (next: AppState) => void;
  onBackHome: () => void;
};

export function SettingsView({ appState, onUpdate, onBackHome }: SettingsViewProps) {
  const [config, setConfig] = useState<SyncConfig>(
    () =>
      loadSyncConfig() ?? {
        owner: '',
        repo: 'math-engine',
        token: '',
      },
  );
  const [tidyMode, setTidyMode] = useState(appState.tidyMode);
  const [status, setStatus] = useState<{ kind: 'idle' | 'busy' | 'ok' | 'err'; msg: string }>({
    kind: 'idle',
    msg: '',
  });

  function persistConfig(next: SyncConfig) {
    setConfig(next);
    saveSyncConfig(next);
  }

  function applyTidyMode(next: boolean) {
    setTidyMode(next);
    if (next === appState.tidyMode) return;
    const updated: AppState = {
      ...appState,
      tidyMode: next,
      tidyModeHistory: [...appState.tidyModeHistory, { at: Date.now(), to: next }],
    };
    saveState(updated);
    onUpdate(updated);
  }

  async function pushNow() {
    setStatus({ kind: 'busy', msg: 'Pushing to GitHub…' });
    try {
      await pushStateToGitHub(appState, config);
      const updatedConfig = { ...config, lastPushedAt: Date.now() };
      persistConfig(updatedConfig);
      setStatus({ kind: 'ok', msg: 'Pushed.' });
    } catch (e) {
      setStatus({ kind: 'err', msg: e instanceof Error ? e.message : String(e) });
    }
  }

  async function pullNow() {
    setStatus({ kind: 'busy', msg: 'Pulling from GitHub…' });
    try {
      const remote = await pullStateFromGitHub(config);
      if (!remote) {
        setStatus({ kind: 'ok', msg: 'No remote state yet — nothing to pull.' });
        return;
      }
      saveState(remote);
      onUpdate(remote);
      persistConfig({ ...config, lastPulledAt: Date.now() });
      setStatus({ kind: 'ok', msg: 'Pulled and replaced local state.' });
    } catch (e) {
      setStatus({ kind: 'err', msg: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <main class="settings-screen">
      <nav class="settings-nav no-print">
        <button class="link-btn" onClick={onBackHome}>
          ← Home
        </button>
      </nav>

      <header class="settings-header">
        <h1>Settings</h1>
      </header>

      <section class="settings-section">
        <h2>Tidy mode</h2>
        <p class="settings-hint">
          When <strong>ON</strong>, answers stay test-faithful (clean numbers, no repeating decimals).
          When <strong>OFF</strong>, Beatrix may see results like 0.4166… and has to round —
          the upper-school "trust your process" habit.
        </p>
        <label class="toggle-row">
          <input
            type="checkbox"
            checked={tidyMode}
            onChange={(e) => applyTidyMode((e.currentTarget as HTMLInputElement).checked)}
          />
          <span>Tidy mode {tidyMode ? 'ON' : 'OFF'}</span>
        </label>
      </section>

      <section class="settings-section">
        <h2>GitHub sync</h2>
        <p class="settings-hint">
          Push Beatrix's sprint data to a GitHub repo so it shows up on the parent dashboard from
          any device. Parent-only devices can leave the Personal Access Token blank — pulls work
          from public repos without auth.
        </p>

        <Field
          label="GitHub username (owner)"
          value={config.owner}
          onInput={(v) => persistConfig({ ...config, owner: v })}
          placeholder="e.g. JNY8630"
        />
        <Field
          label="Repository name"
          value={config.repo}
          onInput={(v) => persistConfig({ ...config, repo: v })}
          placeholder="math-engine"
        />
        <Field
          label="Personal Access Token (only on Beatrix's device)"
          value={config.token}
          onInput={(v) => persistConfig({ ...config, token: v })}
          placeholder="ghp_..."
          type="password"
        />

        <div class="sync-buttons">
          <button class="primary-btn" onClick={pushNow} disabled={!config.owner || !config.token}>
            Push now
          </button>
          <button class="secondary-btn" onClick={pullNow} disabled={!config.owner}>
            Pull now (overwrites local)
          </button>
        </div>

        {status.kind !== 'idle' && (
          <div class={`sync-status sync-${status.kind}`}>{status.msg}</div>
        )}

        <div class="sync-meta">
          {config.lastPushedAt && (
            <div>Last pushed: {new Date(config.lastPushedAt).toLocaleString()}</div>
          )}
          {config.lastPulledAt && (
            <div>Last pulled: {new Date(config.lastPulledAt).toLocaleString()}</div>
          )}
        </div>

        <button
          class="link-btn danger"
          onClick={() => {
            clearSyncConfig();
            setConfig({ owner: '', repo: 'math-engine', token: '' });
          }}
        >
          Clear sync settings
        </button>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onInput,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onInput: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'password';
}) {
  return (
    <label class="field">
      <span class="field-label">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onInput={(e) => onInput((e.currentTarget as HTMLInputElement).value)}
        class="field-input"
      />
    </label>
  );
}
