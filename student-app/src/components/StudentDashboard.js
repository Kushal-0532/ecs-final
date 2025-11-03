import React, { useRef, useEffect } from 'react';
import PollCard from './PollCard';
import PPTViewer from './PPTViewer';
import TranscriptionViewer from './TranscriptionViewer';

function StudentDashboard({
  studentInfo,
  className,
  classActive,
  currentPoll,
  pptUrl,
  transcriptions,
  onAnswerPoll
}) {
  console.log('StudentDashboard rendered with className:', className);
  const [activeTab, setActiveTab] = React.useState('class');
  const dashboardRef = useRef(null);

  useEffect(() => {
    console.log('className changed to:', className);
  }, [className]);

  useEffect(() => {
    if (dashboardRef.current) {
      dashboardRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  if (!classActive) {
    return (
      <div className="student-dashboard">
        <header className="student-header">
          <div className="header-content">
            <h1>
              <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="studentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2E7D32"/>
                    <stop offset="100%" stopColor="#26A69A"/>
                  </linearGradient>
                </defs>
                <g fill="url(#studentGradient)">
                  <path d="M227.79492,52.61621l-96-32a11.98464,11.98464,0,0,0-7.58984,0L28.44678,52.53564l-.05078.01685-.19092.06372c-.17383.05786-.34107.12793-.51074.19312-.20118.07739-.40052.15722-.5962.24487-.24487.10962-.48706.22339-.72216.34814-.11817.06275-.23181.13233-.34766.199-.199.11426-.39526.23144-.58618.3562-.10938.07153-.21655.14551-.32361.2207q-.295.20655-.575.42993c-.09009.07154-.18091.14185-.26892.21607q-.33453.282-.64575.58691c-.04444.04346-.09192.0835-.13575.12744q-.37243.375-.70947.78077c-.06335.07592-.12109.15625-.18249.23364-.15516.1958-.30579.39453-.44837.59961-.07861.11279-.15332.22778-.228.34326q-.175.271-.33483.55127c-.07264.12671-.14551.25268-.21363.38257-.10583.20166-.20251.40844-.297.61645-.05225.115-.10987.22657-.15845.34351-.12842.30835-.24243.62353-.34522.94311-.04187.13086-.07544.2649-.113.39746-.06128.21656-.1189.43384-.16822.65455-.03125.14062-.05908.28222-.08545.4248-.04345.23462-.07861.47119-.10839.71-.01526.124-.03321.24732-.04468.37256C20.02209,63.2583,20,63.627,20,64v80a12,12,0,0,0,24,0V80.64868l23.7146,7.905a67.90093,67.90093,0,0,0,18.11377,84.73047,99.97006,99.97006,0,0,0-41.64819,36.16016,12.00007,12.00007,0,0,0,20.10351,13.10937,76.02217,76.02217,0,0,1,127.43213,0,12.00007,12.00007,0,0,0,20.10352-13.10937,99.97238,99.97238,0,0,0-41.64783-36.16016A67.9008,67.9008,0,0,0,188.2854,88.55371l39.50952-13.16992a11.99952,11.99952,0,0,0,0-22.76758ZM128,44.64941,186.05273,64l-20.70739,6.90234-.03272.011L128,83.35059,90.68677,70.91309l-.02844-.00953L69.94727,64ZM172,120A44,44,0,1,1,90.93738,96.29443l33.2677,11.08936a11.99358,11.99358,0,0,0,7.58984,0l33.2677-11.08936A43.87528,43.87528,0,0,1,172,120Z"></path>
                </g>
              </svg>
              {className || 'Class Session'}
            </h1>
            <span className="connection-status">● Connected</span>
          </div>
          <div className="student-info-bar">
            {studentInfo.name}
          </div>
        </header>
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
          <h1>
            <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="studentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2E7D32"/>
                  <stop offset="100%" stopColor="#26A69A"/>
                </linearGradient>
              </defs>
              <g fill="url(#studentGradient)">
                <path d="M227.79492,52.61621l-96-32a11.98464,11.98464,0,0,0-7.58984,0L28.44678,52.53564l-.05078.01685-.19092.06372c-.17383.05786-.34107.12793-.51074.19312-.20118.07739-.40052.15722-.5962.24487-.24487.10962-.48706.22339-.72216.34814-.11817.06275-.23181.13233-.34766.199-.199.11426-.39526.23144-.58618.3562-.10938.07153-.21655.14551-.32361.2207q-.295.20655-.575.42993c-.09009.07154-.18091.14185-.26892.21607q-.33453.282-.64575.58691c-.04444.04346-.09192.0835-.13575.12744q-.37243.375-.70947.78077c-.06335.07592-.12109.15625-.18249.23364-.15516.1958-.30579.39453-.44837.59961-.07861.11279-.15332.22778-.228.34326q-.175.271-.33483.55127c-.07264.12671-.14551.25268-.21363.38257-.10583.20166-.20251.40844-.297.61645-.05225.115-.10987.22657-.15845.34351-.12842.30835-.24243.62353-.34522.94311-.04187.13086-.07544.2649-.113.39746-.06128.21656-.1189.43384-.16822.65455-.03125.14062-.05908.28222-.08545.4248-.04345.23462-.07861.47119-.10839.71-.01526.124-.03321.24732-.04468.37256C20.02209,63.2583,20,63.627,20,64v80a12,12,0,0,0,24,0V80.64868l23.7146,7.905a67.90093,67.90093,0,0,0,18.11377,84.73047,99.97006,99.97006,0,0,0-41.64819,36.16016,12.00007,12.00007,0,0,0,20.10351,13.10937,76.02217,76.02217,0,0,1,127.43213,0,12.00007,12.00007,0,0,0,20.10352-13.10937,99.97238,99.97238,0,0,0-41.64783-36.16016A67.9008,67.9008,0,0,0,188.2854,88.55371l39.50952-13.16992a11.99952,11.99952,0,0,0,0-22.76758ZM128,44.64941,186.05273,64l-20.70739,6.90234-.03272.011L128,83.35059,90.68677,70.91309l-.02844-.00953L69.94727,64ZM172,120A44,44,0,1,1,90.93738,96.29443l33.2677,11.08936a11.99358,11.99358,0,0,0,7.58984,0l33.2677-11.08936A43.87528,43.87528,0,0,1,172,120Z"></path>
              </g>
            </svg>
            {className || 'Class Session'}
          </h1>
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
