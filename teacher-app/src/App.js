import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import ClassSession from './components/ClassSession';
import PollManager from './components/PollManager';
import StudentList from './components/StudentList';
import Transcription from './components/Transcription';

/**
 * Auto-detect server URL by trying multiple connection methods
 */
async function detectServerUrl() {
  // Priority 1: Use explicit environment variable
  if (process.env.REACT_APP_SERVER_URL) {
    console.log('ℹ️ Using server URL from environment:', process.env.REACT_APP_SERVER_URL);
    return process.env.REACT_APP_SERVER_URL;
  }

  // Priority 2: Try .local hostname (works with mDNS on all networks)
  try {
    console.log('🔍 Trying raspberrypi.local...');
    const response = await Promise.race([
      fetch('http://raspberrypi.local:3000/api/server-info'),
      new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000))
    ]);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found server at raspberrypi.local - IP: ${data.serverIp}`);
      return 'http://raspberrypi.local:3000';
    }
  } catch (e) {
    console.log('⚠️ raspberrypi.local not accessible:', e.message);
  }

  // Priority 3: Try localhost (in case server is on same machine)
  try {
    console.log('🔍 Trying localhost...');
    const response = await Promise.race([
      fetch('http://localhost:3000/api/server-info'),
      new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000))
    ]);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found server at localhost`);
      return 'http://localhost:3000';
    }
  } catch (e) {
    console.log('⚠️ localhost not accessible:', e.message);
  }

  // Priority 4: Try common gateway IPs (Raspberry Pi often gets first IP on network)
  const commonIPs = ['192.168.1.1', '192.168.0.1', '10.0.0.1'];
  for (const ip of commonIPs) {
    try {
      console.log(`🔍 Trying ${ip}...`);
      const response = await Promise.race([
        fetch(`http://${ip}:3000/api/server-info`),
        new Promise((_, reject) => setTimeout(() => reject('timeout'), 1500))
      ]);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Found server at ${ip} (${data.serverHostname})`);
        return `http://${ip}:3000`;
      }
    } catch (e) {
      // Continue to next IP
    }
  }

  // Fallback: Default to .local (most likely to work)
  console.warn('⚠️ Could not detect server. Using default: raspberrypi.local:3000');
  console.warn('💡 Tip: You can set REACT_APP_SERVER_URL env var to specify server URL');
  return 'http://raspberrypi.local:3000';
}

function App() {
  const [socket, setSocket] = useState(null);
  const [teacherId] = useState(`teacher-${Date.now()}`);
  const [classActive, setClassActive] = useState(false);
  const [classId, setClassId] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('session');
  const [connectionStatus, setConnectionStatus] = useState('Detecting server...');

  useEffect(() => {
    // Auto-detect and connect to server
    detectServerUrl().then(serverUrl => {
      console.log(`📡 Connecting to: ${serverUrl}`);
      setConnectionStatus('Connecting...');

      const newSocket = io(serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to server');
        setConnectionStatus('Connected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        setConnectionStatus(`Connection Error: ${error.message}`);
      });

      newSocket.on('disconnect', () => {
        console.log('⚠️ Disconnected from server');
        setConnectionStatus('Disconnected');
      });

      newSocket.on('class-started', (data) => {
        console.log('Class started:', data.class_id);
        setClassId(data.class_id);
        setClassActive(true);
      });

      newSocket.on('student-connected', (data) => {
        console.log('Student connected:', data.student_name);
        setStudents(prev => [...prev, {
          id: data.student_id,
          name: data.student_name
        }]);
      });

      newSocket.on('student-disconnected', (data) => {
        console.log('Student disconnected:', data.student_id);
        setStudents(prev => prev.filter(s => s.id !== data.student_id));
      });

      newSocket.on('class-ended', () => {
        setClassActive(false);
        setStudents([]);
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) newSocket.disconnect();
      };
    });
  }, []);

  const startClass = (className) => {
    if (socket) {
      socket.emit('teacher-join', {
        teacher_id: teacherId,
        class_name: className
      });
    }
  };

  const endClass = () => {
    if (socket && classId) {
      socket.emit('end-class', { class_id: classId });
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M16.8311 15.6402C17.5011 15.2002 18.3811 15.6802 18.3811 16.4802V17.7702C18.3811 19.0402 17.3911 20.4002 16.2011 20.8002L13.0111 21.8602C12.4511 22.0502 11.5411 22.0502 10.9911 21.8602L7.80109 20.8002C6.60109 20.4002 5.62109 19.0402 5.62109 17.7702V16.4702C5.62109 15.6802 6.50109 15.2002 7.16109 15.6302L9.22109 16.9702C10.0111 17.5002 11.0111 17.7602 12.0111 17.7602C13.0111 17.7602 14.0111 17.5002 14.8011 16.9702L16.8311 15.6402Z" fill="#292D32"></path> <path d="M19.9795 6.45859L13.9895 2.52859C12.9095 1.81859 11.1295 1.81859 10.0495 2.52859L4.02953 6.45859C2.09953 7.70859 2.09953 10.5386 4.02953 11.7986L5.62953 12.8386L10.0495 15.7186C11.1295 16.4286 12.9095 16.4286 13.9895 15.7186L18.3795 12.8386L19.7495 11.9386V14.9986C19.7495 15.4086 20.0895 15.7486 20.4995 15.7486C20.9095 15.7486 21.2495 15.4086 21.2495 14.9986V10.0786C21.6495 8.78859 21.2395 7.28859 19.9795 6.45859Z" fill="#292D32"></path> </g></svg>
            </svg>
          </div>
          <h1>EduFlow Teacher</h1>
        </div>
        <div className="status">
          <div style={{ marginBottom: '8px' }}>
            {connectionStatus === 'Connected' ? (
              <span className="status-active">🟢 {connectionStatus}</span>
            ) : connectionStatus === 'Detecting server...' ? (
              <span className="status-inactive">🔄 {connectionStatus}</span>
            ) : (
              <span className="status-inactive">🔴 {connectionStatus}</span>
            )}
          </div>
          {classActive ? (
            <span className="status-active">● Class Active (ID: {classId})</span>
          ) : (
            <span className="status-inactive">● No Active Class</span>
          )}
        </div>
      </header>

      <nav className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'session' ? 'active' : ''}`}
          onClick={() => setActiveTab('session')}
        >
          Session
        </button>
        <button 
          className={`tab-btn ${activeTab === 'polls' ? 'active' : ''}`}
          onClick={() => setActiveTab('polls')}
        >
          Polls
        </button>
        <button 
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Students ({students.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transcription' ? 'active' : ''}`}
          onClick={() => setActiveTab('transcription')}
        >
          Transcription
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'session' && (
          <ClassSession 
            classActive={classActive}
            onStartClass={startClass}
            onEndClass={endClass}
            classId={classId}
            socket={socket}
          />
        )}
        
        {activeTab === 'polls' && (
          <PollManager 
            socket={socket}
            classActive={classActive}
            classId={classId}
          />
        )}
        
        {activeTab === 'students' && (
          <StudentList students={students} />
        )}
        
        {activeTab === 'transcription' && (
          <Transcription 
            socket={socket}
            classId={classId}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Classroom Management System v1.0</p>
      </footer>
    </div>
  );
}

export default App;
