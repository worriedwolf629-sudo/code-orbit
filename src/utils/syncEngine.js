import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  putSubject,
  putSnippet,
  getSyncQueue,
  removeQueueItem,
  getMeta,
  setMeta,
  getDB
} from './db';

// Sync States: 'synced' | 'syncing' | 'offline' | 'error'
let currentSyncStatus = !navigator.onLine
  ? 'offline'
  : isSupabaseConfigured
  ? 'synced'
  : 'offline';

const statusListeners = new Set();
const dataChangeListeners = new Set();
let realtimeChannel = null;
let syncInProgress = false;

export function getSyncStatus() {
  return currentSyncStatus;
}

export function subscribeSyncStatus(callback) {
  statusListeners.add(callback);
  callback(currentSyncStatus);
  return () => statusListeners.delete(callback);
}

export function subscribeDataChanges(callback) {
  dataChangeListeners.add(callback);
  return () => dataChangeListeners.delete(callback);
}

function updateStatus(newStatus) {
  currentSyncStatus = newStatus;
  statusListeners.forEach((fn) => {
    try {
      fn(newStatus);
    } catch (e) {
      console.warn('Status listener error:', e);
    }
  });
}

function notifyDataChanged() {
  dataChangeListeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('Data change listener error:', e);
    }
  });
}

// -----------------------------------------------------------------------------
// FORMAT MAPPERS (CamelCase JS <-> SnakeCase Postgres)
// -----------------------------------------------------------------------------

function toDbSubject(s, userId) {
  return {
    id: s.id,
    user_id: userId,
    name: s.name,
    description: s.description || '',
    color: s.color || '#2dd4bf',
    icon: s.icon || 'Boxes',
    created_at: s.created_at || new Date().toISOString(),
    updated_at: s.updated_at || new Date().toISOString(),
    deleted_at: s.deleted_at || null
  };
}

function fromDbSubject(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    color: row.color || '#2dd4bf',
    icon: row.icon || 'Boxes',
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at || null
  };
}

function toDbSnippet(s, userId) {
  return {
    id: s.id,
    user_id: userId,
    subject_id: s.subjectId,
    serial_number: s.serialNumber || 1,
    title: s.title,
    language: s.language || 'java',
    tags: Array.isArray(s.tags) ? s.tags : [],
    notes: s.notes || '',
    code: s.code || '',
    is_starred: Boolean(s.is_starred),
    time_complexity: s.time_complexity || '',
    space_complexity: s.space_complexity || '',
    common_mistake: s.common_mistake || '',
    last_reviewed: s.last_reviewed || null,
    recall_score: s.recall_score || null,
    review_count: s.review_count || 0,
    missed_count: s.missed_count || 0,
    created_at: s.created_at || new Date().toISOString(),
    updated_at: s.updated_at || new Date().toISOString(),
    deleted_at: s.deleted_at || null
  };
}

function fromDbSnippet(row) {
  return {
    id: row.id,
    subjectId: row.subject_id,
    serialNumber: row.serial_number,
    title: row.title,
    language: row.language,
    tags: Array.isArray(row.tags) ? row.tags : [],
    notes: row.notes || '',
    code: row.code || '',
    is_starred: Boolean(row.is_starred),
    time_complexity: row.time_complexity || '',
    space_complexity: row.space_complexity || '',
    common_mistake: row.common_mistake || '',
    last_reviewed: row.last_reviewed || null,
    recall_score: row.recall_score || null,
    review_count: row.review_count || 0,
    missed_count: row.missed_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at || null
  };
}

// -----------------------------------------------------------------------------
// ONE-TIME LOCALSTORAGE MIGRATION
// -----------------------------------------------------------------------------

export async function checkAndRunMigration(user) {
  if (!user) return;
  const alreadyMigrated = await getMeta(`migrated_${user.id}`, false);
  if (alreadyMigrated) return;

  try {
    const rawSubs = localStorage.getItem('codeorbit_subjects_v1');
    const rawSnips = localStorage.getItem('codeorbit_snippets_v1');

    if (rawSubs || rawSnips) {
      // 1. Create a safety backup in localStorage before migrating
      localStorage.setItem(
        'codeorbit_pre_migration_backup',
        JSON.stringify({
          migratedAt: new Date().toISOString(),
          subjects: rawSubs ? JSON.parse(rawSubs) : [],
          snippets: rawSnips ? JSON.parse(rawSnips) : []
        })
      );

      const subjects = rawSubs ? JSON.parse(rawSubs) : [];
      const snippets = rawSnips ? JSON.parse(rawSnips) : [];

      for (const s of subjects) {
        await putSubject(s, true);
      }
      for (const sn of snippets) {
        await putSnippet(sn, true);
      }
    }

    await setMeta(`migrated_${user.id}`, true);
    await triggerSync();
  } catch (err) {
    console.error('Migration error:', err);
  }
}

// -----------------------------------------------------------------------------
// CORE SYNC LOGIC (PUSH + PULL with Last-Write-Wins)
// -----------------------------------------------------------------------------

export async function triggerSync() {
  if (!navigator.onLine) {
    updateStatus('offline');
    return false;
  }

  if (!isSupabaseConfigured || !supabase) {
    updateStatus('offline');
    return false;
  }

  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    // Unauthenticated: operating in local offline mode
    updateStatus('offline');
    return false;
  }

  if (syncInProgress) return true;
  syncInProgress = true;
  updateStatus('syncing');

  try {
    const db = await getDB();

    // 1. PUSH: Flush local outbox queue
    const queue = await getSyncQueue();
    for (const item of queue) {
      if (item.table === 'subjects') {
        if (item.action === 'upsert') {
          const payload = toDbSubject(item.data, user.id);
          const { error } = await supabase.from('subjects').upsert(payload);
          if (!error) await removeQueueItem(item.id);
        } else if (item.action === 'delete') {
          const { error } = await supabase.from('subjects').delete().eq('id', item.data.id);
          if (!error) await removeQueueItem(item.id);
        }
      } else if (item.table === 'snippets') {
        if (item.action === 'upsert') {
          const payload = toDbSnippet(item.data, user.id);
          const { error } = await supabase.from('snippets').upsert(payload);
          if (!error) await removeQueueItem(item.id);
        } else if (item.action === 'delete') {
          const { error } = await supabase.from('snippets').delete().eq('id', item.data.id);
          if (!error) await removeQueueItem(item.id);
        }
      }
    }

    // 2. PULL: Fetch remote changes from Supabase
    const [remoteSubsRes, remoteSnipsRes] = await Promise.all([
      supabase.from('subjects').select('*'),
      supabase.from('snippets').select('*')
    ]);

    if (remoteSubsRes.error) throw remoteSubsRes.error;
    if (remoteSnipsRes.error) throw remoteSnipsRes.error;

    let localChanged = false;

    // Merge Subjects with Last-Write-Wins (LWW)
    const remoteSubs = remoteSubsRes.data || [];
    for (const rRow of remoteSubs) {
      const rObj = fromDbSubject(rRow);
      const lObj = await db.get('subjects', rObj.id);

      if (!lObj) {
        await db.put('subjects', rObj);
        localChanged = true;
      } else {
        const rTime = new Date(rObj.updated_at).getTime();
        const lTime = new Date(lObj.updated_at).getTime();
        if (rTime > lTime) {
          await db.put('subjects', rObj);
          localChanged = true;
        } else if (lTime > rTime) {
          // Local is newer, push to remote
          await supabase.from('subjects').upsert(toDbSubject(lObj, user.id));
        }
      }
    }

    // Merge Snippets with Last-Write-Wins (LWW)
    const remoteSnips = remoteSnipsRes.data || [];
    for (const rRow of remoteSnips) {
      const rObj = fromDbSnippet(rRow);
      const lObj = await db.get('snippets', rObj.id);

      if (!lObj) {
        await db.put('snippets', rObj);
        localChanged = true;
      } else {
        const rTime = new Date(rObj.updated_at).getTime();
        const lTime = new Date(lObj.updated_at).getTime();
        if (rTime > lTime) {
          await db.put('snippets', rObj);
          localChanged = true;
        } else if (lTime > rTime) {
          // Local is newer, push to remote
          await supabase.from('snippets').upsert(toDbSnippet(lObj, user.id));
        }
      }
    }

    updateStatus('synced');
    if (localChanged) {
      notifyDataChanged();
    }
    return true;
  } catch (err) {
    console.error('Sync failed:', err);
    updateStatus('error');
    return false;
  } finally {
    syncInProgress = false;
  }
}

// -----------------------------------------------------------------------------
// REALTIME & EVENT LISTENERS
// -----------------------------------------------------------------------------

export function initSyncEngine() {
  // Listen for online / offline events
  window.addEventListener('online', () => {
    triggerSync();
  });

  window.addEventListener('offline', () => {
    updateStatus('offline');
  });

  // Supabase Auth listener
  if (isSupabaseConfigured && supabase) {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await checkAndRunMigration(session.user);
        setupRealtimeSubscription(session.user.id);
        triggerSync();
      } else {
        teardownRealtimeSubscription();
        updateStatus('offline');
      }
    });

    // Initial check
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        checkAndRunMigration(data.user);
        setupRealtimeSubscription(data.user.id);
        triggerSync();
      }
    });
  }
}

function setupRealtimeSubscription(_userId) {
  if (realtimeChannel) return;
  if (!supabase) return;

  realtimeChannel = supabase
    .channel('codeorbit-realtime-vault')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'subjects' },
      () => {
        triggerSync();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'snippets' },
      () => {
        triggerSync();
      }
    )
    .subscribe();
}

function teardownRealtimeSubscription() {
  if (realtimeChannel && supabase) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}
