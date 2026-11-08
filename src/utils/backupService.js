import { getDB, getMeta, setMeta, bulkPutSubjects, bulkPutSnippets } from './db';
import { validateOrRepairSubject, validateOrRepairSnippet } from './schema';

const ROLLING_BACKUP_THRESHOLD = 5;
const MAX_ROLLING_SNAPSHOTS = 5;

// -----------------------------------------------------------------------------
// ROLLING LOCAL SNAPSHOTS
// -----------------------------------------------------------------------------

export async function recordChangeAndCheckAutoBackup() {
  try {
    const currentCount = (await getMeta('change_counter_since_backup', 0)) + 1;

    if (currentCount >= ROLLING_BACKUP_THRESHOLD) {
      await createRollingSnapshot();
      await setMeta('change_counter_since_backup', 0);
    } else {
      await setMeta('change_counter_since_backup', currentCount);
    }
  } catch (err) {
    console.warn('Auto backup check error:', err);
  }
}

export async function createRollingSnapshot(note = 'Auto-snapshot') {
  try {
    const db = await getDB();
    const subjects = (await db.getAll('subjects')) || [];
    const snippets = (await db.getAll('snippets')) || [];

    const snapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString(),
      note,
      subjectCount: subjects.length,
      snippetCount: snippets.length,
      sampleTitles: snippets.slice(0, 3).map((s) => s.title),
      data: {
        subjects,
        snippets
      }
    };

    const existing = (await getMeta('rolling_snapshots', [])) || [];
    const updated = [snapshot, ...existing].slice(0, MAX_ROLLING_SNAPSHOTS);
    await setMeta('rolling_snapshots', updated);
    return snapshot;
  } catch (err) {
    console.error('Failed to create rolling snapshot:', err);
    return null;
  }
}

export async function getRollingSnapshots() {
  try {
    return (await getMeta('rolling_snapshots', [])) || [];
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// PREVIEW & RESTORE WITH VALIDATION
// -----------------------------------------------------------------------------

export function parseBackupPreview(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Backup is not a valid JSON object.' };
    }

    const rawSubjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];
    const rawSnippets = Array.isArray(parsed.snippets) ? parsed.snippets : [];

    if (rawSubjects.length === 0 && rawSnippets.length === 0) {
      return { ok: false, error: 'Backup file contains no subjects or snippets.' };
    }

    // Validate and repair records so bad data never crashes the app
    const repairedSubjects = rawSubjects.map(validateOrRepairSubject);
    const repairedSnippets = rawSnippets.map((s) => validateOrRepairSnippet(s));

    const sampleTitles = repairedSnippets.slice(0, 4).map((s) => s.title);

    return {
      ok: true,
      exportedAt: parsed.exportedAt || parsed.migratedAt || 'Unknown date',
      subjectCount: repairedSubjects.length,
      snippetCount: repairedSnippets.length,
      sampleTitles,
      repairedSubjects,
      repairedSnippets
    };
  } catch (err) {
    return { ok: false, error: `Invalid JSON format: ${err.message}` };
  }
}

export async function applyRestore(repairedSubjects, repairedSnippets, mode = 'replace') {
  if (mode === 'replace') {
    const db = await getDB();
    await db.clear('subjects');
    await db.clear('snippets');
  }

  await bulkPutSubjects(repairedSubjects);
  await bulkPutSnippets(repairedSnippets);
  await createRollingSnapshot('Pre-restore backup');
}

