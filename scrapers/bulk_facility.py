"""
Complete facility discovery using Mississauga's API endpoints
"""

import requests
import json
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

def get_all_facilities():
    """
    Get list of all facilities from the main resource endpoint
    """
    url = "https://anc.ca.apm.activecommunities.com/activemississauga/rest/reservation/resource"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0',
        'Accept': '*/*',
        'Accept-Language': 'en-CA,en-US;q=0.7,en;q=0.3',
        'Content-Type': 'application/json;charset=utf-8',
        'X-Requested-With': 'XMLHttpRequest',
        'page_info': '{"page_number":1,"total_records_per_page":20}',
        'Origin': 'https://anc.ca.apm.activecommunities.com',
        'Referer': 'https://anc.ca.apm.activecommunities.com/activemississauga/reservation/landing/search?reservationGroupIds=7'
    }
    
    params = {
        'locale': 'en-US'
    }
    
    # POST body - you'll need to check what was in the request payload
    # Common patterns for facility search:
    payload_options = [
        {},  # Empty body
        {"search": ""},  # Empty search
        {"reservationGroupIds": [7]},  # From the referer URL
        {"page": 1, "limit": 100},  # Pagination
        {"filters": {}},  # Empty filters
    ]
    
    for i, payload in enumerate(payload_options):
        try:
            print(f"Trying payload option {i+1}: {payload}")
            response = requests.post(url, params=params, headers=headers, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"Success! Got {len(str(data))} characters of data")
                return data
            else:
                print(f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            print(f"Error with payload {i+1}: {e}")
    
    return None

def get_facility_availability(facility_id, start_date=None, end_date=None):
    """
    Get availability data for a specific facility
    """
    if not start_date:
        start_date = datetime.now().strftime("%Y-%m-%d")
    if not end_date:
        end_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
    
    url = f"https://anc.ca.apm.activecommunities.com/activemississauga/rest/reservation/resource/availability/daily/{facility_id}"
    
    params = {
        'start_date': start_date,
        'end_date': end_date,
        'customer_id': '0',
        'company_id': '0',
        'locale': 'en-US',
        'ui_random': str(int(datetime.now().timestamp() * 1000))
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': f'https://anc.ca.apm.activecommunities.com/activemississauga/reservation/landing/search/detail/{facility_id}',
        'X-Requested-With': 'XMLHttpRequest'
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            return None
            
    except Exception as e:
        return None

def parse_facility_list(api_response):
    """
    Parse the facility list response to extract facility IDs and names
    """
    facilities = []
    
    if not api_response:
        return facilities
    
    # Handle different possible response structures
    data = api_response
    
    # Common patterns in facility APIs
    if isinstance(data, dict):
        # Look for common keys
        for key in ['resources', 'facilities', 'data', 'results', 'items']:
            if key in data:
                data = data[key]
                break
    
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                facility_id = item.get('id', item.get('resourceId', item.get('facilityId')))
                facility_name = (item.get('name') or 
                               item.get('title') or 
                               item.get('resourceName') or 
                               item.get('facilityName') or
                               item.get('description'))
                
                if facility_id and facility_name:
                    facilities.append({
                        'id': facility_id,
                        'name': facility_name,
                        'raw_data': item
                    })
    
    return facilities

def check_facility_availability(facility):
    """
    Check availability for a single facility
    """
    facility_id = facility['id']
    facility_name = facility['name']
    
    print(f"Checking {facility_name} (ID: {facility_id})...")
    
    # Get availability data
    availability_data = get_facility_availability(facility_id)
    
    if availability_data:
        # Parse time slots (simplified - adjust based on actual API response)
        time_slots = {}
        
        # This will depend on the actual API response structure
        if isinstance(availability_data, dict):
            for date_key, slots in availability_data.items():
                if isinstance(slots, list) and slots:
                    times = []
                    for slot in slots:
                        if isinstance(slot, str):
                            times.append(slot)
                        elif isinstance(slot, dict):
                            time_str = slot.get('time', slot.get('display', ''))
                            if time_str:
                                times.append(time_str)
                    
                    if times:
                        time_slots[date_key] = times
        
        return {
            'facility_id': facility_id,
            'facility_name': facility_name,
            'time_slots': time_slots,
            'has_availability': len(time_slots) > 0
        }
    
    return None

def main():
    print("Mississauga Facility Discovery Script")
    print("=" * 50)
    
    # Step 1: Get all facilities
    print("Step 1: Getting list of all facilities...")
    facilities_data = get_all_facilities()
    
    if not facilities_data:
        print("Failed to get facility list. You may need to check the POST payload.")
        print("Try using Chrome Dev Tools to see what data was sent in the POST request.")
        return
    
    # Save raw facility data
    with open("raw_facilities_response.json", "w") as f:
        json.dump(facilities_data, f, indent=2)
    print("Raw facility data saved to: raw_facilities_response.json")
    
    # Step 2: Parse facility list
    facilities = parse_facility_list(facilities_data)
    print(f"Found {len(facilities)} facilities")
    
    if not facilities:
        print("No facilities found in response. Check raw_facilities_response.json to see the structure.")
        return
    
    # Show first few facilities
    print("\nFirst 5 facilities found:")
    for facility in facilities[:5]:
        print(f"  ID: {facility['id']} - {facility['name']}")
    
    # Step 3: Check availability for all facilities
    print(f"\nStep 3: Checking availability for all {len(facilities)} facilities...")
    
    all_availability = {}
    successful_checks = []
    
    # Use threading but limit concurrent requests
    max_workers = 3
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_facility = {executor.submit(check_facility_availability, facility): facility for facility in facilities}
        
        for future in as_completed(future_to_facility):
            facility = future_to_facility[future]
            try:
                result = future.result()
                if result and result['has_availability']:
                    successful_checks.append(result)
                    
                    # Add to results
                    location = "Mississauga Recreation Facilities"
                    if location not in all_availability:
                        all_availability[location] = {}
                    
                    all_availability[location][result['facility_name']] = result['time_slots']
                    
            except Exception as e:
                print(f"Error checking {facility['name']}: {e}")
            
            time.sleep(0.2)  # Be nice to the server
    
    # Save results
    print(f"\n" + "=" * 50)
    print(f"Found availability for {len(successful_checks)} facilities")
    
    with open("all_mississauga_facilities.json", "w") as f:
        json.dump(all_availability, f, indent=2)
    print("Saved to: all_mississauga_facilities.json")
    
    # Summary
    print(f"\nFacilities with availability:")
    for result in successful_checks:
        available_dates = len(result['time_slots'])
        print(f"  {result['facility_name']} (ID: {result['facility_id']}): {available_dates} available dates")

if __name__ == "__main__":
    main()