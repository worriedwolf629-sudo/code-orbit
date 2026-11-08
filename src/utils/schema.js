import { z } from 'zod';

export const CURRENT_SCHEMA_VERSION = 1;
export const MAX_SNIPPET_BYTES = 250 * 1024; // 250 KB limit per snippet

// -----------------------------------------------------------------------------
// ZOD SCHEMAS
// -----------------------------------------------------------------------------

export const SubjectZodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).default('Untitled Subject'),
  description: z.string().default(''),
  color: z.string().default('#2dd4bf'),
  icon: z.string().default('Boxes'),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
  deleted_at: z.string().nullable().default(null)
});

export const SnippetZodSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  serialNumber: z.number().int().default(1),
  title: z.string().min(1).default('Untitled Snippet'),
  language: z.string().default('java'),
  tags: z.array(z.string()).default([]),
  notes: z.string().default(''),
  code: z.string().default(''),
  is_starred: z.boolean().default(false),
  time_complexity: z.string().default(''),
  space_complexity: z.string().default(''),
  common_mistake: z.string().default(''),
  last_reviewed: z.string().nullable().default(null),
  recall_score: z.string().nullable().default(null),
  review_count: z.number().int().default(0),
  missed_count: z.number().int().default(0),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
  deleted_at: z.string().nullable().default(null),
  schemaVersion: z.number().int().default(CURRENT_SCHEMA_VERSION)
});

// -----------------------------------------------------------------------------
// VALIDATION & REPAIR (Never throws, repairs corrupt/missing data gracefully)
// -----------------------------------------------------------------------------

export function validateOrRepairSubject(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `sub-repaired-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: 'Recovered Subject',
      description: 'Auto-repaired from invalid record',
      color: '#2dd4bf',
      icon: 'Boxes',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    };
  }

  const result = SubjectZodSchema.safeParse({
    id: raw.id || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Untitled Subject',
    description: typeof raw.description === 'string' ? raw.description : '',
    color: typeof raw.color === 'string' ? raw.color : '#2dd4bf',
    icon: typeof raw.icon === 'string' ? raw.icon : 'Boxes',
    created_at: raw.created_at || (raw.createdAt ? `${raw.createdAt}T00:00:00.000Z` : new Date().toISOString()),
    updated_at: raw.updated_at || new Date().toISOString(),
    deleted_at: raw.deleted_at || null
  });

  if (result.success) {
    return result.data;
  }

  // Fallback repair
  return {
    id: String(raw.id || `sub-fixed-${Date.now()}`),
    name: String(raw.name || 'Recovered Subject'),
    description: String(raw.description || ''),
    color: '#2dd4bf',
    icon: 'Boxes',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  };
}

export function validateOrRepairSnippet(raw, defaultSubjectId = 'sub-dsa') {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `snip-repaired-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      subjectId: defaultSubjectId,
      serialNumber: 1,
      title: 'Recovered Snippet',
      language: 'plaintext',
      tags: [],
      notes: 'Auto-repaired from invalid record',
      code: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      schemaVersion: CURRENT_SCHEMA_VERSION
    };
  }

  const result = SnippetZodSchema.safeParse({
    id: raw.id || `snip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    subjectId: raw.subjectId || defaultSubjectId,
    serialNumber: typeof raw.serialNumber === 'number' ? raw.serialNumber : parseInt(raw.serialNumber, 10) || 1,
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Untitled Snippet',
    language: typeof raw.language === 'string' ? raw.language : 'java',
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t) => typeof t === 'string') : [],
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    code: typeof raw.code === 'string' ? raw.code : String(raw.code || ''),
    is_starred: Boolean(raw.is_starred),
    time_complexity: typeof raw.time_complexity === 'string' ? raw.time_complexity : '',
    space_complexity: typeof raw.space_complexity === 'string' ? raw.space_complexity : '',
    common_mistake: typeof raw.common_mistake === 'string' ? raw.common_mistake : '',
    last_reviewed: raw.last_reviewed || null,
    recall_score: raw.recall_score || null,
    review_count: typeof raw.review_count === 'number' ? raw.review_count : 0,
    missed_count: typeof raw.missed_count === 'number' ? raw.missed_count : 0,
    created_at: raw.created_at || (raw.createdAt ? `${raw.createdAt}T00:00:00.000Z` : new Date().toISOString()),
    updated_at: raw.updated_at || new Date().toISOString(),
    deleted_at: raw.deleted_at || null,
    schemaVersion: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : CURRENT_SCHEMA_VERSION
  });

  if (result.success) {
    return migrateSnippetSchema(result.data);
  }

  return {
    id: String(raw.id || `snip-fixed-${Date.now()}`),
    subjectId: String(raw.subjectId || defaultSubjectId),
    serialNumber: 1,
    title: String(raw.title || 'Recovered Snippet'),
    language: String(raw.language || 'java'),
    tags: [],
    notes: String(raw.notes || ''),
    code: String(raw.code || ''),
    is_starred: false,
    time_complexity: '',
    space_complexity: '',
    common_mistake: '',
    last_reviewed: null,
    recall_score: null,
    review_count: 0,
    missed_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    schemaVersion: CURRENT_SCHEMA_VERSION
  };
}

// -----------------------------------------------------------------------------
// SCHEMA MIGRATION PIPELINE
// -----------------------------------------------------------------------------

export function migrateSnippetSchema(snippet) {
  let item = { ...snippet };
  const version = item.schemaVersion || 0;

  if (version < 1) {
    // Migration from v0
    item.schemaVersion = 1;
    item.tags = Array.isArray(item.tags) ? item.tags : [];
    item.code = typeof item.code === 'string' ? item.code : '';
    item.deleted_at = item.deleted_at || null;
    item.is_starred = Boolean(item.is_starred);
    item.time_complexity = item.time_complexity || '';
    item.space_complexity = item.space_complexity || '';
    item.common_mistake = item.common_mistake || '';
    item.last_reviewed = item.last_reviewed || null;
    item.recall_score = item.recall_score || null;
    item.review_count = item.review_count || 0;
    item.missed_count = item.missed_count || 0;
  }

  return item;
}

// -----------------------------------------------------------------------------
// PASTE & SIZE GUARD
// -----------------------------------------------------------------------------

export function checkSnippetSize(code) {
  if (typeof code !== 'string') return { ok: true, bytes: 0, sizeKb: 0 };
  const bytes = new Blob([code]).size;
  const sizeKb = Math.round(bytes / 1024);

  if (bytes > MAX_SNIPPET_BYTES) {
    return {
      ok: false,
      bytes,
      sizeKb,
      warning: `Snippet code size (${sizeKb} KB) exceeds the recommended limit of 250 KB. Large snippets may slow down mobile performance.`
    };
  }

  if (bytes > 100 * 1024) {
    return {
      ok: true,
      bytes,
      sizeKb,
      warning: `Large code snippet (${sizeKb} KB). Consider trimming to keep mobile rendering fast.`
    };
  }

  return { ok: true, bytes, sizeKb };
}

