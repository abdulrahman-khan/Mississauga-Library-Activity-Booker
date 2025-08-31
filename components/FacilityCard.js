const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-CA')
}

const renderAvailabilityInfo = (availability, selectedDate) => {
  if (!availability || !availability.body || !availability.body.details) {
    return <div className="availability-placeholder">Click "Search Availability" to see times</div>
  }

  const details = availability.body.details
  const dailyDetails = details.daily_details || []
  
  if (dailyDetails.length === 0) {
    return <div className="no-availability">No availability data</div>
  }

  const dayData = dailyDetails[0]
  const times = dayData.times || []

  if (times.length === 0) {
    return <div className="no-times">No available times</div>
  }

  return (
    <div className="availability-info">
      <div className="date-header">Available times for {formatDate(dayData.date)}</div>
      <div className="time-slots">
        {times.map((time, index) => (
          <div 
            key={index}
            className={`time-slot ${time.status === 'available' ? 'available' : 'unavailable'}`}
          >
            {time.start_time} - {time.end_time}
            {time.price && ` ($${time.price})`}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FacilityCard({ facility, availability, selectedDate }) {
  return (
    <div className="facility-card" data-facility-id={facility.id}>
      <div className="facility-header">
        <h4 className="facility-name">{facility.name}</h4>
        <span className="facility-type">{facility.type_name}</span>
      </div>
      <div className="facility-details">
        <div className="capacity">Capacity: {facility.max_capacity}</div>
        {renderAvailabilityInfo(availability, selectedDate)}
      </div>
    </div>
  )
}