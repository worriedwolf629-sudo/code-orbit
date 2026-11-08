import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import GlobalSearchBar from './components/GlobalSearchBar';
import SerialListView from './components/SerialListView';
import RevisionView from './components/RevisionView';
import NetworkDiagramView from './components/NetworkDiagramView';
import CodeDetailModal from './components/CodeDetailModal';
import NewSnippetModal from './components/NewSnippetModal';
import SubjectModal from './components/SubjectModal';
import BackupModal from './components/BackupModal';
import PhoneConnectModal from './components/PhoneConnectModal';
import AuthModal from './components/AuthModal';
import TrashModal from './components/TrashModal';
import Toast from './components/Toast';
import { INITIAL_SUBJECTS, INITIAL_SNIPPETS } from './data/initialData';
import {
  getAllSubjects,
  getAllSnippets,
  getTrashSnippets,
  putSubject,
  putSnippet,
  softDeleteSnippet,
  softDeleteSubject,
  bulkPutSubjects,
  bulkPutSnippets,
  seedIfEmpty
} from './utils/db';
import {
  initSyncEngine,
  triggerSync,
  subscribeSyncStatus,
  subscribeDataChanges
} from './utils/syncEngine';
import { recordChangeAndCheckAutoBackup } from './utils/backupService';
import { supabase } from './utils/supabaseClient';

export default function App() {
  const [subjects, setSubjects] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [trashCount, setTrashCount] = useState(0);
  const [activeSubjectId, setActiveSubjectId] = useState('sub-dsa');
  const [syncStatus, setSyncStatus] = useState('offline');
  const [user, setUser] = useState(null);

  // Views: 'list' (Serial Wise List) or 'network' (Obsidian Orb Network Diagram)
  const [activeView, setActiveView] = useState('network');

  // Modals
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [isNewSnippetModalOpen, setIsNewSnippetModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  // Load vault data from local IndexedDB
  const reloadFromLocalDB = useCallback(async () => {
    try {
      const [localSubs, localSnips, trash] = await Promise.all([
        getAllSubjects(),
        getAllSnippets(),
        getTrashSnippets()
      ]);
      setSubjects(localSubs);
      setSnippets(localSnips);
      setTrashCount(trash.length);
    } catch (err) {
      console.error('Failed to load local DB:', err);
    }
  }, []);

  // 1. Initial Load: Seed DB if empty, initialize sync engine, check auth
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      // Seed default samples if IndexedDB is brand new
      await seedIfEmpty(INITIAL_SUBJECTS, INITIAL_SNIPPETS);
      if (!isMounted) return;

      await reloadFromLocalDB();

      // Check auth session
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (data?.user && isMounted) {
          setUser(data.user);
        }
      }

      // Initialize background sync & realtime listeners
      initSyncEngine();
    }

    initialize();

    // Subscribe to sync status updates
    const unsubStatus = subscribeSyncStatus((status) => {
      if (isMounted) setSyncStatus(status);
    });

    // Subscribe to external data changes (e.g. from cloud realtime sync)
    const unsubData = subscribeDataChanges(() => {
      if (isMounted) reloadFromLocalDB();
    });

    return () => {
      isMounted = false;
      unsubStatus();
      unsubData();
    };
  }, [reloadFromLocalDB]);

  // Ensure active subject always points to a valid subject
  useEffect(() => {
    if (subjects.length > 0 && !subjects.some((s) => s.id === activeSubjectId)) {
      setActiveSubjectId(subjects[0].id);
    }
  }, [subjects, activeSubjectId]);

  const activeSubject =
    subjects.find((s) => s.id === activeSubjectId) ||
    subjects[0] || {
      id: 'sub-default',
      name: 'General',
      color: '#2dd4bf'
    };

  const currentSubjectSnippets = snippets.filter((s) => s.subjectId === activeSubject.id);

  // Snippet Handlers (Offline-First: write locally immediately, sync in background)
  const handleCreateSnippet = async (newSnippet) => {
    try {
      await putSnippet(newSnippet, true);
      await reloadFromLocalDB();
      recordChangeAndCheckAutoBackup();
      showToast(`Saved "${newSnippet.title}"`);
      if (newSnippet.subjectId !== activeSubjectId) {
        setActiveSubjectId(newSnippet.subjectId);
      }
      triggerSync();
    } catch (err) {
      alert(`Save error: ${err.message}`);
    }
  };

  const handleUpdateSnippet = async (updatedSnippet) => {
    try {
      await putSnippet(updatedSnippet, true);
      await reloadFromLocalDB();
      recordChangeAndCheckAutoBackup();
      setSelectedSnippet(updatedSnippet);
      showToast('Updated');
      triggerSync();
    } catch (err) {
      alert(`Update error: ${err.message}`);
    }
  };

  const handleDeleteSnippet = async (snippetId) => {
    try {
      // Soft delete: moves to Trash so data is never permanently lost accidentally
      await softDeleteSnippet(snippetId);
      await reloadFromLocalDB();
      recordChangeAndCheckAutoBackup();
      showToast('Moved to Trash (recoverable)');
      if (selectedSnippet && selectedSnippet.id === snippetId) {
        setSelectedSnippet(null);
      }
      triggerSync();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleMoveSnippet = async (snippetId, direction) => {
    const list = currentSubjectSnippets.slice().sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));
    const currentIndex = list.findIndex((s) => s.id === snippetId);
    if (currentIndex === -1) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const current = list[currentIndex];
    const target = list[targetIndex];

    const tempSerial = current.serialNumber;
    current.serialNumber = target.serialNumber;
    target.serialNumber = tempSerial;

    await Promise.all([
      putSnippet(current, true),
      putSnippet(target, true)
    ]);
    await reloadFromLocalDB();
    recordChangeAndCheckAutoBackup();
    showToast(`Reordered #${current.serialNumber}`);
    triggerSync();
  };

  // Subject Handlers
  const handleCreateSubject = async (newSubject) => {
    try {
      await putSubject(newSubject, true);
      await reloadFromLocalDB();
      recordChangeAndCheckAutoBackup();
      setActiveSubjectId(newSubject.id);
      showToast(`Subject "${newSubject.name}" created`);
      triggerSync();
    } catch (err) {
      alert(`Error creating subject: ${err.message}`);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      await softDeleteSubject(subjectId);
      // Soft delete snippets under this subject
      const relatedSnippets = snippets.filter((s) => s.subjectId === subjectId);
      for (const snip of relatedSnippets) {
        await softDeleteSnippet(snip.id);
      }
      await reloadFromLocalDB();
      recordChangeAndCheckAutoBackup();
      showToast('Subject & snippets moved to Trash');
      triggerSync();
    } catch (err) {
      alert(`Error deleting subject: ${err.message}`);
    }
  };

  // Backup & Restore Handlers
  const handleImportData = async (newSubjects, newSnippets) => {
    try {
      await bulkPutSubjects(newSubjects);
      await bulkPutSnippets(newSnippets);
      await reloadFromLocalDB();
      showToast('Vault backup imported');
      if (newSubjects.length > 0) {
        setActiveSubjectId(newSubjects[0].id);
      }
      triggerSync();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
  };

  const handleResetToDefaults = async () => {
    try {
      await bulkPutSubjects(INITIAL_SUBJECTS);
      await bulkPutSnippets(INITIAL_SNIPPETS);
      await reloadFromLocalDB();
      setActiveSubjectId(INITIAL_SUBJECTS[0].id);
      showToast('Reset to default samples');
      triggerSync();
    } catch (err) {
      alert(`Reset error: ${err.message}`);
    }
  };

  const handleManualSync = async () => {
    const success = await triggerSync();
    if (success) {
      showToast('Cloud sync complete');
      await reloadFromLocalDB();
    } else {
      showToast('Offline — changes saved locally in IndexedDB');
    }
  };

  return (
    <div className="app-layout">
      {/* Navbar with View Switcher, Cloud Sync Pill, Auth & Trash Actions */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        subjects={subjects}
        activeSubjectId={activeSubjectId}
        setActiveSubjectId={setActiveSubjectId}
        snippets={snippets}
        syncStatus={syncStatus}
        user={user}
        onManualSync={handleManualSync}
        onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
        onOpenNewSnippetModal={() => setIsNewSnippetModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenTrashModal={() => setIsTrashModalOpen(true)}
        trashCount={trashCount}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Global Vault Search (Cross-Subject Fuzzy Search) */}
        <GlobalSearchBar
          snippets={snippets}
          subjects={subjects}
          onSelectSnippet={(snip) => setSelectedSnippet(snip)}
          onSelectSubject={(subId) => setActiveSubjectId(subId)}
        />

        {/* Subject Header Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            padding: '10px 14px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-l)',
            border: '1px solid var(--border)'
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}
            >
              {activeSubject.name}
            </h2>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '12px',
                color: 'var(--text-dim)'
              }}
            >
              {activeSubject.description || 'Code repository'}
            </p>
          </div>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-body)',
              background: 'var(--bg-raised)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-s)',
              border: '1px solid var(--border)'
            }}
          >
            {currentSubjectSnippets.length}
          </span>
        </div>

        {/* Dynamic View: Serial List, Revision Mode, or Obsidian-style Orb Network Diagram */}
        {activeView === 'list' ? (
          <SerialListView
            subject={activeSubject}
            snippets={currentSubjectSnippets}
            onSelectSnippet={(snip) => setSelectedSnippet(snip)}
            onAddNewSnippet={() => setIsNewSnippetModalOpen(true)}
            onMoveSnippet={handleMoveSnippet}
            _onDeleteSnippet={handleDeleteSnippet}
            onShowToast={showToast}
            onUpdateSnippet={handleUpdateSnippet}
          />
        ) : activeView === 'revision' ? (
          <RevisionView
            subject={activeSubject}
            snippets={currentSubjectSnippets}
            onUpdateSnippet={handleUpdateSnippet}
            onSelectSnippet={(snip) => setSelectedSnippet(snip)}
            onShowToast={showToast}
          />
        ) : (
          <NetworkDiagramView
            subject={activeSubject}
            snippets={currentSubjectSnippets}
            allSubjects={subjects}
            allSnippets={snippets}
            onSelectSnippet={(snip) => setSelectedSnippet(snip)}
            onAddNewSnippet={() => setIsNewSnippetModalOpen(true)}
          />
        )}
      </main>

      {/* Code Detail & Full Access Modal */}
      {selectedSnippet && (
        <CodeDetailModal
          snippet={selectedSnippet}
          subject={subjects.find((s) => s.id === selectedSnippet.subjectId) || activeSubject}
          onClose={() => setSelectedSnippet(null)}
          onUpdateSnippet={handleUpdateSnippet}
          onDeleteSnippet={handleDeleteSnippet}
          onShowToast={showToast}
        />
      )}

      {/* New Snippet Modal */}
      {isNewSnippetModalOpen && (
        <NewSnippetModal
          subjects={subjects}
          activeSubjectId={activeSubjectId}
          currentSnippetsCount={currentSubjectSnippets.length}
          onClose={() => setIsNewSnippetModalOpen(false)}
          onCreateSnippet={handleCreateSnippet}
          onShowToast={showToast}
        />
      )}

      {/* Subject Manager Modal */}
      {isSubjectModalOpen && (
        <SubjectModal
          onClose={() => setIsSubjectModalOpen(false)}
          onCreateSubject={handleCreateSubject}
          subjects={subjects}
          onDeleteSubject={handleDeleteSubject}
          onShowToast={showToast}
        />
      )}

      {/* Backup Modal */}
      {isBackupModalOpen && (
        <BackupModal
          onClose={() => setIsBackupModalOpen(false)}
          subjects={subjects}
          snippets={snippets}
          onImportData={handleImportData}
          onResetToDefaults={handleResetToDefaults}
          onShowToast={showToast}
        />
      )}

      {/* Phone Connect Modal */}
      {isPhoneModalOpen && (
        <PhoneConnectModal
          onClose={() => setIsPhoneModalOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Auth & Cloud Sync Modal */}
      {isAuthModalOpen && (
        <AuthModal
          user={user}
          onUserChange={(newUser) => setUser(newUser)}
          onClose={() => setIsAuthModalOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Trash Modal (Soft Deletes / Recovery) */}
      {isTrashModalOpen && (
        <TrashModal
          subjects={subjects}
          onClose={() => setIsTrashModalOpen(false)}
          onSnippetRestored={async () => {
            await reloadFromLocalDB();
            triggerSync();
          }}
          onShowToast={showToast}
        />
      )}

      {/* Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}
