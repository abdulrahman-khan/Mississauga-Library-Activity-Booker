import { useState, useEffect } from 'react';

const FacilityDropdown = ({ onFacilitySelect, selectedFacility }) => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if electronAPI is available (Electron environment)
      if (window.electronAPI && window.electronAPI.getUniqueCenters) {
        console.log('Loading centers via Electron API...');
        const centersData = await window.electronAPI.getUniqueCenters();
        console.log('Centers loaded:', centersData);
        
        if (!Array.isArray(centersData)) {
          throw new Error('Centers data is not an array: ' + typeof centersData);
        }
        
        setCenters(centersData);
      } else {
        // Fallback for browser development - load directly from JSON
        console.log('Electron API not available, loading from local JSON...');
        const response = await fetch('/api/facilities');
        if (!response.ok) {
          // If API route doesn't exist, use mock data
          console.log('API route not available, using mock data...');
          setCenters([
            'Burnhamthorpe Community Centre',
            'Burnhamthorpe Library', 
            'Hazel McCallion Central Library'
          ]);
        } else {
          const data = await response.json();
          setCenters(Object.keys(data));
        }
      }
    } catch (err) {
      console.error('Error loading centers:', err);
      setError(`Failed to load facility centers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFacilityChange = (event) => {
    const selectedCenter = event.target.value;
    onFacilitySelect(selectedCenter);
  };

  if (loading) {
    return (
      <div className="facility-dropdown">
        <label htmlFor="facility-select">Select Facility:</label>
        <select id="facility-select" disabled>
          <option>Loading facilities...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="facility-dropdown">
        <label htmlFor="facility-select">Select Facility:</label>
        <select id="facility-select" disabled>
          <option>Error loading facilities</option>
        </select>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="facility-dropdown">
      <label htmlFor="facility-select">Select Facility:</label>
      <select 
        id="facility-select" 
        value={selectedFacility || ''} 
        onChange={handleFacilityChange}
      >
        <option value="">Choose a facility...</option>
        {centers.map((center) => (
          <option key={center} value={center}>
            {center}
          </option>
        ))}
      </select>

      <style jsx>{`
        .facility-dropdown {
          margin-bottom: 2vh;
        }
        
        label {
          display: block;
          margin-bottom: 1vh;
          font-weight: 600;
          color: #333;
        }
        
        select {
          width: 100%;
          padding: 1.2vh 1.5vw;
          border: 2px solid #ddd;
          font-size: calc(14px + 0.4vw);
          background-color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: border-color 0.3s ease;
        }
        
        select:hover {
          border-color: #007bff;
        }
        
        select:focus {
          outline: none;
          border-color: #007bff;
        }
        
        select:disabled {
          background-color: rgba(248, 249, 250, 0.9);
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .error-message {
          color: #dc3545;
          font-size: calc(12px + 0.3vw);
          margin-top: 1vh;
        }
      `}</style>
    </div>
  );
};

export default FacilityDropdown;