# CodeOrbit — Personal Mobile Code & Subject Vault

A personal, mobile-first code and study vault for college students revising Data Structures, Algorithms, OOPs, and core programming concepts. Features an **Obsidian-style knowledge graph**, **serial-ordered problem lists**, **active recall revision mode**, **offline-first IndexedDB local storage**, and **cloud synchronization powered by Supabase**.

---

## Features

- **Mobile-First & Installable PWA**: Responsive on screen widths down to 380px with accessible $\ge 44$px touch targets. Works offline anywhere via Service Worker caching and IndexedDB (`idb`).
- **Cloud Sync (Supabase Postgres + Auth)**: Same data available on your phone and laptop from anywhere. Protected by Row Level Security (RLS) so only you can access your records.
- **Offline-First & Conflict Handling**: Writes instantly to local IndexedDB, queues pending mutations, and syncs to Supabase on reconnect using Last-Write-Wins (LWW).
- **Soft Deletes & Trash**: Deleting a snippet never permanently erases it without confirmation; easily restore items from Trash.
- **One-Time Migration**: Seamlessly migrates existing legacy `localStorage` data into the cloud upon first sign-in, while maintaining a safety backup.
- **Obsidian-Style Knowledge Graph**: Force-directed physics canvas on a clean matte dark surface. Tap any node to instantly open the full code page.
- **Serial Study List**: Numbered curriculum sequences (`#1`, `#2`, `#3`...) with reordering controls, search, and one-tap copy.
- **Active Recall Revision Mode**:
  - **Hide-Code Mode**: Code is masked by default with a "Tap to Reveal Code" button for memory recall.
  - **Spaced Recall Check**: Track "I knew it" vs "Missed it" test results, view last reviewed timestamps, and auto-prioritize missed snippets.
  - **Exam List (Starred)**: One-tap bookmarking to curate your high-priority exam list.
  - **Complexity & Trap Badges**: Time complexity ($O(\log N)$), space complexity ($O(1)$), and Common Exam Trap callout boxes.
  - **Topic Tags**: Organize snippets across multiple concepts (e.g. `Binary Search`, `Arrays`, `Divide & Conquer`) with filter chips.
- **Global Vault Search (Fuse.js)**: Instant cross-subject fuzzy search across titles, tags, notes, and code body with keyboard navigation (`Cmd+K` or `/`).
- **Data Safety & Backups**:
  - React Error Boundary with emergency data extractor.
  - Zod schema validation with automatic repair on corrupt records.
  - Rolling automatic JSON snapshots saved every 5 vault changes.
  - Import with preview before restoring.
  - 250KB paste size guard with warning.
- **Multi-Format Export**:
  - **JSON Backup**: Full vault snapshot export/import with validation preview.
  - **Markdown Export**: Formatted markdown per subject with frontmatter, table of contents, and code blocks ready for Obsidian or Notion.
  - **Printable Exam Cheat Sheet**: Clean, page-break-safe A4 print layout for physical exam revision sheets.

---

## Deployment & Supabase Setup

### 1. Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**, choose a name (e.g. `code-orbit`), set a database password, and select your nearest region.
3. Once provisioned, open **SQL Editor** from the left sidebar.
4. Open the file [`supabase-schema.sql`](./supabase-schema.sql) in this repository, copy its contents, paste them into the SQL Editor, and click **Run**.
   - Creates the `subjects` and `snippets` tables with revision and complexity columns.
   - Sets up automatic `updated_at` triggers and fast query indexes.
   - Enables **Row Level Security (RLS)** ensuring users only access their own data.
   - Registers both tables for **Realtime Replication**.
5. Go to **Project Settings > API** and copy:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **anon / public key** (`ey...`)
6. (Optional) For Google OAuth: Under **Authentication > Providers > Google**, enable Google and enter your Google Client ID/Secret. Email Magic Links work out of the box with no extra configuration.

### 2. Local Environment Setup
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Run locally:
```bash
npm install
npm run dev
```

### 3. Deploy to Vercel (Production)
1. Push your repository to GitHub.
2. Log in to [vercel.com](https://vercel.com) and click **Add New > Project**.
3. Import your `worriedwolf629-sudo/code-orbit` repository.
4. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL`: `https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your-anon-public-key`
5. Click **Deploy**.
6. In Supabase Dashboard under **Authentication > URL Configuration**:
   - Set **Site URL** to your Vercel deployment URL (e.g. `https://code-orbit.vercel.app`).
   - Add `https://code-orbit.vercel.app/**` to **Redirect URLs**.

---

## Known Limitations

1. **Free Tier Limits**:
   - Supabase free tier provides 500MB database storage and 50,000 monthly active users, which is more than sufficient for personal revision vaults.
   - Realtime connections on free tier support up to 200 concurrent clients.
2. **Offline Image Attachments**:
   - CodeOrbit is optimized for code snippets and textual notes. Storing large binary blobs or images inside IndexedDB is not recommended (guarded at 250KB per snippet).
3. **PWA Standalone Window on iOS Safari**:
   - On iOS Safari, Service Workers do not sync in the background when the phone is locked; sync triggers immediately when the app or tab is reopened.

---

## Tech Stack

- **Frontend**: React 19 + Vite
- **Search**: Fuse.js (weighted fuzzy search)
- **Offline Storage**: IndexedDB (via `idb`)
- **Backend & Auth**: Supabase (PostgreSQL, Row Level Security, Realtime)
- **Validation**: Zod schema validation & auto-repair
- **Service Worker / PWA**: `vite-plugin-pwa`
- **Visualization**: HTML5 2D Canvas Physics Engine with touch support
- **Syntax Highlighting**: Prism.js
- **Design Tokens**: Bespoke matte dark system (documented in `DESIGN.md`)
