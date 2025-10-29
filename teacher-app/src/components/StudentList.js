import React from 'react';

function StudentList({ students }) {
  return (
    <div className="section">
      <h2>Connected Students</h2>
      
      {students.length === 0 ? (
        <p className="info">No students connected yet</p>
      ) : (
        <div className="students-grid">
          {students.map((student, index) => (
            <div key={student.id} className="student-card">
              <div className="student-avatar">
                {index + 1}
              </div>
              <div className="student-info">
                <h3>{student.name}</h3>
                <p className="student-id">ID: {student.id}</p>
              </div>
              <div className="student-status">
                <span className="status-dot online"></span> Online
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentList;
