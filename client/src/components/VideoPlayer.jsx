import { useState } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ videoId, title, onClose }) => {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <div className="video-player-overlay" onClick={onClose}>
      <div className="video-player-container" onClick={(e) => e.stopPropagation()}>
        <button className="video-player-close" onClick={onClose}>×</button>
        <div className="video-player-wrapper">
          <iframe
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="video-player-iframe"
          ></iframe>
        </div>
        <h3 className="video-player-title">{title}</h3>
      </div>
    </div>
  );
};

export default VideoPlayer;


