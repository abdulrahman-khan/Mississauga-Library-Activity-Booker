import React from 'react';

const SchedulerLoadingSpinner = ({ message = "Loading weekly calendar..." }) => {
  return (
    <div className="scheduler-loading-container">
      <div className="loading-content">
        <div className="spinner-wrapper">
          <div className="spinner"></div>
        </div>
        <div className="loading-message">{message}</div>
        <div className="loading-submessage">
          Fetching availability data for the entire week
        </div>
      </div>

      <style jsx>{`
        .scheduler-loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          background: white;
          padding: 40px;
          text-align: center;
        }

        .loading-content {
          max-width: 300px;
        }

        .spinner-wrapper {
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-message {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .loading-submessage {
          font-size: 14px;
          color: #6c757d;
          line-height: 1.4;
        }

        /* Pulse animation for the entire container */
        .scheduler-loading-container {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            opacity: 1;
          }
        }

        /* Calendar skeleton animation */
        .scheduler-loading-container::before {
          content: '';
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 20px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SchedulerLoadingSpinner;