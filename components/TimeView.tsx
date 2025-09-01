/**
 * TimeView Component
 * 
 * Purpose: Displays weekly availability calendar for the selected resource
 * 
 * Functionality:
 * - Shows a weekly calendar view using react-big-calendar
 * - Displays available time slots as green events ("Available")
 * - Shows "Book This Resource" button that opens booking site in browser
 * - Allows navigation between weeks with persistent week state
 * - Logs slot selection to console (popups were removed per user request)
 * 
 * Data Flow:
 * 1. Receives selectedResource from parent (pages/index.tsx)
 * 2. Calls electronAPI.getFacilityWeeklyAvailability() for the resource
 * 3. Processes API response to create calendar events
 * 4. Displays green blocks for available time slots
 * 5. "Book This Resource" opens external booking URL via electronAPI.openExternal()
 * 
 * Calendar Features:
 * - Week view only (no month/day views)
 * - Business hours: 6 AM to 10 PM  
 * - 30-minute time slot intervals
 * - Weekend display enabled
 */

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import SchedulerLoadingSpinner from './SchedulerLoadingSpinner';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Initialize the localizer for react-big-calendar with moment.js
const localizer = momentLocalizer(moment);

// Type definitions for API data structures and component props
interface Resource {
  id: string;
  name: string;
  type_name: string;
  max_capacity: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface DailyDetail {
  date: string;
  times: TimeSlot[];
}

interface WeeklyData {
  body: {
    details: {
      daily_details: DailyDetail[];
    };
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: string;
  style?: {
    backgroundColor: string;
    color: string;
    border: string;
  };
}

interface TimeViewProps {
  selectedResource: Resource | null;
  persistedWeekStart: Date | null;
  onWeekStartChange: (date: Date) => void;
}

const TimeView: React.FC<TimeViewProps> = ({ selectedResource, persistedWeekStart, onWeekStartChange }) => {
  // Component state management
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);    // Raw API response data
  const [loading, setLoading] = useState<boolean>(false);                  // Loading indicator
  const [error, setError] = useState<string | null>(null);                 // Error messages
  const [events, setEvents] = useState<CalendarEvent[]>([]);               // Processed calendar events
  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null); // Currently displayed week

  // Calculate current week start (Monday) and end (Sunday)
  const getWeekRange = (date = new Date()) => {
    const current = new Date(date);
    const dayOfWeek = current.getDay();
    const monday = new Date(current);
    monday.setDate(current.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
      monday: monday
    };
  };

  // Auto-fetch weekly availability when resource is selected
  useEffect(() => {
    if (selectedResource) {
      // Use persisted week start if available, otherwise default to current week
      const targetDate = persistedWeekStart || new Date();
      const weekRange = getWeekRange(targetDate);
      setCurrentWeekStart(weekRange.monday);
      fetchWeeklyAvailability(weekRange.start, weekRange.end);
    } else {
      setWeeklyData(null);
      setEvents([]);
      setError(null);
    }
  }, [selectedResource, persistedWeekStart]);

  // Fetch weekly availability data
  const fetchWeeklyAvailability = async (startDate: string, endDate: string): Promise<void> => {
    if (!selectedResource) return;

    try {
      setLoading(true);
      setError(null);
      
      let weeklyData: WeeklyData | null = null;
      
      // Check if electronAPI is available (Electron environment)
      if (window.electronAPI && window.electronAPI.getFacilityWeeklyAvailability) {
        console.log('Loading weekly availability via Electron API...');
        const response = await window.electronAPI.getFacilityWeeklyAvailability(
          selectedResource.id,
          startDate,
          endDate
        );
        
        if (response.success) {
          weeklyData = response.data;
        } else {
          throw new Error(response.error || 'Failed to fetch data');
        }
      } else {
        // Fallback for browser development - use API route
        console.log('Electron API not available, using API route for weekly availability...');
        try {
          const response = await fetch(`/api/weekly-availability?facilityId=${selectedResource.id}&startDate=${startDate}&endDate=${endDate}`);
          if (response.ok) {
            weeklyData = await response.json();
          } else {
            throw new Error('API route failed, using local mock data');
          }
        } catch (apiError) {
          console.log('API route failed, falling back to local mock data');
          weeklyData = generateMockWeeklyData(startDate, endDate);
        }
      }
      
      setWeeklyData(weeklyData);
      if (weeklyData) {
        const calendarEvents = convertToBigCalendarEvents(weeklyData, startDate, endDate);
        setEvents(calendarEvents);
      }
    } catch (err) {
      console.error('Error fetching weekly availability:', err);
      setError('Failed to fetch weekly availability data');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock weekly data for browser development
  const generateMockWeeklyData = (startDate: string, endDate: string): WeeklyData => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dailyDetails: DailyDetail[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      
      // Mock some booked times for demonstration
      const mockTimes: TimeSlot[] = [];
      
      // Add some random booked slots
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Weekdays
        mockTimes.push({ start_time: '09:00:00', end_time: '10:30:00' });
        mockTimes.push({ start_time: '14:00:00', end_time: '16:00:00' });
        if (Math.random() > 0.5) {
          mockTimes.push({ start_time: '18:30:00', end_time: '20:00:00' });
        }
      } else { // Weekends
        if (Math.random() > 0.3) {
          mockTimes.push({ start_time: '10:00:00', end_time: '12:00:00' });
        }
      }
      
      dailyDetails.push({
        date: dateString,
        times: mockTimes
      });
    }
    
    return {
      body: {
        details: {
          daily_details: dailyDetails
        }
      }
    };
  };

  // Convert API data to BigCalendar events format
  const convertToBigCalendarEvents = (apiData: WeeklyData, startDate: string, endDate: string): CalendarEvent[] => {
    if (!apiData || !apiData.body || !apiData.body.details || !apiData.body.details.daily_details) {
      return [];
    }

    const events: CalendarEvent[] = [];
    const dailyDetails = apiData.body.details.daily_details;
    
    dailyDetails.forEach((dayData, dayIndex) => {
      if (!dayData.times || !Array.isArray(dayData.times)) return;
      
      dayData.times.forEach((timeSlot, timeIndex) => {
        if (!timeSlot.start_time || !timeSlot.end_time) return;
        
        const eventDate = dayData.date;
        const startDateTime = `${eventDate}T${timeSlot.start_time}`;
        const endDateTime = `${eventDate}T${timeSlot.end_time}`;
        
        events.push({
          id: `booked_${dayIndex}_${timeIndex}`,
          title: 'BOOKED',
          start: new Date(startDateTime),
          end: new Date(endDateTime),
          resource: selectedResource?.id,
          style: {
            backgroundColor: '#dc3545',
            color: '#ffffff',
            border: '1px solid #dc3545'
          }
        });
      });
    });
    
    console.log(`Converted ${events.length} booked time slots to BigCalendar events`);
    return events;
  };

  // Handle drag selection to view available times - POPUP REMOVED
  const handleSelectSlot = (slotInfo: SlotInfo): void => {
    try {
      console.log('User selected time slot:', slotInfo);
      
      // slotInfo contains: { start, end, action, bounds, box, resourceId }
      const { start, end } = slotInfo;
      
      // Check if the selected time overlaps with any booked events
      const isBooked = events.some(event => {
        const eventStart = moment(event.start);
        const eventEnd = moment(event.end);
        const selectedStart = moment(start);
        const selectedEnd = moment(end);
        
        return selectedStart.isBefore(eventEnd) && selectedEnd.isAfter(eventStart);
      });
      
      // Log the selection but don't show popup
      if (isBooked) {
        console.log(`Time slot is booked: ${moment(start).format('MM/DD/YYYY h:mm A')} - ${moment(end).format('h:mm A')}`);
      } else {
        console.log(`Time slot appears available: ${moment(start).format('MM/DD/YYYY h:mm A')} - ${moment(end).format('h:mm A')}`);
      }
    } catch (error) {
      console.error('Error handling slot selection:', error);
    }
  };

  // Navigate to different weeks
  const handleWeekNavigation = (newDate: Date): void => {
    const weekRange = getWeekRange(newDate);
    setCurrentWeekStart(weekRange.monday);
    // Persist the selected week start
    if (onWeekStartChange) {
      onWeekStartChange(weekRange.monday);
    }
    fetchWeeklyAvailability(weekRange.start, weekRange.end);
  };

  if (!selectedResource) {
    return (
      <div className="time-view">
        <h3>Weekly Calendar</h3>
        <div className="no-resource">
          Please select a resource to view the weekly booking calendar
        </div>
        
        <style jsx>{`
          .time-view {
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            min-height: calc(100vh - 200px);
              display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          h3 {
            margin: 0 0 20px 0;
            color: #333;
            font-size: 24px;
            font-weight: bold;
          }
          
          .no-resource {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            font-size: 16px;
          }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return <SchedulerLoadingSpinner message="Loading weekly calendar..." />;
  }

  if (error) {
    return (
      <div className="time-view">
        <div className="resource-header">
          <h3>{selectedResource.name}</h3>
          <div className="resource-meta">
            <span className="resource-type">{selectedResource.type_name}</span>
            <span className="resource-capacity">Max: {selectedResource.max_capacity}</span>
          </div>
        </div>
        <div className="error-message">{error}</div>
        <button onClick={() => {
          const range = getWeekRange();
          fetchWeeklyAvailability(range.start, range.end);
        }}>
          Retry Loading Calendar
        </button>
        
        <style jsx>{`
          .time-view {
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            min-height: calc(100vh - 200px);
            }
          
          .resource-header {
            border-bottom: 3px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          
          .resource-header h3 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 20px;
            font-weight: bold;
          }
          
          .resource-meta {
            display: flex;
            gap: 15px;
            align-items: center;
          }
          
          .resource-type {
            background: #007bff;
            color: white;
            padding: 0.5vh 1vw;
            font-size: calc(10px + 0.3vw);
            font-weight: 500;
          }
          
          .resource-capacity {
            color: #6c757d;
            font-size: calc(12px + 0.3vw);
            font-weight: 500;
          }
          
          .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid #f5c6cb;
            font-weight: 500;
          }
          
          button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-size: calc(12px + 0.3vw);
            font-weight: 500;
          }
          
          button:hover {
            background: #0056b3;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="time-view">
      <div className="resource-header">
        <h3>{selectedResource.name}</h3>
        <div className="resource-meta">
          <span className="resource-type">{selectedResource.type_name}</span>
          <span className="resource-capacity">Max: {selectedResource.max_capacity}</span>
          <span className="events-count">{events.length} booked slots this week</span>
        </div>
      </div>

      {selectedResource && (
        <div className="booking-section">
          <button 
            className="book-resource-button"
            onClick={() => {
              const url = `https://anc.ca.apm.activecommunities.com/activemississauga/reservation/landing/search/detail/${selectedResource.id}`;
              if (window.electronAPI && window.electronAPI.openExternal) {
                window.electronAPI.openExternal(url);
              } else {
                window.open(url, '_blank');
              }
            }}
          >
            Book This Resource
          </button>
        </div>
      )}

      <div className="scheduler-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view="week"
          views={['week']}
          date={currentWeekStart || new Date()}
          onNavigate={handleWeekNavigation}
          onDrillDown={() => {}} 
          selectable={true}
          onSelectSlot={handleSelectSlot}
          longPressThreshold={10}
          min={new Date(1970, 1, 1, 6, 0, 0)}
          max={new Date(1970, 1, 1, 23, 0, 0)}
          step={30}
          timeslots={2}
          eventPropGetter={(event) => ({
            style: event.style || {
              backgroundColor: '#dc3545',
              color: '#ffffff',
              border: '1px solid #dc3545',
              fontSize: '12px',
              fontWeight: '600'
            }
          })}
          formats={{
            timeGutterFormat: 'h:mm A',
            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
              localizer.format(start, 'h:mm A', culture) + ' - ' +
              localizer.format(end, 'h:mm A', culture)
          }}
          components={{
            event: ({ event }) => (
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {event.title}
              </div>
            ),
            toolbar: ({ date, onNavigate }) => (
              <div className="custom-toolbar">
                <button 
                  className="nav-button prev-button"
                  onClick={() => onNavigate('PREV')}
                  title="Previous Week"
                >
                  &#8592; Previous Week
                </button>
                <span className="current-date">
                  {moment(date).format('MMMM YYYY')}
                </span>
                <button 
                  className="nav-button next-button"
                  onClick={() => onNavigate('NEXT')}
                  title="Next Week"
                >
                  Next Week &#8594;
                </button>
              </div>
            )
          }}
        />
      </div>

      <style jsx>{`
        .time-view {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e0e0e0;
          padding: 2vw;
          min-height: calc(100vh - 15vh);
          display: flex;
          flex-direction: column;
        }
        
        .resource-header {
          border-bottom: 3px solid #333;
          padding-bottom: 1.5vh;
          margin-bottom: 2vh;
          flex-shrink: 0;
        }
        
        .resource-header h3 {
          margin: 0 0 1vh 0;
          color: #333;
          font-size: calc(18px + 0.5vw);
          font-weight: bold;
        }
        
        .resource-meta {
          display: flex;
          gap: 1.5vw;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .resource-type {
          background: #007bff;
          color: white;
          padding: 0.5vh 1vw;
          border-radius: 4px;
          font-size: calc(10px + 0.3vw);
          font-weight: 500;
        }
        
        .resource-capacity {
          background: #28a745;
          color: white;
          padding: 0.5vh 1vw;
          border-radius: 4px;
          font-size: calc(10px + 0.3vw);
          font-weight: 500;
        }
        
        .events-count {
          background: #dc3545;
          color: white;
          padding: 0.5vh 1vw;
          border-radius: 4px;
          font-size: calc(10px + 0.3vw);
          font-weight: 500;
        }
        
        .scheduler-container {
          flex: 1;
          overflow: hidden;
          border: 1px solid #e0e0e0;
          min-height: calc(100vh - 320px);
        }
        
        .custom-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5vh 2vw;
          background: rgba(248, 249, 250, 0.9);
          border-bottom: 1px solid #e0e0e0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                       Oxygen, Ubuntu, sans-serif;
        }
        
        .nav-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 1vh 2vw;
          cursor: pointer;
          font-size: calc(12px + 0.5vw);
          font-weight: 500;
          transition: background-color 0.2s ease;
          min-width: 12vw;
        }
        
        .nav-button:hover {
          background: #0056b3;
        }
        
        .prev-button {
          text-align: left;
        }
        
        .next-button {
          text-align: right;
        }
        
        .current-date {
          font-size: calc(16px + 0.5vw);
          font-weight: 600;
          color: #333;
          text-align: center;
          flex: 1;
        }
        
        .booking-section {
          margin-bottom: 2vh;
          text-align: center;
        }
        
        .book-resource-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 1.2vh 3vw;
          cursor: pointer;
          font-size: calc(14px + 0.5vw);
          font-weight: 600;
          transition: background-color 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .book-resource-button:hover {
          background: #218838;
        }
        
        /* Global BigCalendar styling */
        :global(.rbc-calendar) {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                       Oxygen, Ubuntu, sans-serif !important;
          height: 100% !important;
          background: rgba(255, 255, 255, 0.9) !important;
        }
        
        :global(.rbc-time-view) {
          border: none !important;
          background: rgba(255, 255, 255, 0.9) !important;
        }
        
        :global(.rbc-time-header) {
          border-bottom: 1px solid #e0e0e0 !important;
          background: rgba(255, 255, 255, 0.9) !important;
        }
        
        :global(.rbc-time-content) {
          border-top: none !important;
          background: rgba(255, 255, 255, 0.9) !important;
        }
        
        :global(.rbc-time-slot) {
          border-top: 1px solid #f0f0f0 !important;
        }
        
        :global(.rbc-timeslot-group) {
          border-bottom: 1px solid #e0e0e0 !important;
        }
        
        :global(.rbc-event) {
          font-size: 12px !important;
          font-weight: 600 !important;
          border: 1px solid #dc3545 !important;
          cursor: not-allowed !important;
        }
        
        :global(.rbc-time-slot:hover) {
          background-color: #f8f9fa !important;
        }
        
        :global(.rbc-day-slot .rbc-time-slot) {
          border-top: 1px solid #f0f0f0 !important;
        }
        
        :global(.rbc-header) {
          border-bottom: 1px solid #e0e0e0 !important;
          padding: 1vh 0.5vw !important;
          font-weight: 600 !important;
          background-color: rgba(248, 249, 250, 0.9) !important;
        }
        
        :global(.rbc-time-gutter .rbc-timeslot-group) {
          border-bottom: 1px solid #e0e0e0 !important;
        }
        
        :global(.rbc-time-gutter-cell) {
          text-align: center !important;
          font-size: 12px !important;
          color: #666 !important;
        }
      `}</style>
    </div>
  );
};

export default TimeView;