import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import JoinClass from './components/JoinClass';
import StudentDashboard from './components/StudentDashboard';

// Auto-detect server URL
async function detectServerUrl() {
  const candidates = [
    'http://raspberrypi.local:3000',
    'http://localhost:3000',
    'http://192.168.1.1:3000',
    'http://192.168.0.1:3000',
  ];

  for (const url of candidates) {
    try {
      const response = await Promise.race([
        fetch(`${url}/api/server-info`),
        new Promise((_, reject) => setTimeout(() => reject(), 1500))
      ]);
      if (response.ok) {
        console.log(`✅ Found server at: ${url}`);
        return url;
      }
    } catch (e) {}
  }
  
  console.warn('⚠️ Could not auto-detect server. Using default: raspberrypi.local:3000');
  return 'http://raspberrypi.local:3000';
}

function App() {
  const [socket, setSocket] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [classActive, setClassActive] = useState(false);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [pptUrl, setPptUrl] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [className, setClassName] = useState('Class Session');
  const [serverUrl, setServerUrl] = useState('http://raspberrypi.local:3000');

  // Server URL - use env var or auto-detect
  const finalServerUrl = process.env.REACT_APP_SERVER_URL || serverUrl;

  useEffect(() => {
    // Auto-detect server on mount
    detectServerUrl().then(detectedUrl => {
      setServerUrl(detectedUrl);
    });
  }, []);

  useEffect(() => {
    if (!studentInfo) return; // Wait for user to join
    
    // Connect to server
    const connectUrl = process.env.REACT_APP_SERVER_URL || serverUrl;
    console.log(`📡 Connecting to: ${connectUrl}`);
    
    const newSocket = io(connectUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      
      // Emit student-join to register with the class
      newSocket.emit('student-join', {
        student_name: studentInfo.name,
        student_id: studentInfo.id
      });
      console.log(`📨 Sent student-join: ${studentInfo.name}`);
    });

    newSocket.on('poll-received', (poll) => {
      console.log('Poll received:', poll.question);
      setCurrentPoll(poll);
    });

    newSocket.on('poll-closed', (data) => {
      console.log('Poll closed');
      setCurrentPoll(null);
    });

    newSocket.on('ppt-received', (data) => {
      console.log('PPT received:', data.filename);
      const connectUrl = process.env.REACT_APP_SERVER_URL || serverUrl;
      setPptUrl(`${connectUrl}${data.url}`);
    });

    newSocket.on('class-ended', () => {
      console.log('Class ended');
      setClassActive(false);
      setCurrentPoll(null);
      setPptUrl(null);
    });

    newSocket.on('transcription-added', (data) => {
      console.log('Transcription:', data.text);
      setTranscriptions(prev => [...prev, {
        text: data.text,
        timestamp: new Date(data.timestamp)
      }]);
    });

    newSocket.on('class-info', (data) => {
      console.log('Class info received:', data.class_name);
      setClassName(data.class_name);
      setClassActive(true);  // ← Set class as active when info is received
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [studentInfo, serverUrl]);

  const handleJoinClass = (name, studentId, providedServerUrl) => {
    if (providedServerUrl) {
      setServerUrl(providedServerUrl);
    }
    setStudentInfo({ name, id: studentId });
  };

  const handleAnswerPoll = (answer) => {
    if (socket && currentPoll) {
      socket.emit('poll-response', {
        poll_id: currentPoll.poll_id,
        answer: answer
      });
      setCurrentPoll(null); // Hide poll after answering
    }
  };

  if (!studentInfo) {
    return <JoinClass onJoinClass={handleJoinClass} />;
  }

  console.log('App rendering StudentDashboard with className:', className);

  return (
    <StudentDashboard
      studentInfo={studentInfo}
      className={className}
      classActive={classActive}
      currentPoll={currentPoll}
      pptUrl={pptUrl}
      transcriptions={transcriptions}
      onAnswerPoll={handleAnswerPoll}
    />
  );
}

export default App;
