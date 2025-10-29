import React, { useState, useEffect, useRef } from 'react';

function Transcription({ socket, classId }) {
  const [transcriptions, setTranscriptions] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [manualText, setManualText] = useState('');
  const transcriptionRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('transcription-added', (data) => {
      console.log('Transcription received:', data.text);
      setTranscriptions(prev => [...prev, {
        text: data.text,
        timestamp: new Date(data.timestamp)
      }]);
    });

    return () => {
      socket.off('transcription-added');
    };
  }, [socket]);

  useEffect(() => {
    if (transcriptionRef.current) {
      transcriptionRef.current.scrollTop = transcriptionRef.current.scrollHeight;
    }
  }, [transcriptions]);

  const addManualTranscription = () => {
    if (manualText.trim() && socket && classId) {
      socket.emit('add-transcription', {
        text: manualText
      });
      setManualText('');
    }
  };

  const startAudioTranscription = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.language = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      console.log('Recording started...');
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      if (transcript && socket && classId) {
        socket.emit('add-transcription', {
          text: transcript
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      setIsRecording(false);
      console.log('Recording ended');
    };

    recognition.start();
  };

  return (
    <div className="section">
      <h2>Transcription & Audio Notes</h2>

      <div className="form-section">
        <h3>Add Transcription</h3>
        
        <div className="transcription-input">
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Enter transcription text or use voice..."
            rows={3}
          />
          <div className="button-group">
            <button 
              onClick={addManualTranscription}
              className="btn btn-primary"
              disabled={!manualText.trim()}
            >
              Add Text
            </button>
            <button 
              onClick={startAudioTranscription}
              className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`}
            >
              {isRecording ? '🎙️ Recording...' : '🎙️ Record Voice'}
            </button>
          </div>
        </div>
      </div>

      <div className="transcription-history">
        <h3>Transcription History</h3>
        {transcriptions.length === 0 ? (
          <p className="info">No transcriptions yet</p>
        ) : (
          <div className="transcription-list" ref={transcriptionRef}>
            {transcriptions.map((trans, index) => (
              <div key={index} className="transcription-item">
                <span className="time">
                  {trans.timestamp.toLocaleTimeString()}
                </span>
                <p>{trans.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Transcription;
