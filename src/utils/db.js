import { openDB } from 'idb';

const DB_NAME = 'codeorbit_vault_db';
const DB_VERSION = 1;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 1. Subjects Store
        if (!db.objectStoreNames.contains('subjects')) {
          const subjectStore = db.createObjectStore('subjects', { keyPath: 'id' });
          subjectStore.createIndex('updated_at', 'updated_at');
          subjectStore.createIndex('deleted_at', 'deleted_at');
        }

        // 2. Snippets Store
        if (!db.objectStoreNames.contains('snippets')) {
          const snippetStore = db.createObjectStore('snippets', { keyPath: 'id' });
          snippetStore.createIndex('subjectId', 'subjectId');
          snippetStore.createIndex('updated_at', 'updated_at');
          snippetStore.createIndex('deleted_at', 'deleted_at');
        }

        // 3. Outbox Sync Queue for offline mutations
        if (!db.objectStoreNames.contains('sync_queue')) {
          const queueStore = db.createObjectStore('sync_queue', {
            keyPath: 'id',
            autoIncrement: true
          });
          queueStore.createIndex('created_at', 'created_at');
        }

        // 4. Metadata & Settings Store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      }
    });
  }
  return dbPromise;
}

// -----------------------------------------------------------------------------
// SUBJECTS
// -----------------------------------------------------------------------------

export async function getAllSubjects() {
  const db = await getDB();
  const all = await db.getAll('subjects');
  return all.filter((s) => !s.deleted_at);
}

export async function putSubject(subject, enqueueSync = true) {
  const db = await getDB();
  const now = new Date().toISOString();
  const item = {
    ...subject,
    updated_at: subject.updated_at || now,
    created_at: subject.created_at || now,
    deleted_at: subject.deleted_at || null
  };
  await db.put('subjects', item);

  if (enqueueSync) {
    await queueMutation('upsert', 'subjects', item);
  }
  return item;
}

export async function bulkPutSubjects(subjects) {
  const db = await getDB();
  const tx = db.transaction('subjects', 'readwrite');
  for (const s of subjects) {
    await tx.store.put(s);
  }
  await tx.done;
}

export async function softDeleteSubject(subjectId) {
  const db = await getDB();
  const subject = await db.get('subjects', subjectId);
  if (!subject) return null;

  const now = new Date().toISOString();
  const updated = {
    ...subject,
    deleted_at: now,
    updated_at: now
  };
  await db.put('subjects', updated);
  await queueMutation('upsert', 'subjects', updated);
  return updated;
}

// -----------------------------------------------------------------------------
// SNIPPETS
// -----------------------------------------------------------------------------

export async function getAllSnippets() {
  const db = await getDB();
  const all = await db.getAll('snippets');
  return all.filter((s) => !s.deleted_at);
}

export async function getTrashSnippets() {
  const db = await getDB();
  const all = await db.getAll('snippets');
  return all
    .filter((s) => Boolean(s.deleted_at))
    .sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
}

export async function putSnippet(snippet, enqueueSync = true) {
  const db = await getDB();
  const now = new Date().toISOString();
  const item = {
    ...snippet,
    tags: Array.isArray(snippet.tags) ? snippet.tags : [],
    code: typeof snippet.code === 'string' ? snippet.code : '',
    title: typeof snippet.title === 'string' ? snippet.title : 'Untitled Snippet',
    updated_at: snippet.updated_at || now,
    created_at: snippet.created_at || now,
    deleted_at: snippet.deleted_at || null
  };
  await db.put('snippets', item);

  if (enqueueSync) {
    await queueMutation('upsert', 'snippets', item);
  }
  return item;
}

export async function bulkPutSnippets(snippets) {
  const db = await getDB();
  const tx = db.transaction('snippets', 'readwrite');
  for (const s of snippets) {
    await tx.store.put(s);
  }
  await tx.done;
}

export async function softDeleteSnippet(snippetId) {
  const db = await getDB();
  const snippet = await db.get('snippets', snippetId);
  if (!snippet) return null;

  const now = new Date().toISOString();
  const updated = {
    ...snippet,
    deleted_at: now,
    updated_at: now
  };
  await db.put('snippets', updated);
  await queueMutation('upsert', 'snippets', updated);
  return updated;
}

export async function restoreSnippet(snippetId) {
  const db = await getDB();
  const snippet = await db.get('snippets', snippetId);
  if (!snippet) return null;

  const now = new Date().toISOString();
  const updated = {
    ...snippet,
    deleted_at: null,
    updated_at: now
  };
  await db.put('snippets', updated);
  await queueMutation('upsert', 'snippets', updated);
  return updated;
}

export async function permanentlyDeleteSnippet(snippetId) {
  const db = await getDB();
  await db.delete('snippets', snippetId);
  await queueMutation('delete', 'snippets', { id: snippetId });
}

// -----------------------------------------------------------------------------
// METADATA & SETTINGS
// -----------------------------------------------------------------------------

export async function getMeta(key, defaultValue = null) {
  try {
    const db = await getDB();
    const entry = await db.get('metadata', key);
    return entry ? entry.value : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setMeta(key, value) {
  try {
    const db = await getDB();
    await db.put('metadata', { key, value, updated_at: new Date().toISOString() });
  } catch (err) {
    console.warn('Failed to save metadata:', key, err);
  }
}

// -----------------------------------------------------------------------------
// SYNC OUTBOX QUEUE
// -----------------------------------------------------------------------------

export async function queueMutation(action, table, data) {
  try {
    const db = await getDB();
    await db.add('sync_queue', {
      action, // 'upsert' | 'delete'
      table,  // 'subjects' | 'snippets'
      data,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to queue sync mutation:', err);
  }
}

export async function getSyncQueue() {
  try {
    const db = await getDB();
    return await db.getAll('sync_queue');
  } catch {
    return [];
  }
}

export async function removeQueueItem(id) {
  try {
    const db = await getDB();
    await db.delete('sync_queue', id);
  } catch (err) {
    console.error('Failed to dequeue sync item:', id, err);
  }
}

// -----------------------------------------------------------------------------
// SEEDING
// -----------------------------------------------------------------------------

export async function seedIfEmpty(defaultSubjects = [], defaultSnippets = []) {
  const db = await getDB();
  const existingCount = await db.count('subjects');

  if (existingCount === 0) {
    const now = new Date().toISOString();
    const subjectsToSeed = defaultSubjects.map((s) => ({
      ...s,
      created_at: s.createdAt ? `${s.createdAt}T00:00:00.000Z` : now,
      updated_at: now,
      deleted_at: null
    }));

    const snippetsToSeed = defaultSnippets.map((s) => ({
      ...s,
      code: s.code || '',
      tags: Array.isArray(s.tags) ? s.tags : [],
      created_at: s.createdAt ? `${s.createdAt}T00:00:00.000Z` : now,
      updated_at: now,
      deleted_at: null
    }));

    await bulkPutSubjects(subjectsToSeed);
    await bulkPutSnippets(snippetsToSeed);
    return { seeded: true, subjects: subjectsToSeed, snippets: snippetsToSeed };
  }

  return { seeded: false };
}
