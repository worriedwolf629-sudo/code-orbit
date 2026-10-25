import React, { useState, useEffect } from 'react';
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

const STORAGE_SUBJECTS_KEY = 'codeorbit_subjects_v1';
const STORAGE_SNIPPETS_KEY = 'codeorbit_snippets_v1';

export default function App() {
  // Local storage persistence
  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SUBJECTS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
    } catch {
      return INITIAL_SUBJECTS;
    }
  });

  const [snippets, setSnippets] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SNIPPETS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_SNIPPETS;
    } catch {
      return INITIAL_SNIPPETS;
    }
  });

  const [activeSubjectId, setActiveSubjectId] = useState(() => {
    return subjects[0]?.id || 'sub-dsa';
  });

  // Views: 'list' (Serial Wise List) or 'network' (Orb Network Diagram)
  const [activeView, setActiveView] = useState('list');

  // Modals
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [isNewSnippetModalOpen, setIsNewSnippetModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  // Persist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SUBJECTS_KEY, JSON.stringify(subjects));
    } catch (e) {
      console.error('Failed to save subjects to localStorage', e);
    }
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SNIPPETS_KEY, JSON.stringify(snippets));
    } catch (e) {
      console.error('Failed to save snippets to localStorage', e);
    }
  }, [snippets]);

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

  const activeSubject = subjects.find(s => s.id === activeSubjectId) || subjects[0] || {
    id: 'sub-default',
    name: 'General',
    color: '#38bdf8'
  };

  const currentSubjectSnippets = snippets.filter(s => s.subjectId === activeSubjectId);

  // Snippet Handlers
  const handleCreateSnippet = (newSnippet) => {
    setSnippets(prev => [...prev, newSnippet]);
    // Switch to that subject if created under another one
    if (newSnippet.subjectId !== activeSubjectId) {
      setActiveSubjectId(newSnippet.subjectId);
    }
  };

  const handleUpdateSnippet = (updatedSnippet) => {
    setSnippets(prev => prev.map(s => s.id === updatedSnippet.id ? updatedSnippet : s));
    setSelectedSnippet(updatedSnippet);
  };

  const handleDeleteSnippet = (snippetId) => {
    setSnippets(prev => {
      const remaining = prev.filter(s => s.id !== snippetId);
      // Re-index serial numbers for that subject
      let counter = 1;
      return remaining.map(s => {
        if (s.subjectId === activeSubjectId) {
          return { ...s, serialNumber: counter++ };
        }
        return s;
      });
    });
    if (selectedSnippet && selectedSnippet.id === snippetId) {
      setSelectedSnippet(null);
    }
  };

  const handleMoveSnippet = (snippetId, direction) => {
    // direction: -1 (up) or 1 (down)
    const list = currentSubjectSnippets.slice().sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));
    const currentIndex = list.findIndex(s => s.id === snippetId);
    if (currentIndex === -1) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap serial numbers
    const current = list[currentIndex];
    const target = list[targetIndex];

    const tempSerial = current.serialNumber;
    current.serialNumber = target.serialNumber;
    target.serialNumber = tempSerial;

    setSnippets(prev => prev.map(s => {
      if (s.id === current.id) return { ...current };
      if (s.id === target.id) return { ...target };
      return s;
    }));

    showToast(`Reordered to #${current.serialNumber}`);
  };

  // Subject Handlers
  const handleCreateSubject = (newSubject) => {
    setSubjects(prev => [...prev, newSubject]);
    setActiveSubjectId(newSubject.id);
  };

  const handleDeleteSubject = (subjectId) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    setSnippets(prev => prev.filter(s => s.subjectId !== subjectId));
  };

  // Backup & Reset Handlers
  const handleImportData = (newSubjects, newSnippets) => {
    setSubjects(newSubjects);
    setSnippets(newSnippets);
    if (newSubjects.length > 0) {
      setActiveSubjectId(newSubjects[0].id);
    }
  };

  const handleResetToDefaults = () => {
    setSubjects(INITIAL_SUBJECTS);
    setSnippets(INITIAL_SNIPPETS);
    setActiveSubjectId(INITIAL_SUBJECTS[0].id);
    localStorage.removeItem(STORAGE_SUBJECTS_KEY);
    localStorage.removeItem(STORAGE_SNIPPETS_KEY);
  };

  return (
    <div className="app-layout">
      {/* Navbar with View Switcher & Subject Tabs */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        subjects={subjects}
        activeSubjectId={activeSubjectId}
        setActiveSubjectId={setActiveSubjectId}
        snippets={snippets}
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
            marginBottom: '16px',
            padding: '12px 16px',
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
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

        {/* Dynamic View: Serial List or Orb Network Diagram */}
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
            onSelectSnippet={(snip) => setSelectedSnippet(snip)}
            onAddNewSnippet={() => setIsNewSnippetModalOpen(true)}
          />
        )}
      </main>

      {/* Code Detail & Full Access Modal (Opened by clicking list item or clicking network orb) */}
      {selectedSnippet && (
        <CodeDetailModal
          snippet={selectedSnippet}
          subject={activeSubject}
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
