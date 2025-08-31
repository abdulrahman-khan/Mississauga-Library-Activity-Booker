"""
Step 2: Read facilities JSON and get availability using requests session
"""

import requests
import json
import time
import os
import random
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def load_facilities():
    """
    Load facilities from the JSON file created by step 1
    """
    try:
        with open("data/all_facilities.json", "r") as f:
            facilities_data = json.load(f)
        
        # Convert nested structure to flat list
        facilities = []
        for center_name, center_data in facilities_data.items():
            center_facilities = center_data.get('facilities', [])
            for facility in center_facilities:
                # Add center_name to each facility
                facility['center_name'] = center_name
                facilities.append(facility)
        
        print(f"Loaded {len(facilities)} facilities from data/all_facilities.json")
        return facilities
    except FileNotFoundError:
        print("Error: data/all_facilities.json not found. Run the facility list scraper first.")
        return None
    except Exception as e:
        print(f"Error loading facilities: {e}")
        return None

def get_fresh_cookies():
    """
    Use Selenium to get fresh cookies with browser-level authentication
    """
    print("Getting fresh cookies from browser...")
    
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=options)
    
    try:
        # Visit main page
        driver.get("https://anc.ca.apm.activecommunities.com/activemississauga/reservation/landing/search")
        time.sleep(3)
        
        # Get cookies
        selenium_cookies = driver.get_cookies()
        cookies = {cookie['name']: cookie['value'] for cookie in selenium_cookies}
        
        print(f"Got {len(cookies)} cookies")
        print("Cookies:", list(cookies.keys()))
        
        return cookies
        
    except Exception as e:
        print(f"Error getting cookies: {e}")
        return {}
    finally:
        driver.quit()

def get_facility_availability(facility_id, cookies):
    """
    Get availability data using fresh cookies from browser with detailed debugging
    """
    # Use current date to 2 weeks from now
    start_date = datetime.now().strftime("%Y-%m-%d")
    end_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
    
    url = f"https://anc.ca.apm.activecommunities.com/activemississauga/rest/reservation/resource/availability/daily/{facility_id}"
    
    params = {
        'start_date': start_date,
        'end_date': end_date,
        'customer_id': '0',
        'company_id': '0',
        'locale': 'en-US',
        'ui_random': str(int(time.time() * 1000))  # Fresh timestamp
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-CA,en-US;q=0.7,en;q=0.3',
        'Referer': f'https://anc.ca.apm.activecommunities.com/activemississauga/reservation/landing/search/detail/{facility_id}',
    }
    
    print(f"  Checking facility {facility_id}...")
    
    try:
        response = requests.get(url, params=params, headers=headers, cookies=cookies, timeout=10)
        
        print(f"  Status: {response.status_code}, Length: {len(response.text)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"  JSON keys: {list(data.keys()) if isinstance(data, dict) else type(data)}")
                return data
            except:
                print(f"  Not valid JSON: {response.text[:200]}")
                return None
        else:
            print(f"  Error response: {response.text[:200]}")
            return None
            
    except Exception as e:
        print(f"  Exception: {e}")
        return None

def parse_time_slots(api_data):
    """
    Parse availability API response into time slots
    """
    if not api_data:
        return {}
    
    # Handle the actual API structure: body.details.daily_details
    try:
        daily_details = api_data.get('body', {}).get('details', {}).get('daily_details', [])
        if not daily_details:
            return {}
        
        time_slots = {}
        
        for day_data in daily_details:
            if not isinstance(day_data, dict):
                continue
                
            date_str = day_data.get('date', '')
            times_list = day_data.get('times', [])
            
            if not date_str or not times_list:
                continue
            
            times = []
            for time_slot in times_list:
                if isinstance(time_slot, dict):
                    start = time_slot.get('start_time', '')
                    end = time_slot.get('end_time', '')
                    
                    if start and end:
                        # Format times (remove seconds if present)
                        start_formatted = start.split(':')[0] + ':' + start.split(':')[1]
                        end_formatted = end.split(':')[0] + ':' + end.split(':')[1]
                        times.append(f"{start_formatted} - {end_formatted}")
            
            if times:
                try:
                    formatted_date = datetime.strptime(date_str, "%Y-%m-%d").strftime("%b %d, %Y")
                    time_slots[formatted_date] = times
                except:
                    time_slots[date_str] = times
        
        return time_slots
        
    except Exception as e:
        print(f"Error parsing time slots: {e}")
        return {}

def check_facility_availability(facility, cookies):
    """
    Check availability for a single facility using fresh cookies
    """
    facility_id = facility['id']
    facility_name = facility['name']
    center_name = facility['center_name']
    
    # Skip facilities that don't allow internet reservations
    if facility.get('no_internet_permits', False):
        return None
    
    availability_data = get_facility_availability(facility_id, cookies)
    
    if availability_data:
        print(f"  Got API data for {facility_name}")
        time_slots = parse_time_slots(availability_data)
        print(f"  Parsed {len(time_slots)} time slots")
        
        if time_slots:
            print(f"  ✓ SUCCESS: {facility_name} has availability")
            return {
                'facility_id': facility_id,
                'facility_name': facility_name,
                'center_name': center_name,
                'facility_type': facility['type_name'],
                'max_capacity': facility['max_capacity'],
                'time_slots': time_slots
            }
        else:
            print(f"  No valid time slots found for {facility_name}")
    else:
        print(f"  No API data returned for {facility_name}")
    
    return None

def main():
    print("Mississauga Facility Availability Scraper")
    print("=" * 50)
    
    # Create data directory
    os.makedirs("data", exist_ok=True)
    
    # Load facilities from step 1
    facilities = load_facilities()
    if not facilities:
        return
    
    # Get fresh cookies using Selenium
    cookies = get_fresh_cookies()
    if not cookies:
        print("Failed to get cookies")
        return
    
    # Filter bookable facilities
    bookable_facilities = [f for f in facilities if not f.get('no_internet_permits', False)]
    print(f"Found {len(bookable_facilities)} bookable facilities")
    
    # Ask user how many to test
    while True:
        try:
            user_input = input(f"How many facilities to check (1-{len(bookable_facilities)})? ")
            num_to_check = int(user_input)
            if 1 <= num_to_check <= len(bookable_facilities):
                break
            else:
                print(f"Please enter a number between 1 and {len(bookable_facilities)}")
        except ValueError:
            print("Please enter a valid number")
    
    # Limit to user's choice
    bookable_facilities = bookable_facilities[:num_to_check]
    print(f"Checking availability for {num_to_check} facilities...")
    
    results_by_location = {}
    facilities_with_availability = []
    
    # Process facilities one by one
    for i, facility in enumerate(bookable_facilities):
        if i % 25 == 0:
            print(f"Progress: {i}/{len(bookable_facilities)} facilities checked")
        
        try:
            result = check_facility_availability(facility, cookies)
            if result:
                facilities_with_availability.append(result)
                
                # Organize by center/location
                center_name = result['center_name']
                if center_name not in results_by_location:
                    results_by_location[center_name] = {}
                
                results_by_location[center_name][result['facility_name']] = result['time_slots']
                print(f"✓ Found availability: {result['facility_name']}")
                
        except Exception as e:
            facility_name = facility.get('name', 'unknown')
            print(f"Error checking {facility_name}: {e}")
        
        # Random delay to appear more human
        time.sleep(random.uniform(1.0, 2.5))
    
    # Save results
    print(f"\nFound availability for {len(facilities_with_availability)} facilities")
    
    # Save main availability file
    with open("data/facility_availability.json", "w") as f:
        json.dump(results_by_location, f, indent=2)
    print("Saved to: data/facility_availability.json")
    
    # Save detailed results
    detailed_results = {
        'scraped_at': datetime.now().isoformat(),
        'total_bookable_facilities': len(bookable_facilities),
        'facilities_with_availability': len(facilities_with_availability),
        'results': facilities_with_availability
    }
    
    with open("data/detailed_availability.json", "w") as f:
        json.dump(detailed_results, f, indent=2)
    print("Detailed data saved to: data/detailed_availability.json")
    
    # Print summary
    print(f"\nSummary by location:")
    for location, facilities in results_by_location.items():
        total_slots = sum(len(slots) for slots in facilities.values())
        print(f"  {location}: {len(facilities)} facilities, {total_slots} available time slots")

if __name__ == "__main__":
    main()