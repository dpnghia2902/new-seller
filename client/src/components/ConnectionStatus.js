import React from 'react';
import { useSocket } from '../context/SocketContext';
import './ConnectionStatus.css';

const ConnectionStatus = () => {
  const { isConnected, connectionError } = useSocket();

  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <div className="connection-status">
      {connectionError ? (
        <div className="connection-error">
          <span className="status-dot error"></span>
          <span>Connection error: {connectionError}</span>
        </div>
      ) : (
        <div className="connection-reconnecting">
          <span className="status-dot reconnecting"></span>
          <span>Reconnecting...</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
