export default function handler(req, res) {
  const { facilityId, startDate, endDate } = req.query;

  if (!facilityId || !startDate || !endDate) {
    return res.status(400).json({ 
      error: 'Missing required parameters: facilityId, startDate, endDate' 
    });
  }

  try {
    // Generate mock weekly data for browser development
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dailyDetails = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      
      // Mock some booked times for demonstration
      const mockTimes = [];
      
      // Add some realistic booked slots
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Weekdays
        mockTimes.push({ start_time: '09:00:00', end_time: '10:30:00' });
        mockTimes.push({ start_time: '14:00:00', end_time: '16:00:00' });
        if (Math.random() > 0.4) {
          mockTimes.push({ start_time: '18:30:00', end_time: '20:00:00' });
        }
        if (Math.random() > 0.7) {
          mockTimes.push({ start_time: '11:00:00', end_time: '12:00:00' });
        }
      } else { // Weekends
        if (Math.random() > 0.3) {
          mockTimes.push({ start_time: '10:00:00', end_time: '12:00:00' });
        }
        if (Math.random() > 0.6) {
          mockTimes.push({ start_time: '15:00:00', end_time: '17:00:00' });
        }
      }
      
      dailyDetails.push({
        date: dateString,
        times: mockTimes
      });
    }
    
    const mockData = {
      body: {
        details: {
          daily_details: dailyDetails
        }
      }
    };

    console.log(`Mock weekly availability generated for facility ${facilityId} from ${startDate} to ${endDate}`);
    res.status(200).json(mockData);
  } catch (error) {
    console.error('Error generating mock weekly availability:', error);
    res.status(500).json({ error: 'Failed to generate mock availability data' });
  }
}