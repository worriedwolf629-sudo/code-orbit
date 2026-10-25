import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import SerialListView from './components/SerialListView';
import NetworkDiagramView from './components/NetworkDiagramView';
import CodeDetailModal from './components/CodeDetailModal';
import NewSnippetModal from './components/NewSnippetModal';
import SubjectModal from './components/SubjectModal';
import BackupModal from './components/BackupModal';
import PhoneConnectModal from './components/PhoneConnectModal';
import Toast from './components/Toast';
import { INITIAL_SUBJECTS, INITIAL_SNIPPETS } from './data/initialData';
import { fetchVaultData, saveVaultData, subscribeToVaultSync } from './utils/syncService';

export default function App() {
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
  const [snippets, setSnippets] = useState(INITIAL_SNIPPETS);
  const [activeSubjectId, setActiveSubjectId] = useState('sub-dsa');
  const [isLiveSync, setIsLiveSync] = useState(false);

  // Views: 'list' (Serial Wise List) or 'network' (Obsidian Orb Network Diagram)
  const [activeView, setActiveView] = useState('network'); // Default to Obsidian graph to showcase immediately!

  // Modals
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [isNewSnippetModalOpen, setIsNewSnippetModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  // Flag to avoid recursive save triggers during remote sync updates
  const isSyncingFromRemoteRef = useRef(false);

  // 1. Initial load & real-time sync subscription across laptop & mobile
  useEffect(() => {
    let isMounted = true;

    const syncFromRemote = async () => {
      const data = await fetchVaultData();
      if (!isMounted) return;
      if (data.subjects && data.snippets) {
        isSyncingFromRemoteRef.current = true;
        setSubjects(data.subjects);
        setSnippets(data.snippets);
        setIsLiveSync(data.isLive);
        setTimeout(() => {
          isSyncingFromRemoteRef.current = false;
        }, 300);
      }
    };

    // Initial sync
    syncFromRemote();

    // Subscribe to SSE updates from server
    const unsubscribe = subscribeToVaultSync(() => {
      syncFromRemote();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Ensure active subject exists
  useEffect(() => {
    if (subjects.length > 0 && !subjects.some(s => s.id === activeSubjectId)) {
      setActiveSubjectId(subjects[0].id);
    }
  }, [subjects, activeSubjectId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  // Central persistence dispatcher: updates local state AND broadcasts to laptop/phone
  const commitVaultChange = (newSubjects, newSnippets, feedbackMsg) => {
    setSubjects(newSubjects);
    setSnippets(newSnippets);
    saveVaultData(newSubjects, newSnippets);
    if (feedbackMsg) showToast(feedbackMsg);
  };

  const activeSubject = subjects.find(s => s.id === activeSubjectId) || subjects[0] || {
    id: 'sub-default',
    name: 'General',
    color: '#38bdf8'
  };

  const currentSubjectSnippets = snippets.filter(s => s.subjectId === activeSubjectId);

  // Snippet Handlers
  const handleCreateSnippet = (newSnippet) => {
    const updated = [...snippets, newSnippet];
    commitVaultChange(subjects, updated, `Saved "${newSnippet.title}"! (Synced)`);
    if (newSnippet.subjectId !== activeSubjectId) {
      setActiveSubjectId(newSnippet.subjectId);
    }
  };

  const handleUpdateSnippet = (updatedSnippet) => {
    const updated = snippets.map(s => s.id === updatedSnippet.id ? updatedSnippet : s);
    commitVaultChange(subjects, updated, 'Updated & synced across devices!');
    setSelectedSnippet(updatedSnippet);
  };

  const handleDeleteSnippet = (snippetId) => {
    const remaining = snippets.filter(s => s.id !== snippetId);
    let counter = 1;
    const reindexed = remaining.map(s => {
      if (s.subjectId === activeSubjectId) {
        return { ...s, serialNumber: counter++ };
      }
      return s;
    });

    commitVaultChange(subjects, reindexed, 'Deleted & synced');
    if (selectedSnippet && selectedSnippet.id === snippetId) {
      setSelectedSnippet(null);
    }
  };

  const handleMoveSnippet = (snippetId, direction) => {
    const list = currentSubjectSnippets.slice().sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));
    const currentIndex = list.findIndex(s => s.id === snippetId);
    if (currentIndex === -1) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const current = list[currentIndex];
    const target = list[targetIndex];

    const tempSerial = current.serialNumber;
    current.serialNumber = target.serialNumber;
    target.serialNumber = tempSerial;

    const updated = snippets.map(s => {
      if (s.id === current.id) return { ...current };
      if (s.id === target.id) return { ...target };
      return s;
    });

    commitVaultChange(subjects, updated, `Reordered to #${current.serialNumber} (Synced)`);
  };

  // Subject Handlers
  const handleCreateSubject = (newSubject) => {
    const newSubjects = [...subjects, newSubject];
    commitVaultChange(newSubjects, snippets, `Subject "${newSubject.name}" created! (Synced)`);
    setActiveSubjectId(newSubject.id);
  };

  const handleDeleteSubject = (subjectId) => {
    const remainingSubs = subjects.filter(s => s.id !== subjectId);
    const remainingSnips = snippets.filter(s => s.subjectId !== subjectId);
    commitVaultChange(remainingSubs, remainingSnips, 'Subject deleted (Synced)');
  };

  // Backup & Reset Handlers
  const handleImportData = (newSubjects, newSnippets) => {
    commitVaultChange(newSubjects, newSnippets, 'Vault imported & synced!');
    if (newSubjects.length > 0) {
      setActiveSubjectId(newSubjects[0].id);
    }
  };

  const handleResetToDefaults = () => {
    commitVaultChange(INITIAL_SUBJECTS, INITIAL_SNIPPETS, 'Reset to default samples!');
    setActiveSubjectId(INITIAL_SUBJECTS[0].id);
  };

  const handleManualSync = async () => {
    const data = await fetchVaultData();
    if (data.subjects && data.snippets) {
      setSubjects(data.subjects);
      setSnippets(data.snippets);
      setIsLiveSync(data.isLive);
      showToast('Synced with laptop in real time! 🟢');
    } else {
      showToast('Working offline (cached locally)');
    }
  };

  return (
    <div className="app-layout">
      {/* Navbar with View Switcher, Subject Tabs & Live Sync Status */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        subjects={subjects}
        activeSubjectId={activeSubjectId}
        setActiveSubjectId={setActiveSubjectId}
        snippets={snippets}
        isLiveSync={isLiveSync}
        onManualSync={handleManualSync}
        onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
        onOpenNewSnippetModal={() => setIsNewSnippetModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Subject Header Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            padding: '12px 16px',
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: activeSubject.color || '#38bdf8',
                  boxShadow: `0 0 10px ${activeSubject.color || '#38bdf8'}`
                }}
              />
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#ffffff'
                }}
              >
                {activeSubject.name}
              </h2>
            </div>
            <p
              style={{
                margin: '2px 0 0 18px',
                fontSize: '12px',
                color: '#94a3b8'
              }}
            >
              {activeSubject.description || 'Subject code repository'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                background: `${activeSubject.color || '#38bdf8'}18`,
                border: `1px solid ${activeSubject.color || '#38bdf8'}33`,
                fontSize: '12px',
                fontWeight: 700,
                color: activeSubject.color || '#38bdf8',
                fontFamily: '"JetBrains Mono", monospace'
              }}
            >
              {currentSubjectSnippets.length} Code Orbs
            </div>
          </div>
        </div>

        {/* Dynamic View: Serial List or Obsidian-style Orb Network Diagram */}
        {activeView === 'list' ? (
          <SerialListView
            subject={activeSubject}
            snippets={currentSubjectSnippets}
            onSelectSnippet={(snip) => setSelectedSnippet(snip)}
            onAddNewSnippet={() => setIsNewSnippetModalOpen(true)}
            onMoveSnippet={handleMoveSnippet}
            onDeleteSnippet={handleDeleteSnippet}
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

      {/* Code Detail & Full Access Modal (Opened by clicking list item or clicking network orb) */}
      {selectedSnippet && (
        <CodeDetailModal
          snippet={selectedSnippet}
          subject={subjects.find(s => s.id === selectedSnippet.subjectId) || activeSubject}
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

      {/* Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}
