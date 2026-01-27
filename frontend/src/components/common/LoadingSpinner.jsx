import React from 'react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p style={{ marginTop: '15px', color: '#666' }}>{text}</p>
    </div>
  );
};

export default LoadingSpinner;
