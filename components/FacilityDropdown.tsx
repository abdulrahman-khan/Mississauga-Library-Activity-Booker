import { useState, useEffect } from 'react';

/**
 * FacilityDropdown Component
 * 
 * Purpose: Displays a dropdown menu with available facility centers (e.g., Community Centres, Libraries)
 * 
 * Functionality:
 * - Loads unique center names from the API on component mount
 * - Displays loading state while fetching data
 * - Shows error message if loading fails
 * - Allows user to select a facility center
 * - Notifies parent component when selection changes
 * 
 * Data Flow:
 * 1. Calls electronAPI.getUniqueCenters() to get list of centers
 * 2. Populates dropdown with center names
 * 3. When user selects, calls onFacilitySelect() to notify parent
 * 4. Parent component (pages/index.tsx) updates selectedFacility state
 */

interface FacilityDropdownProps {
  onFacilitySelect: (facilityName: string) => void;  // Callback when user selects a facility
  selectedFacility: string;                          // Currently selected facility name
}

const FacilityDropdown: React.FC<FacilityDropdownProps> = ({ onFacilitySelect, selectedFacility }) => {
  // State management
  const [centers, setCenters] = useState<string[]>([]);    // Array of facility center names
  const [loading, setLoading] = useState<boolean>(true);   // Loading indicator
  const [error, setError] = useState<string | null>(null); // Error message if API fails

  // Load centers when component mounts
  useEffect(() => {
    loadCenters();
  }, []);

  /**
   * loadCenters - Fetches unique facility centers from the API
   * 
   * API Endpoint: electronAPI.getUniqueCenters()
   * Data Source: data/all_facilities.json (processed by ApiService.ts)
   * 
   * Error Handling: Falls back to mock data if API fails
   */
  const loadCenters = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Check if electronAPI is available (Electron environment)
      if (window.electronAPI && window.electronAPI.getUniqueCenters) {
        console.log('Loading centers via Electron API...');
        const response = await window.electronAPI.getUniqueCenters();
        console.log('Centers response:', response);

        if (response.success && Array.isArray(response.data)) {
          setCenters(response.data);
        } else {
          throw new Error(response.error || 'Failed to load centers');
        }
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
      setError(`Failed to load facility centers: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleFacilityChange - Handles dropdown selection change
   * 
   * When user selects a facility center:
   * 1. Gets the selected value from the dropdown
   * 2. Calls parent's onFacilitySelect callback
   * 3. Parent component updates selectedFacility state
   * 4. This triggers ResourceList component to load facilities for the selected center
   */
  const handleFacilityChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedCenter = event.target.value;
    onFacilitySelect(selectedCenter);  // Notify parent component
  };

  if (loading) {
    return (
      <div className="mb-4">
        <label htmlFor="facility-select" className="block mb-2 text-sm font-semibold text-gray-700">
          Select Facility:
        </label>
        <select
          id="facility-select"
          disabled
          className="w-full px-3 py-2 text-sm border border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
        >
          <option>Loading facilities...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4">
        <label htmlFor="facility-select" className="block mb-2 text-sm font-semibold text-gray-700">
          Select Facility:
        </label>
        <select
          id="facility-select"
          disabled
          className="w-full px-3 py-2 text-sm border border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
        >
          <option>Error loading facilities</option>
        </select>
        <div className="mt-2 text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label htmlFor="facility-select" className="block mb-2 text-sm font-semibold text-gray-700">
        Select Facility:
      </label>
      <select
        id="facility-select"
        value={selectedFacility || ''}
        onChange={handleFacilityChange}
        className="w-full px-3 py-2 text-sm border border-gray-300  bg-white/90 cursor-pointer hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      >
        <option value="">Choose a facility...</option>
        {centers.map((center) => (
          <option key={center} value={center}>
            {center}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FacilityDropdown;