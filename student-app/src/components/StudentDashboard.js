import React, { useRef, useEffect } from 'react';
import PollCard from './PollCard';
import PPTViewer from './PPTViewer';
import TranscriptionViewer from './TranscriptionViewer';

function StudentDashboard({
  studentInfo,
  classActive,
  currentPoll,
  pptUrl,
  transcriptions,
  onAnswerPoll
}) {
  const [activeTab, setActiveTab] = React.useState('class');
  const dashboardRef = useRef(null);

  useEffect(() => {
    if (dashboardRef.current) {
      dashboardRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  if (!classActive) {
    return (
      <div className="student-dashboard">
        <div className="disconnected-screen">
          <h2>⏳ Waiting for Class...</h2>
          <p>Your teacher hasn't started the class yet.</p>
          <p className="student-info">Connected as: <strong>{studentInfo.name}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <header className="student-header">
        <div className="header-content">
          <h1>👨‍🎓 Class Session</h1>
          <span className="connection-status">● Connected</span>
        </div>
        <div className="student-info-bar">
          {studentInfo.name}
        </div>
      </header>

      <nav className="student-tabs">
        <button
          className={`tab ${activeTab === 'class' ? 'active' : ''}`}
          onClick={() => setActiveTab('class')}
        >
          Class
        </button>
        <button
          className={`tab ${activeTab === 'ppt' ? 'active' : ''}`}
          onClick={() => setActiveTab('ppt')}
          disabled={!pptUrl}
        >
          📄 Presentation
        </button>
        <button
          className={`tab ${activeTab === 'transcription' ? 'active' : ''}`}
          onClick={() => setActiveTab('transcription')}
        >
          📝 Notes
        </button>
      </nav>

      <main className="student-content" ref={dashboardRef}>
        {activeTab === 'class' && (
          <div className="class-view">
            {currentPoll ? (
              <PollCard poll={currentPoll} onAnswer={onAnswerPoll} />
            ) : (
              <div className="waiting-view">
                <div className="waiting-message">
                  <p>👋 Waiting for teacher's poll...</p>
                  <p className="subtitle">Teacher will send polls during class</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ppt' && (
          <PPTViewer url={pptUrl} />
        )}

        {activeTab === 'transcription' && (
          <TranscriptionViewer transcriptions={transcriptions} />
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
