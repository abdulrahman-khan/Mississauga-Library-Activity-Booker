import React from 'react';

interface SchedulerLoadingSpinnerProps {
  message?: string;
}

const SchedulerLoadingSpinner: React.FC<SchedulerLoadingSpinnerProps> = ({
  message = "Loading weekly calendar..."
}) => {
  return (
    <div className="scheduler-loading-container">
      <div className="loading-content">
        <div className="spinner-wrapper">
          <div
            className="spinner"
            role="status"
            aria-label="Loading calendar data"
          />
        </div>
        <div className="loading-message" aria-live="polite">
          {message}
        </div>
        <div className="loading-submessage">
          Fetching availability data for the entire week
        </div>
      </div>

      <style jsx>{`
        .scheduler-loading-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          background: white;
          padding: 40px;
          text-align: center;
          animation: pulse 2s ease-in-out infinite;
        }

        .loading-content {
          max-width: 300px;
          z-index: 1;
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
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { 
            transform: rotate(0deg); 
          }
          100% { 
            transform: rotate(360deg); 
          }
        }

        .loading-message {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .loading-submessage {
          font-size: 14px;
          color: #6c757d;
          line-height: 1.4;
          opacity: 0.85;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
        }

        .scheduler-loading-container::before {
          content: '';
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          max-width: 320px;
          height: 20px;
          background: linear-gradient(
            90deg, 
            #f0f0f0 25%, 
            #e0e0e0 50%, 
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          border-radius: 4px;
          animation: shimmer 2s infinite;
          z-index: 0;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* Accessibility: Respect reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .spinner,
          .scheduler-loading-container,
          .scheduler-loading-container::before {
            animation: none;
          }
          
          .spinner {
            border-top-color: #007bff;
            opacity: 0.8;
          }
        }

        /* Responsive improvements */
        @media (max-width: 480px) {
          .scheduler-loading-container {
            min-height: 300px;
            padding: 24px;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border-width: 3px;
          }
          
          .loading-message {
            font-size: 16px;
          }
          
          .loading-submessage {
            font-size: 13px;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .spinner {
            border-color: #000;
            border-top-color: #007bff;
          }
          
          .loading-message {
            color: #000;
          }
          
          .loading-submessage {
            color: #333;
            opacity: 1;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .scheduler-loading-container {
            background: #1a1a1a;
          }
          
          .spinner {
            border-color: #333;
            border-top-color: #4a9eff;
          }
          
          .loading-message {
            color: #e0e0e0;
          }
          
          .loading-submessage {
            color: #a0a0a0;
          }
          
          .scheduler-loading-container::before {
            background: linear-gradient(
              90deg, 
              #2a2a2a 25%, 
              #3a3a3a 50%, 
              #2a2a2a 75%
            );
          }
        }
      `}</style>
    </div>
  );
};

export default SchedulerLoadingSpinner;