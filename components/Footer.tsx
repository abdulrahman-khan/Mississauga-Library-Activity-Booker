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
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: rgba(255, 255, 255, 0.95);
          padding: 1.5vh 2vw;
          margin-top: auto;
          border-top: 1px solid #e0e0e0;
        }
        
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .credits {
          text-align: center;
        }
        
        .photo-credit {
          font-size: 0.85rem;
          color: #666;
          margin: 0;
        }
        
        .photo-credit a {
          color: #0066cc;
          text-decoration: none;
        }
        
        .photo-credit a:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .footer {
            padding: 1vh 1.5vw;
          }
          
          .photo-credit {
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 480px) {
          .footer {
            padding: 0.8vh 1vw;
          }
          
          .photo-credit {
            font-size: 0.75rem;
            line-height: 1.3;
          }
        }
      `}</style>
    </footer>
  )
}