export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="credits">
          <p className="photo-credit">
            Photo by{' '}
            <a 
              href="https://unsplash.com/@francotheshooter?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
              target="_blank"
              rel="noopener noreferrer"
            >
              Franco Debartolo
            </a>{' '}
            on{' '}
            <a 
              href="https://unsplash.com/photos/black-and-white-high-rise-building-PtfhoMcNCs0?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
              target="_blank"
              rel="noopener noreferrer"
            >
              Unsplash
            </a>
          </p>
          <p className="developer-credit">
            Developed by Abdulrahman Khan
          </p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: rgba(0, 0, 0, 0.8);
          color: #ffffff;
          padding: 2vh 2vw;
          margin-top: auto;
          backdrop-filter: blur(5px);
        }
        
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }
        
        .credits p {
          margin: 0.5vh 0;
          font-size: calc(12px + 0.2vw);
          line-height: 1.4;
        }
        
        .photo-credit {
          opacity: 0.8;
        }
        
        .developer-credit {
          font-weight: 600;
          color: #ffffff;
        }
        
        .footer a {
          color: #60a5fa;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .footer a:hover {
          color: #93c5fd;
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .footer {
            padding: 1.5vh 1.5vw;
          }
          
          .credits p {
            font-size: calc(10px + 0.3vw);
          }
        }
      `}</style>
    </footer>
  );
}