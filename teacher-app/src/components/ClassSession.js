import React, { useState } from 'react';

function ClassSession({ classActive, onStartClass, onEndClass, classId, socket }) {
  const [className, setClassName] = useState('Math Class 101');
  const [pptFile, setPptFile] = useState(null);

  const handleStartClass = (e) => {
    e.preventDefault();
    onStartClass(className);
  };

  const handlePPTUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3000/api/upload-ppt', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('PPT uploaded:', data);

      setPptFile({
        name: file.name,
        url: data.path
      });

      // Notify students about new PPT
      if (socket) {
        socket.emit('share-ppt', {
          filename: data.filename
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload PPT');
    }
  };

  return (
    <div className="section">
      <h2>Class Session Management</h2>

      {!classActive ? (
        <div className="form-section">
          <h3>Start New Class</h3>
          <form onSubmit={handleStartClass}>
            <div className="form-group">
              <label>Class Name:</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Enter class name"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Start Class
            </button>
          </form>
        </div>
      ) : (
        <div className="active-session">
          <h3>Active Session: {className}</h3>
          <p>Class ID: <code>{classId}</code></p>

          <div className="form-section">
            <h3>Share Presentation</h3>
            <div className="form-group">
              <label>Upload PPT/PDF:</label>
              <input
                type="file"
                onChange={handlePPTUpload}
                accept=".ppt,.pptx,.pdf"
              />
            </div>

            {pptFile && (
              <div className="ppt-info">
                <p>✓ Shared: <strong>{pptFile.name}</strong></p>
              </div>
            )}
          </div>

          <div className="actions">
            <button onClick={onEndClass} className="btn btn-danger">
              End Class
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassSession;
