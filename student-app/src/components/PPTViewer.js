import React from 'react';

function PPTViewer({ url }) {
  if (!url) {
    return (
      <div className="ppt-placeholder">
        <p>No presentation shared yet</p>
      </div>
    );
  }

  // Check if it's an image, PDF or other format
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(url);
  const isPDF = /\.pdf$/i.test(url);

  return (
    <div className="ppt-viewer">
      {isImage && (
        <img src={url} alt="Presentation" className="ppt-image" />
      )}
      {isPDF && (
        <iframe
          src={url}
          title="PDF Presentation"
          className="ppt-iframe"
        />
      )}
      {!isImage && !isPDF && (
        <div className="ppt-placeholder">
          <p>Download: <a href={url} target="_blank" rel="noopener noreferrer">{url}</a></p>
        </div>
      )}
    </div>
  );
}

export default PPTViewer;
