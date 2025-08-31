import FacilityCard from './FacilityCard'

const groupByCenter = (facilities) => {
  return facilities.reduce((groups, facility) => {
    const center = facility.center_name
    if (!groups[center]) {
      groups[center] = []
    }
    groups[center].push(facility)
    return groups
  }, {})
}

export default function FacilityGrid({ facilities, availabilityData, selectedDate }) {
  if (facilities.length === 0) {
    return (
      <div className="no-results">
        No facilities match your criteria
      </div>
    )
  }

  const groupedFacilities = groupByCenter(facilities)

  return (
    <div className="results">
      {Object.entries(groupedFacilities).map(([centerName, centerFacilities]) => (
        <div key={centerName} className="center-card">
          <h3 className="center-name">{centerName}</h3>
          <div className="facilities-grid">
            {centerFacilities.map(facility => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                availability={availabilityData.get(facility.id)}
                selectedDate={selectedDate}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}