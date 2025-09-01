import { useState, useEffect } from 'react';

/**
 * ResourceList Component
 * 
 * Purpose: Displays a list of bookable resources (rooms/facilities) for the selected facility center
 * 
 * Functionality:
 * - Shows all available resources when a facility center is selected
 * - Each resource displays: cleaned room name, type (e.g., "Gymnasium"), and capacity
 * - Allows user to click on a resource to select it
 * - Highlights the currently selected resource
 * - Triggers TimeView component to show availability when resource is selected
 * 
 * Data Flow:
 * 1. Receives selectedFacility from parent (pages/index.tsx)
 * 2. Calls electronAPI.getFacilitiesByCenter() to get resources for that center
 * 3. Uses extractRoomName() to clean up room names for display
 * 4. When user clicks resource, calls onResourceSelect() to notify parent
 * 5. Parent updates selectedResource state, which updates TimeView
 */

interface Resource {
  id: string;           // Unique resource ID for API calls
  name: string;         // Full facility name from API
  facility_id: string;  // API facility identifier  
  facility_name: string;
  center_name: string;  // Parent facility center name
  type_name?: string;   // Resource type (e.g., "Gymnasium - Full", "Meeting Room")
  max_capacity?: string; // Maximum occupancy
}

interface ResourceListProps {
  selectedFacility: string;                        // Currently selected facility center
  onResourceSelect: (resource: Resource) => void;  // Callback when user selects a resource
  selectedResource: Resource | null;               // Currently selected resource (for highlighting)
}

const ResourceList: React.FC<ResourceListProps> = ({ selectedFacility, onResourceSelect, selectedResource }) => {
  // State management
  const [resources, setResources] = useState<Resource[]>([]);  // Array of available resources
  const [loading, setLoading] = useState<boolean>(false);     // Loading indicator
  const [error, setError] = useState<string | null>(null);    // Error message

  /**
   * extractRoomName - Cleans up facility names for display
   * 
   * Purpose: Converts API facility names into user-friendly room names
   * 
   * Examples:
   * "Burnhamthorpe CC - Meeting Room 1" → "Meeting Room 1"
   * "Burnhamthorpe CC Gym A" → "Gym A" 
   * "Study Room 5" → "Study Room 5"
   * 
   * Features:
   * - Removes facility center prefixes
   * - Standardizes capitalization (Room, Gym, Meeting, etc.)
   * - Handles abbreviations (CC → Community Centre)
   * - Uses regex patterns to match common room types
   */
  const extractRoomName = (fullName: string): string => {
    if (!fullName) return 'Unknown Room';

    const patterns = [
      /Meeting Room (\d+)/i,
      /Room (\d+)/i,
      /Study Room (\d+)/i,
      /Gym ([A-Z])/i,
      /Rink - (.+)/i,
    ];

    for (const pattern of patterns) {
      const match = fullName.match(pattern);
      if (match) {
        if (pattern.source.includes('Rink')) {
          return 'Rink';
        }
        return `Room ${match[1]}`;
      }
    }

    // Handle "CC" (Community Centre) abbreviation and other patterns
    const parts = fullName.split(' - ');
    if (parts.length > 1) {
      let roomName = parts[parts.length - 1];

      // Clean up room name and capitalize properly
      roomName = roomName
        .replace(/^(Meeting\s+)?Room\s+/i, 'Room ')
        .replace(/\bCC\b/g, 'Community Centre')
        .replace(/\bGym\b/gi, 'Gym')
        .replace(/\bRoom\b/gi, 'Room')
        .replace(/\bMeeting\b/gi, 'Meeting')
        .replace(/\bStudy\b/gi, 'Study');

      return roomName;
    }

    // Default fallback - capitalize first letter of each word
    return fullName.replace(/\b\w+/g, word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  };

  // Load resources when selectedFacility changes
  useEffect(() => {
    if (selectedFacility) {
      loadResources(selectedFacility);  // Fetch resources for selected facility center
    } else {
      setResources([]);                 // Clear resources if no facility selected
    }
  }, [selectedFacility]);

  /**
   * loadResources - Fetches all resources for a specific facility center
   * 
   * API Endpoint: electronAPI.getFacilitiesByCenter()
   * Data Source: Filters data/all_facilities.json by center name
   * 
   * @param facilityName - Name of the facility center (e.g., "Burnhamthorpe Community Centre")
   * 
   * Each resource contains:
   * - id: Unique identifier for API calls
   * - name: Full facility name
   * - type_name: Resource type (Gymnasium, Meeting Room, etc.)
   * - max_capacity: Maximum occupancy
   */
  const loadResources = async (facilityName: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (window.electronAPI && window.electronAPI.getFacilitiesByCenter) {
        console.log('Loading resources via Electron API...');
        const response = await window.electronAPI.getFacilitiesByCenter(facilityName);

        if (response.success && Array.isArray(response.data)) {
          setResources(response.data);
        } else {
          throw new Error(response.error || 'Failed to load resources');
        }
      } else {
        console.log('Electron API not available, using fallback data...');
        // Fallback for browser development
        setResources([]);
      }
    } catch (err) {
      console.error('Error loading resources:', err);
      setError(`Failed to load resources: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleResourceClick - Handles when user clicks on a resource item
   * 
   * When user clicks a resource:
   * 1. Calls parent's onResourceSelect callback with the selected resource
   * 2. Parent component (pages/index.tsx) updates selectedResource state  
   * 3. This triggers TimeView component to load availability for the resource
   * 4. The clicked resource gets highlighted (via selectedResource prop)
   */
  const handleResourceClick = (resource: Resource): void => {
    onResourceSelect(resource);  // Notify parent component
  };

  if (!selectedFacility) {
    return (
      <div className="bg-white/90 border border-gray-300 p-4 min-h-[calc(100vh-12rem)] rounded-lg">
        <h3 className="mb-4 text-gray-800 text-lg font-bold">Resources</h3>
        <div className="text-center text-gray-500 italic text-sm py-8">
          Please select a facility to view available resources
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/90 border border-gray-300 p-4 min-h-[calc(100vh-12rem)] rounded-lg">
        <h3 className="mb-4 text-gray-800 text-lg font-bold">Resources</h3>
        <div className="text-center text-blue-600 text-sm py-8">Loading resources...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 border border-gray-300 p-4 min-h-[calc(100vh-12rem)] rounded-lg">
        <h3 className="mb-4 text-gray-800 text-lg font-bold">Resources</h3>
        <div className="bg-red-100 text-red-800 px-4 py-3 border border-red-200 rounded text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 border border-gray-300 p-4 min-h-[calc(100vh-12rem)] rounded-lg flex flex-col">
      <h3 className="mb-4 text-gray-800 text-lg font-bold">Resources ({resources.length})</h3>
      <div className="flex-1 overflow-y-auto">
        {resources.length === 0 ? (
          <div className="text-center text-gray-500 italic text-sm py-8">
            No resources found for this facility
          </div>
        ) : (
          resources.map((resource) => (
            <div
              key={resource.id}
              className={`bg-gray-50 border border-gray-200 mb-2 px-4 py-3 cursor-pointer transition-all duration-200 rounded hover:bg-gray-100 hover:border-blue-500 ${selectedResource?.id === resource.id
                  ? 'bg-blue-50 border-blue-600 shadow-md shadow-blue-100'
                  : ''
                }`}
              onClick={() => handleResourceClick(resource)}
            >
              <div className="text-sm font-semibold text-gray-800 mb-1">
                {extractRoomName(resource.name)}
              </div>
              <div className="flex gap-2 items-center">
                {resource.type_name && (
                  <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                    {resource.type_name}
                  </span>
                )}
                {resource.max_capacity && (
                  <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                    Max: {resource.max_capacity}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ResourceList;