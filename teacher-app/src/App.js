import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import ClassSession from './components/ClassSession';
import PollManager from './components/PollManager';
import StudentList from './components/StudentList';
import Transcription from './components/Transcription';

function App() {
  const [socket, setSocket] = useState(null);
  const [teacherId] = useState(`teacher-${Date.now()}`);
  const [classActive, setClassActive] = useState(false);
  const [classId, setClassId] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('session');

  useEffect(() => {
    // Connect to server - use REACT_APP_SERVER_URL env var or default to localhost
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';
    const newSocket = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
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
        <h1>👨‍🏫 Teacher Dashboard</h1>
        <div className="status">
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
