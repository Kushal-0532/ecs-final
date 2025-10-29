import React from 'react';

function PollCard({ poll, onAnswer }) {
  return (
    <div className="poll-card">
      <div className="poll-header">
        <h2>📊 Poll Question</h2>
      </div>

      <div className="poll-question">
        {poll.question}
      </div>

      <div className="poll-options">
        {poll.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswer(option)}
            className="poll-option-btn"
          >
            <span className="option-text">{option}</span>
            <span className="option-indicator">→</span>
          </button>
        ))}
      </div>

      <p className="poll-instruction">
        👆 Tap an option to submit your answer
      </p>
    </div>
  );
}

export default PollCard;
