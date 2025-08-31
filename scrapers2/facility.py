"""
Step 1: Get all Mississauga facilities and save to JSON
"""

import requests
import json
import time
import os

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
    records_per_page = 100
    
    while True:
        print(f"Fetching facilities page {page}...")
        
        headers['page_info'] = json.dumps({
            "page_number": page, 
            "total_records_per_page": records_per_page
        })
        
        try:
            response = requests.post(url, params=params, headers=headers, json={}, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'body' in data and 'items' in data['body']:
                    items = data['body']['items']
                    total = data['body'].get('total', 0)
                    
                    print(f"  Got {len(items)} facilities (total available: {total})")
                    all_facilities.extend(items)
                    
                    if len(all_facilities) >= total or len(items) == 0:
                        break
                    
                    page += 1
                    time.sleep(0.3)
                else:
                    print("Unexpected response structure")
                    break
            else:
                print(f"Error: HTTP {response.status_code}")
                break
                
        except Exception as e:
            print(f"Error fetching facilities: {e}")
            break
    
    return all_facilities

def main():
    print("Mississauga Facility List Scraper")
    print("=" * 40)
    
    # Create data directory
    os.makedirs("data", exist_ok=True)
    
    # Get all facilities
    facilities = get_all_facilities()
    
    if facilities:
        # Save to JSON
        with open("data/all_facilities_list.json", "w") as f:
            json.dump(facilities, f, indent=2)
        
        print(f"\nSaved {len(facilities)} facilities to data/all_facilities_list.json")
        
        # Print summary
        facility_types = {}
        for facility in facilities:
            ftype = facility.get('type_name', 'Unknown')
            facility_types[ftype] = facility_types.get(ftype, 0) + 1
        
        print(f"\nFacility types:")
        for ftype, count in sorted(facility_types.items()):
            print(f"  {ftype}: {count}")
            
        bookable = [f for f in facilities if not f.get('no_internet_permits', False)]
        print(f"\nBookable online: {len(bookable)} out of {len(facilities)}")
        
    else:
        print("Failed to get facilities")

if __name__ == "__main__":
    main()