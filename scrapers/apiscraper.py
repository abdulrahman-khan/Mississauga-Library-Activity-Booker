"""
Direct API scraper using the discovered endpoint
"""

import requests
import json
from datetime import datetime, timedelta

def get_facility_availability():
    # The API endpoint you discovered
    base_url = "https://anc.ca.apm.activecommunities.com/activemississauga/rest/reservation/resource/availability/daily/2143"
    
    # Calculate date range (adjust as needed)
    start_date = datetime.now().strftime("%Y-%m-%d")
    end_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
    
    # Parameters from the request you found
    params = {
        'start_date': start_date,
        'end_date': end_date,
        'customer_id': '0',
        'company_id': '0',
        'locale': 'en-US',
        'ui_random': str(int(datetime.now().timestamp() * 1000))  # Current timestamp
    }
    
    # Headers to mimic browser request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://anc.ca.apm.activecommunities.com/activemississauga/reservation/landing/search/detail/2143',
        'X-Requested-With': 'XMLHttpRequest'
    }
    
    try:
        print(f"Fetching availability from {start_date} to {end_date}...")
        response = requests.get(base_url, params=params, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            print(f"Error: HTTP {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"Error making request: {e}")
        return None

def parse_timeslots(api_data):
    """
    Parse the API response into the desired JSON structure
    """
    result = {
        "Hazel McCallion Central Library": {
            "Central Library - Meeting Room 201": {}
        }
    }
    
    if not api_data:
        return result
    
    # The exact structure depends on the API response format
    # You'll need to adjust this based on what the actual response looks like
    
    # Common patterns in booking APIs:
    if isinstance(api_data, dict):
        # Pattern 1: dates as keys
        if 'dates' in api_data or 'availability' in api_data:
            availability = api_data.get('dates', api_data.get('availability', {}))
            
            for date_key, slots in availability.items():
                if isinstance(slots, list):
                    times = []
                    for slot in slots:
                        if isinstance(slot, dict):
                            # Extract time from slot object
                            start_time = slot.get('start_time', slot.get('startTime', ''))
                            end_time = slot.get('end_time', slot.get('endTime', ''))
                            if start_time and end_time:
                                times.append(f"{start_time} - {end_time}")
                            elif slot.get('time'):
                                times.append(slot['time'])
                        else:
                            times.append(str(slot))
                    
                    if times:
                        result["Hazel McCallion Central Library"]["Central Library - Meeting Room 201"][date_key] = times
        
        # Pattern 2: array of date objects
        elif isinstance(api_data, list) or 'data' in api_data:
            data_array = api_data if isinstance(api_data, list) else api_data.get('data', [])
            
            for item in data_array:
                if isinstance(item, dict) and 'date' in item:
                    date_str = item['date']
                    times = []
                    
                    # Look for time slots in various possible fields
                    for field in ['slots', 'timeslots', 'times', 'availability']:
                        if field in item:
                            slot_data = item[field]
                            if isinstance(slot_data, list):
                                for slot in slot_data:
                                    if isinstance(slot, str):
                                        times.append(slot)
                                    elif isinstance(slot, dict):
                                        time_str = slot.get('time', slot.get('display', ''))
                                        if time_str:
                                            times.append(time_str)
                            break
                    
                    if times:
                        result["Hazel McCallion Central Library"]["Central Library - Meeting Room 201"][date_str] = times
    
    return result

def main():
    print("Fetching facility availability via direct API call...\n")
    
    # Get data from API
    api_data = get_facility_availability()
    
    if api_data:
        print("API call successful!")
        print(f"Raw response preview: {str(api_data)[:200]}...")
        
        # Save raw response for inspection
        with open("raw_api_response.json", "w") as f:
            json.dump(api_data, f, indent=2)
        print("Raw API response saved to: raw_api_response.json")
        
        # Parse into desired format
        parsed_data = parse_timeslots(api_data)
        
        # Save parsed data
        with open("available_timeslots.json", "w") as f:
            json.dump(parsed_data, f, indent=2)
        
        print("Parsed timeslots saved to: available_timeslots.json")
        
        # Print summary
        facility_data = parsed_data["Hazel McCallion Central Library"]["Central Library - Meeting Room 201"]
        if facility_data:
            print(f"\nFound availability for {len(facility_data)} dates:")
            for date, times in facility_data.items():
                print(f"  {date}: {len(times)} time slots")
        else:
            print("\nNo availability found. Check raw_api_response.json to see the actual API structure.")
    else:
        print("Failed to fetch data from API")

if __name__ == "__main__":
    main()