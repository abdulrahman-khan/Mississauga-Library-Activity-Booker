"""
Complete scraper for all Mississauga facilities and their availability
"""

import requests
import json
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

def get_all_facilities():
    """
    Get complete list of all facilities from the resource endpoint
    """
    url = "https://anc.ca.apm.activecommunities.com/activemississauga/rest/reservation/resource"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0',
        'Accept': '*/*',
        'Accept-Language': 'en-CA,en-US;q=0.7,en;q=0.3',
        'Content-Type': 'application/json;charset=utf-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://anc.ca.apm.activecommunities.com',
        'Referer': 'https://anc.ca.apm.activecommunities.com/activemississauga/reservation/landing/search?reservationGroupIds=7'
    }
    
    params = {'locale': 'en-US'}
    
    all_facilities = []
    page = 1
    
    while True:
        print(f"Fetching facilities page {page}...")
        
        # Update page info header
        headers['page_info'] = json.dumps({"page_number": page, "total_records_per_page": 100})
        
        try:
            # Try with empty payload first
            response = requests.post(url, params=params, headers=headers, json={}, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'body' in data and 'items' in data['body']:
                    items = data['body']['items']
                    total = data['body'].get('total', 0)
                    
                    print(f"Found {len(items)} facilities on page {page} (total: {total})")
                    all_facilities.extend(items)
                    
                    # Check if we have all facilities
                    if len(all_facilities) >= total or len(items) == 0:
                        break
                    
                    page += 1
                    time.sleep(0.5)  # Be nice to server
                else:
                    print("Unexpected response structure")
                    break
            else:
                print(f"Error: HTTP {response.status_code}")
                break
                
        except Exception as e:
            print(f"Error fetching facilities: {e}")
            break
    
    print(f"Total facilities found: {len(all_facilities)}")
    return all_facilities

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

def parse_availability_data(api_data):
    """
    Parse API response into time slots by date
    """
    if not api_data:
        return {}
    
    time_slots = {}
    
    # Handle the API response structure
    if isinstance(api_data, dict):
        for date_str, slots in api_data.items():
            if isinstance(slots, list) and slots:
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
                        elif slot.get('display'):
                            times.append(slot['display'])
                    elif isinstance(slot, str):
                        times.append(slot)
                
                if times:
                    # Format date nicely
                    try:
                        formatted_date = datetime.strptime(date_str, "%Y-%m-%d").strftime("%b %d, %Y")
                        time_slots[formatted_date] = times
                    except:
                        time_slots[date_str] = times
    
    return time_slots

def check_single_facility(facility):
    """
    Check availability for a single facility
    """
    facility_id = facility['id']
    facility_name = facility['name']
    center_name = facility['center_name']
    facility_type = facility['type_name']
    
    # Get availability
    availability_data = get_facility_availability(facility_id)
    
    if availability_data:
        time_slots = parse_availability_data(availability_data)
        
        if time_slots:
            print(f"✓ {facility_name}: {len(time_slots)} available dates")
            return {
                'facility_id': facility_id,
                'facility_name': facility_name,
                'center_name': center_name,
                'facility_type': facility_type,
                'max_capacity': facility['max_capacity'],
                'time_slots': time_slots
            }
    
    return None

def main():
    print("Complete Mississauga Facility Availability Scraper")
    print("=" * 60)
    
    # Step 1: Get all facilities
    print("Step 1: Getting complete list of facilities...")
    all_facilities = get_all_facilities()
    
    if not all_facilities:
        print("Failed to get facilities list")
        return
    
    # Save facility list
    with open("data/mississauga_all_facilities_list.json", "w") as f:
        json.dump(all_facilities, f, indent=2)
    print(f"Complete facility list saved to: mississauga_all_facilities_list.json")
    
    # Show facility types
    facility_types = {}
    for facility in all_facilities:
        facility_type = facility.get('type_name', 'Unknown')
        if facility_type not in facility_types:
            facility_types[facility_type] = 0
        facility_types[facility_type] += 1
    
    print(f"\nFacility types found:")
    for ftype, count in sorted(facility_types.items()):
        print(f"  {ftype}: {count} facilities")
    
    # Step 2: Check availability for all facilities
    print(f"\nStep 2: Checking availability for all {len(all_facilities)} facilities...")
    print("This may take several minutes...")
    
    results_by_location = {}
    successful_facilities = []
    
    # Use threading for faster processing
    max_workers = 5
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_facility = {executor.submit(check_single_facility, facility): facility for facility in all_facilities}
        
        completed = 0
        for future in as_completed(future_to_facility):
            facility = future_to_facility[future]
            completed += 1
            
            if completed % 20 == 0:
                print(f"Progress: {completed}/{len(all_facilities)} facilities checked")
            
            try:
                result = future.result()
                if result:
                    successful_facilities.append(result)
                    
                    # Organize by location/center
                    center_name = result['center_name']
                    if center_name not in results_by_location:
                        results_by_location[center_name] = {}
                    
                    results_by_location[center_name][result['facility_name']] = result['time_slots']
                    
            except Exception as e:
                print(f"Error checking {facility.get('name', 'unknown')}: {e}")
            
            time.sleep(0.1)  # Small delay between requests
    
    # Step 3: Save results
    print(f"\n" + "=" * 60)
    print(f"RESULTS: Found availability for {len(successful_facilities)} out of {len(all_facilities)} facilities")
    
    # Save main results file
    with open("data/mississauga_facility_availability.json", "w") as f:
        json.dump(results_by_location, f, indent=2)
    print("Main results saved to: mississauga_facility_availability.json")
    
    # Save detailed results with metadata
    detailed_results = {
        'scraped_at': datetime.now().isoformat(),
        'total_facilities_checked': len(all_facilities),
        'facilities_with_availability': len(successful_facilities),
        'facility_types': facility_types,
        'facilities': successful_facilities
    }
    
    with open("data/mississauga_detailed_facility_results.json", "w") as f:
        json.dump(detailed_results, f, indent=2)
    print("Detailed results saved to: mississauga_detailed_facility_results.json")
    
    # Print summary by location
    print(f"\nSummary by location:")
    for location, facilities in results_by_location.items():
        available_facilities = len(facilities)
        total_slots = sum(len(slots) for slots in facilities.values())
        print(f"  {location}: {available_facilities} facilities, {total_slots} total available time slots")
    
    print(f"\nTop facilities with most availability:")
    sorted_facilities = sorted(successful_facilities, key=lambda x: len(x['time_slots']), reverse=True)
    for facility in sorted_facilities[:10]:
        print(f"  {facility['facility_name']} ({facility['facility_type']}): {len(facility['time_slots'])} available dates")

if __name__ == "__main__":
    main()