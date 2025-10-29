import React, { useRef, useEffect } from 'react';

function TranscriptionViewer({ transcriptions }) {
  const transcriptionRef = useRef(null);

  useEffect(() => {
    if (transcriptionRef.current) {
      transcriptionRef.current.scrollTop = transcriptionRef.current.scrollHeight;
    }
  }, [transcriptions]);

  if (transcriptions.length === 0) {
    return (
      <div className="transcription-placeholder">
        <p>📝 No notes yet</p>
        <p className="subtitle">Teacher's transcriptions will appear here</p>
      </div>
    );
  }

  return (
    <div className="transcription-viewer" ref={transcriptionRef}>
      {transcriptions.map((trans, index) => (
        <div key={index} className="transcription-note">
          <span className="note-time">
            {trans.timestamp.toLocaleTimeString()}
          </span>
          <p className="note-text">{trans.text}</p>
        </div>
      ))}
    </div>
  );
}

export default TranscriptionViewer;
