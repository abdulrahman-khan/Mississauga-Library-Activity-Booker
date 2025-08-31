import { useState } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import FacilityDropdown from '../components/FacilityDropdown'
import ResourceList from '../components/ResourceList'
import TimeView from '../components/TimeView'

export default function Home() {
  const [selectedFacility, setSelectedFacility] = useState('')
  const [selectedResource, setSelectedResource] = useState(null)
  const [persistedWeekStart, setPersistedWeekStart] = useState(null)

  const handleFacilitySelect = (facilityName) => {
    setSelectedFacility(facilityName)
    setSelectedResource(null) // Clear selected resource when facility changes
  }

  const handleResourceSelect = (resource) => {
    setSelectedResource(resource)
  }

  return (
    <>
      <Head>
        <title>Facility Availability Checker</title>
        <meta name="description" content="Check facility booking availability in Mississauga" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
      </Head>

      <div className="container">
        <Header />
        
        <div className="main-content">
          <div className="top-section">
            <FacilityDropdown 
              onFacilitySelect={handleFacilitySelect}
              selectedFacility={selectedFacility}
            />
          </div>
          
          <div className="bottom-section">
            <div className="left-panel">
              <ResourceList 
                selectedFacility={selectedFacility}
                onResourceSelect={handleResourceSelect}
                selectedResource={selectedResource}
              />
            </div>
            
            <div className="right-panel">
              <TimeView 
                selectedResource={selectedResource}
                persistedWeekStart={persistedWeekStart}
                onWeekStartChange={setPersistedWeekStart}
              />
            </div>
          </div>
        </div>
        
        <Footer />
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          width: 100vw;
          margin: 0;
          padding: 0;
          background-image: url('/images/franco-debartolo-PtfhoMcNCs0-unsplash.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: scroll;
          display: flex;
          flex-direction: column;
        }
        
        .main-content {
          width: 100%;
          padding: 2vw;
          flex: 1;
          // background: rgba(245, 246, 250, 0.95);
          // backdrop-filter: blur(2px);
        }
        
        .top-section {
          margin-bottom: 2vh;
        }
        
        .bottom-section {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2vw;
          min-height: calc(100vh - 15vh);
        }
        
        .left-panel {
          height: auto;
        }
        
        .right-panel {
          height: auto;
        }
        
        @media (max-width: 1024px) {
          .bottom-section {
            grid-template-columns: 1fr;
            min-height: auto;
            gap: 3vh;
          }
          
          .left-panel,
          .right-panel {
            height: auto;
            min-height: 60vh;
          }
        }
        
        @media (max-width: 768px) {
          .main-content {
            padding: 1.5vh 1.5vw;
          }
          
          .left-panel,
          .right-panel {
            height: auto;
            min-height: 50vh;
          }
          
          .bottom-section {
            gap: 2vh;
          }
        }
        
        @media (max-width: 480px) {
          .main-content {
            padding: 1vh 1vw;
          }
          
          .bottom-section {
            gap: 1.5vh;
          }
        }
      `}</style>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                       Oxygen, Ubuntu, sans-serif;
          background: #f5f6fa;
        }
        
        h1, h2, h3, h4, h5, h6 {
          margin: 0;
          font-weight: 600;
        }
        
        button {
          font-family: inherit;
        }
        
        input, select, textarea {
          font-family: inherit;
        }
      `}</style>
    </>
  )
}