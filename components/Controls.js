import { useState, useEffect } from 'react'

export default function Controls({
  filters,
  facilities,
  onFilterChange,
  onSearch,
  onRefresh,
  onExport,
  loading,
  hasResults
}) {
  const [uniqueCenters, setUniqueCenters] = useState([])

  useEffect(() => {
    if (facilities.length > 0) {
      const centers = new Set()
      facilities.forEach(facility => {
        if (facility.center_name) {
          centers.add(facility.center_name)
        }
      })
      setUniqueCenters(Array.from(centers).sort())
    }
  }, [facilities])

  const handleInputChange = (field, value) => {
    onFilterChange({ [field]: value })
  }

  return (
    <div className="controls">
      <div className="control-group">
        <label htmlFor="facilityType">Facility Type:</label>
        <select
          id="facilityType"
          value={filters.facilityType}
          onChange={(e) => handleInputChange('facilityType', e.target.value)}
        >
          <option value="">All Facilities</option>
          <option value="Library">Libraries</option>
          <option value="Community Centre">Community Centers</option>
          <option value="Gymnasium">Gymnasiums</option>
          <option value="Arena">Arenas</option>
          <option value="Pool">Pools</option>
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="facilityCenter">Center:</label>
        <select
          id="facilityCenter"
          value={filters.facilityCenter}
          onChange={(e) => handleInputChange('facilityCenter', e.target.value)}
        >
          <option value="">All Centers</option>
          {uniqueCenters.map(center => (
            <option key={center} value={center}>{center}</option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="bookingDate">Date:</label>
        <input
          type="date"
          id="bookingDate"
          value={filters.date}
          onChange={(e) => handleInputChange('date', e.target.value)}
        />
      </div>

      <div className="control-group">
        <button 
          className="btn btn-primary" 
          onClick={onSearch}
          disabled={loading}
        >
          Search Availability
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={onRefresh}
          disabled={loading}
        >
          Refresh Data
        </button>
      </div>

      <div className="export-controls">
        <button 
          className="btn btn-export" 
          onClick={onExport}
          disabled={!hasResults || loading}
        >
          Export Results
        </button>
      </div>
    </div>
  )
}