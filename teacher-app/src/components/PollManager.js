import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function PollManager({ socket, classActive, classId }) {
  const [polls, setPolls] = useState([]);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['Yes', 'No', 'Maybe']);
  const [newOption, setNewOption] = useState('');
  const [results, setResults] = useState({});

  useEffect(() => {
    if (!socket) return;

    socket.on('poll-results-updated', (data) => {
      console.log('Poll results updated:', data);
      setResults(prev => ({
        ...prev,
        [data.poll_id]: data
      }));
    });

    socket.on('poll-final-results', (data) => {
      console.log('Poll final results:', data);
      setResults(prev => ({
        ...prev,
        [data.poll_id]: data
      }));
    });

    return () => {
      socket.off('poll-results-updated');
      socket.off('poll-final-results');
    };
  }, [socket]);

  const addOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption]);
      setNewOption('');
    }
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const createPoll = (e) => {
    e.preventDefault();
    
    if (!question.trim() || options.length < 2) {
      alert('Please enter a question and at least 2 options');
      return;
    }

    if (socket) {
      const pollData = {
        question,
        options
      };
      
      socket.emit('create-poll', pollData);
      setCurrentPoll(pollData);
      
      // Reset form
      setQuestion('');
      setOptions(['Yes', 'No', 'Maybe']);
    }
  };

  const closePoll = (pollId) => {
    if (socket) {
      socket.emit('close-poll', { poll_id: pollId });
      setCurrentPoll(null);
    }
  };

  const pollResult = currentPoll ? results[Object.keys(results).pop()] : null;

  return (
    <div className="section">
      <h2>Poll Management</h2>

      {!classActive && (
        <p className="warning">⚠️ Start a class to create polls</p>
      )}

      {classActive && (
        <>
          <div className="form-section">
            <h3>Create New Poll</h3>
            <form onSubmit={createPoll}>
              <div className="form-group">
                <label>Question:</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What do you want to ask?"
                />
              </div>

              <div className="form-group">
                <label>Options:</label>
                <div className="options-list">
                  {options.map((option, index) => (
                    <div key={index} className="option-item">
                      <span>{option}</span>
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="btn-remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="add-option">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add new option"
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    className="btn btn-secondary"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                Send Poll to Students
              </button>
            </form>
          </div>

          {currentPoll && (
            <div className="poll-results">
              <h3>Active Poll: {currentPoll.question}</h3>
              
              {pollResult && pollResult.results && (
                <div className="chart-container">
                  <Bar
                    data={{
                      labels: pollResult.results.map(r => r.answer),
                      datasets: [
                        {
                          label: 'Responses',
                          data: pollResult.results.map(r => r.count),
                          backgroundColor: '#3498db',
                          borderColor: '#2980b9',
                          borderWidth: 1
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              )}

              <div className="poll-info">
                {pollResult && (
                  <p>Total Responses: <strong>{pollResult.total_responses}</strong></p>
                )}
              </div>

              <button 
                onClick={() => closePoll(currentPoll.id)}
                className="btn btn-warning"
              >
                Close Poll
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PollManager;
