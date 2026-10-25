const STORAGE_SUBJECTS_KEY = 'codeorbit_subjects_v1';
const STORAGE_SNIPPETS_KEY = 'codeorbit_snippets_v1';

export async function fetchVaultData() {
  try {
    const res = await fetch('/api/vault');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.subjects) && Array.isArray(data.snippets)) {
        // Cache in local storage for offline durability
        localStorage.setItem(STORAGE_SUBJECTS_KEY, JSON.stringify(data.subjects));
        localStorage.setItem(STORAGE_SNIPPETS_KEY, JSON.stringify(data.snippets));
        return { subjects: data.subjects, snippets: data.snippets, isLive: true };
      }
    }
  } catch (err) {
    console.warn('Backend sync unreachable, falling back to local storage:', err);
  }

  // Fallback to localStorage
  try {
    const localSubjects = JSON.parse(localStorage.getItem(STORAGE_SUBJECTS_KEY) || '[]');
    const localSnippets = JSON.parse(localStorage.getItem(STORAGE_SNIPPETS_KEY) || '[]');
    return {
      subjects: localSubjects.length ? localSubjects : null,
      snippets: localSnippets.length ? localSnippets : null,
      isLive: false
    };
  } catch {
    return { subjects: null, snippets: null, isLive: false };
  }
}

export async function saveVaultData(subjects, snippets) {
  // Always cache locally first
  try {
    localStorage.setItem(STORAGE_SUBJECTS_KEY, JSON.stringify(subjects));
    localStorage.setItem(STORAGE_SNIPPETS_KEY, JSON.stringify(snippets));
  } catch (e) {
    console.error('Local storage write failed', e);
  }

  // Sync to laptop backend
  try {
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjects, snippets })
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to sync to laptop backend:', err);
    return false;
  }
}

export function subscribeToVaultSync(onRemoteUpdate) {
  let eventSource = null;
  let isConnected = false;

  try {
    eventSource = new EventSource('/api/vault/events');

    eventSource.onopen = () => {
      isConnected = true;
    };

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'sync') {
          onRemoteUpdate();
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = () => {
      isConnected = false;
    };
  } catch (e) {
    console.warn('SSE not supported or failed to connect:', e);
  }

  // Background fallback polling for mobile devices that suspend EventSource
  const pollInterval = setInterval(() => {
    onRemoteUpdate();
  }, 5000);

  return () => {
    if (eventSource) eventSource.close();
    clearInterval(pollInterval);
  };
}
