import React, { useState } from 'react';

function JoinClass({ onJoinClass }) {
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState(`student-${Math.random().toString(36).substr(2, 9)}`);
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [error, setError] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    
    if (!studentName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!serverUrl.trim()) {
      setError('Please enter server URL');
      return;
    }

    setError('');
    onJoinClass(studentName, studentId, serverUrl);
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <div className="join-header">
          <h1>📚 Classroom Session</h1>
          <p>Join your teacher's class</p>
        </div>

        <form onSubmit={handleJoin} className="join-form">
          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Student ID</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Student ID"
              className="form-input"
            />
            <small>Auto-generated, you can change it</small>
          </div>

          <div className="form-group">
            <label>Server URL *</label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://raspberry-pi.local:3000"
              className="form-input"
            />
            <small>IP or hostname of the Raspberry Pi server</small>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="btn-join">
            Join Class
          </button>
        </form>

        <div className="join-footer">
          <p>💡 Tip: Ask your teacher for the server address</p>
        </div>
      </div>
    </div>
  );
}

export default JoinClass;
