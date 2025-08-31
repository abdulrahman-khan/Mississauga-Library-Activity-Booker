import { useState, useEffect } from 'react';

const ResourceList = ({ selectedFacility, onResourceSelect, selectedResource }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Extract room name from full facility name (like "room 201" from "Central Library - Meeting Room 201")
  const extractRoomName = (fullName) => {
    if (!fullName) return 'Unknown Room';
    
    // Try to extract room/meeting room number or name
    const patterns = [
      /Meeting Room (\d+)/i,  // "Meeting Room 201" -> "room 201"
      /Room (\d+)/i,          // "Room 201" -> "room 201" 
      /Study Room (\d+)/i,    // "Study Room 1" -> "room 1"
      /Gym ([A-Z])/i,         // "Gym A" -> "room A"
      /Rink - (.+)/i,         // "Rink - Chic Murray" -> "Rink"
    ];
    
    for (const pattern of patterns) {
      const match = fullName.match(pattern);
      if (match) {
        if (pattern.source.includes('Rink')) {
          return 'Rink';
        }
        return `room ${match[1]}`;
      }
    }
    
    // Fallback: just use the last part after the dash
    const parts = fullName.split(' - ');
    if (parts.length > 1) {
      return parts[parts.length - 1].replace(/^(Meeting\s+)?Room\s+/i, 'room ');
    }
    
    return fullName;
  };

  useEffect(() => {
    if (selectedFacility) {
      loadResources(selectedFacility);
    } else {
      setResources([]);
    }
  }, [selectedFacility]);

  const loadResources = async (facilityName) => {
    try {
      setLoading(true);
      setError(null);
      
      let facilitiesData = [];
      
      // Check if electronAPI is available (Electron environment)
      if (window.electronAPI && window.electronAPI.getFacilitiesByCenter) {
        console.log('Loading resources via Electron API...');
        facilitiesData = await window.electronAPI.getFacilitiesByCenter(facilityName);
      } else {
        // Fallback for browser development - load from API route
        console.log('Electron API not available, loading from API route...');
        const response = await fetch('/api/facilities');
        if (response.ok) {
          const allFacilities = await response.json();
          if (allFacilities[facilityName]) {
            facilitiesData = allFacilities[facilityName].facilities || [];
            // Add center_name to each facility
            facilitiesData.forEach(facility => {
              facility.center_name = facilityName;
            });
          }
        } else {
          throw new Error('Failed to fetch facilities data');
        }
      }
      
      console.log('Resources loaded:', facilitiesData);
      setResources(facilitiesData);
    } catch (err) {
      console.error('Error loading resources:', err);
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleResourceClick = (resource) => {
    onResourceSelect(resource);
  };

  if (!selectedFacility) {
    return (
      <div className="resource-list">
        <h3>Resources</h3>
        <div className="no-selection">
          Please select a facility to view resources
        </div>
        
        <style jsx>{`
          .resource-list {
            background: rgba(248, 249, 250, 0.9);
            border: 1px solid #e0e0e0;
            padding: 2vw;
            min-height: calc(100vh - 15vh);
            height: auto;
          }
          
          h3 {
            margin: 0 0 20px 0;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
          }
          
          .no-selection {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            margin-top: 50px;
          }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="resource-list">
        <h3>Resources</h3>
        <div className="loading">Loading resources...</div>
        
        <style jsx>{`
          .resource-list {
            background: rgba(248, 249, 250, 0.9);
            border: 1px solid #e0e0e0;
            padding: 2vw;
            min-height: calc(100vh - 15vh);
            height: auto;
          }
          
          h3 {
            margin: 0 0 20px 0;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
          }
          
          .loading {
            text-align: center;
            color: #6c757d;
            margin-top: 50px;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resource-list">
        <h3>Resources</h3>
        <div className="error-message">{error}</div>
        
        <style jsx>{`
          .resource-list {
            background: rgba(248, 249, 250, 0.9);
            border: 1px solid #e0e0e0;
            padding: 2vw;
            min-height: calc(100vh - 15vh);
            height: auto;
          }
          
          h3 {
            margin: 0 0 20px 0;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
          }
          
          .error-message {
            color: #dc3545;
            text-align: center;
            margin-top: 50px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="resource-list">
      <h3>Resources ({resources.length})</h3>
      
      {resources.length === 0 ? (
        <div className="no-resources">No resources found for this facility</div>
      ) : (
        <div className="resources-container">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className={`resource-item ${selectedResource?.id === resource.id ? 'selected' : ''}`}
              onClick={() => handleResourceClick(resource)}
            >
              <div className="resource-name">{extractRoomName(resource.name)}</div>
              <div className="resource-details">
                <span className="resource-type">{resource.type_name}</span>
                <span className="resource-capacity">Max: {resource.max_capacity}</span>
              </div>
              {resource.no_internet_permits && (
                <div className="no-internet-booking">⚠ No online booking</div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .resource-list {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          height: 600px;
          overflow-y: auto;
        }
        
        h3 {
          margin: 0 0 20px 0;
          color: #333;
          border-bottom: 2px solid #007bff;
          padding-bottom: 10px;
        }
        
        .no-resources {
          text-align: center;
          color: #6c757d;
          font-style: italic;
          margin-top: 50px;
        }
        
        .resources-container {
          space: 10px;
        }
        
        .resource-item {
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid #e9ecef;
          padding: 1.5vh 2vw;
          margin-bottom: 1vh;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .resource-item:hover {
          border-color: #007bff;
          transform: translateY(-1px);
        }
        
        .resource-item.selected {
          border-color: #007bff;
          background-color: #e3f2fd;
        }
        
        .resource-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 1vh;
          font-size: calc(14px + 0.4vw);
        }
        
        .resource-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        
        .resource-type {
          background: #e9ecef;
          color: #495057;
          padding: 4px 8px;
          font-size: calc(10px + 0.3vw);
          font-weight: 500;
        }
        
        .resource-capacity {
          color: #6c757d;
          font-size: calc(12px + 0.3vw);
        }
        
        .no-internet-booking {
          color: #f0ad4e;
          font-size: calc(10px + 0.3vw);
          font-weight: 500;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>
    </div>
  );
};

export default ResourceList;