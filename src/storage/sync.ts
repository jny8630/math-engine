import type { AppState } from '../types';
import type { SyncConfig } from './sync-config';
import { migrate } from './schema';

const DATA_BRANCH = 'data';
const STATE_PATH = 'state.json';

// ---------------------------------------------------------------------------
// Push (write): commits state.json to the data branch via GitHub Contents API.
// Auto-creates the data branch on first push.
// Requires the PAT in config.token.
// ---------------------------------------------------------------------------

export async function pushStateToGitHub(state: AppState, config: SyncConfig): Promise<void> {
  if (!config.token) {
    throw new Error('No GitHub token set. Add a Personal Access Token in Settings.');
  }
  await ensureDataBranch(config);
  const existingSha = await getFileSha(config, STATE_PATH, DATA_BRANCH);
  const body: Record<string, unknown> = {
    message: `sync: ${new Date().toISOString()}`,
    content: utf8ToBase64(JSON.stringify(state, null, 2)),
    branch: DATA_BRANCH,
  };
  if (existingSha) body.sha = existingSha;
  const resp = await ghFetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${STATE_PATH}`,
    {
      method: 'PUT',
      headers: { Authorization: `token ${config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!resp.ok) {
    throw new Error(`Push failed: ${resp.status} ${await resp.text()}`);
  }
}

// ---------------------------------------------------------------------------
// Pull (read): fetches state.json from the data branch via raw.githubusercontent.com.
// Works without a PAT for public repos — by design (parent devices need no token).
// Returns null when no remote state exists yet.
// ---------------------------------------------------------------------------

export async function pullStateFromGitHub(config: SyncConfig): Promise<AppState | null> {
  // Cache-bust by appending a timestamp; raw.githubusercontent.com caches aggressively.
  const url = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${DATA_BRANCH}/${STATE_PATH}?t=${Date.now()}`;
  const resp = await fetch(url);
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`Pull failed: ${resp.status}`);
  const text = await resp.text();
  return migrate(JSON.parse(text));
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

async function getFileSha(
  config: SyncConfig,
  path: string,
  branch: string,
): Promise<string | undefined> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${branch}`;
  const resp = await ghFetch(url, {
    headers: { Authorization: `token ${config.token}` },
  });
  if (resp.status === 404) return undefined;
  if (!resp.ok) throw new Error(`Failed to check file: ${resp.status}`);
  const data = (await resp.json()) as { sha: string };
  return data.sha;
}

async function ensureDataBranch(config: SyncConfig): Promise<void> {
  // Check whether data branch exists
  const branchUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/branches/${DATA_BRANCH}`;
  const branchResp = await ghFetch(branchUrl, {
    headers: { Authorization: `token ${config.token}` },
  });
  if (branchResp.ok) return;
  if (branchResp.status !== 404) {
    throw new Error(`Branch check failed: ${branchResp.status}`);
  }
  // Branch doesn't exist — create it pointing at main's HEAD
  const mainRefUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/git/refs/heads/main`;
  const mainResp = await ghFetch(mainRefUrl, {
    headers: { Authorization: `token ${config.token}` },
  });
  if (!mainResp.ok) {
    throw new Error(
      `Couldn't find main branch to fork from: ${mainResp.status}. Make sure the repo exists and you've pushed at least one commit to main.`,
    );
  }
  const mainRef = (await mainResp.json()) as { object: { sha: string } };
  const createUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/git/refs`;
  const createResp = await ghFetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `token ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: `refs/heads/${DATA_BRANCH}`, sha: mainRef.object.sha }),
  });
  if (!createResp.ok) {
    throw new Error(`Failed to create data branch: ${createResp.status}`);
  }
}

function utf8ToBase64(s: string): string {
  // btoa fails on Unicode; this round-trips through UTF-8 first.
  return btoa(unescape(encodeURIComponent(s)));
}

async function ghFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: { Accept: 'application/vnd.github+json', ...(init?.headers ?? {}) },
  });
}
