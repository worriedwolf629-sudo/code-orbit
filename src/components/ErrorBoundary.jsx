import React from 'react';
import { AlertTriangle, RotateCcw, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { getDB } from '../utils/db';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      exportStatus: ''
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error trapped by CodeOrbit ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleEmergencyExport = async () => {
    try {
      this.setState({ exportStatus: 'Extracting data...' });
      const db = await getDB();
      const subjects = (await db.getAll('subjects')) || [];
      const snippets = (await db.getAll('snippets')) || [];

      const backup = {
        app: 'CodeOrbit Emergency Backup',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        error: this.state.error ? this.state.error.message : 'Unknown Error',
        subjects,
        snippets
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codeorbit_emergency_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.setState({ exportStatus: 'Emergency backup downloaded successfully!' });
    } catch (err) {
      console.error('Failed to export emergency backup:', err);
      // Fallback to localStorage if IndexedDB is somehow unreachable
      try {
        const rawSubs = localStorage.getItem('codeorbit_subjects_v1') || '[]';
        const rawSnips = localStorage.getItem('codeorbit_snippets_v1') || '[]';
        const fallbackBackup = {
          app: 'CodeOrbit Emergency Fallback',
          exportedAt: new Date().toISOString(),
          subjects: JSON.parse(rawSubs),
          snippets: JSON.parse(rawSnips)
        };
        const blob = new Blob([JSON.stringify(fallbackBackup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `codeorbit_emergency_fallback.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.setState({ exportStatus: 'Fallback backup downloaded from local cache!' });
      } catch (fallbackErr) {
        alert('Could not export backup: ' + fallbackErr.message);
        this.setState({ exportStatus: 'Export failed' });
      }
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-base, #111113)',
            color: 'var(--text-primary, #f4f4f5)',
            fontFamily: 'var(--font-sans, -apple-system, sans-serif)',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'var(--bg-surface, #18181b)',
              border: '1px solid var(--border, #27272a)',
              borderRadius: 'var(--radius-l, 10px)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-m, 8px)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertTriangle size={20} color="var(--danger, #ef4444)" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Something went wrong
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: 'var(--text-dim, #71717a)' }}>
                  Your code vault is safe in your local storage.
                </p>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-body, #a1a1aa)', lineHeight: '1.5' }}>
              CodeOrbit caught an unexpected error. You can reload the app or immediately download an emergency copy of all your subjects and code snippets.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  minHeight: '44px',
                  backgroundColor: 'var(--accent, #2dd4bf)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: 'var(--radius-m, 8px)',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={15} />
                <span>Reload App</span>
              </button>

              <button
                onClick={this.handleEmergencyExport}
                style={{
                  flex: 1,
                  minHeight: '44px',
                  backgroundColor: 'var(--bg-raised, #222226)',
                  color: 'var(--text-primary, #f4f4f5)',
                  border: '1px solid var(--border, #27272a)',
                  borderRadius: 'var(--radius-m, 8px)',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Download size={15} color="var(--accent, #2dd4bf)" />
                <span>Export My Data</span>
              </button>
            </div>

            {this.state.exportStatus && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--accent, #2dd4bf)',
                  background: 'var(--bg-base, #111113)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-s, 6px)',
                  border: '1px solid var(--border, #27272a)'
                }}
              >
                {this.state.exportStatus}
              </div>
            )}

            {/* Collapsible Error Details */}
            <div style={{ borderTop: '1px solid var(--border, #27272a)', paddingTop: '12px' }}>
              <button
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: 'var(--text-dim, #71717a)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <span>Technical details</span>
                {this.state.showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {this.state.showDetails && (
                <pre
                  style={{
                    marginTop: '8px',
                    padding: '10px',
                    backgroundColor: 'var(--bg-base, #111113)',
                    border: '1px solid var(--border, #27272a)',
                    borderRadius: 'var(--radius-s, 6px)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--danger, #ef4444)',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '140px'
                  }}
                >
                  {this.state.error ? this.state.error.toString() : 'Unknown Error'}
                  {this.state.errorInfo ? this.state.errorInfo.componentStack : ''}
                </pre>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

