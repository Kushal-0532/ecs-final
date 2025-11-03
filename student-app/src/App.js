import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import JoinClass from './components/JoinClass';
import StudentDashboard from './components/StudentDashboard';

function App() {
  const [socket, setSocket] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [classActive, setClassActive] = useState(false);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [pptUrl, setPptUrl] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);

  // Server URL
  const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';

  useEffect(() => {
    // Connect to server
    const newSocket = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
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
      setPptUrl(`${serverUrl}${data.url}`);
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

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  const handleJoinClass = (name, studentId, serverUrl) => {
    if (socket) {
      socket.disconnect();
    }

    // Reconnect to provided server or use env var
    const connectUrl = serverUrl || process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';
    const newSocket = io(connectUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('student-join', {
        student_name: name,
        student_id: studentId
      });
      setClassActive(true);
    });

    newSocket.on('poll-received', (poll) => {
      console.log('Poll received:', poll.question);
      setCurrentPoll(poll);
    });

    newSocket.on('poll-closed', () => {
      setCurrentPoll(null);
    });

    newSocket.on('ppt-received', (data) => {
      console.log('PPT received:', data.filename);
      setPptUrl(data.url);
    });

    newSocket.on('class-ended', () => {
      setClassActive(false);
      setCurrentPoll(null);
      setPptUrl(null);
    });

    newSocket.on('transcription-added', (data) => {
      setTranscriptions(prev => [...prev, {
        text: data.text,
        timestamp: new Date(data.timestamp)
      }]);
    });

    setSocket(newSocket);
    setStudentInfo({
      name: name,
      id: studentId
    });
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

  return (
    <StudentDashboard
      studentInfo={studentInfo}
      classActive={classActive}
      currentPoll={currentPoll}
      pptUrl={pptUrl}
      transcriptions={transcriptions}
      onAnswerPoll={handleAnswerPoll}
    />
  );
}

export default App;
