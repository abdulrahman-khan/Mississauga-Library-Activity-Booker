export default function Header() {
  return (
    <header className="header">
      <h1>Facility Availability Checker</h1>
      <p>Check availability for community centers, libraries, and recreational facilities</p>
      
      <style jsx>{`
        .header {
          text-align: center;
          padding: 2vh 2vw;
          background: rgba(255, 255, 255, 0.95);
          margin-bottom: 2vh;
        }
        
        h1 {
          font-size: calc(24px + 1vw);
          color: #333;
          margin: 0 0 1vh 0;
          font-weight: 700;
        }
        
        p {
          font-size: calc(12px + 0.5vw);
          color: #666;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .header {
            padding: 1.5vh 1.5vw;
          }
          
          h1 {
            font-size: calc(20px + 1.5vw);
          }
          
          p {
            font-size: calc(11px + 0.8vw);
          }
        }
        
        @media (max-width: 480px) {
          .header {
            padding: 1vh 1vw;
          }
        }
      `}</style>
    </header>
  )
}