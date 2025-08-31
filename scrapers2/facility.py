"""
Get all Mississauga facilities and save to JSON
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
    
    # Load existing facilities to check for duplicates
    facilities_file = "data/all_facilities.json"
    existing_ids = set()
    all_facilities = []
    
    if os.path.exists(facilities_file):
        try:
            with open(facilities_file, 'r') as f:
                existing_data = json.load(f)
                
            # Handle both old flat format and new nested format
            if isinstance(existing_data, list):
                # Old flat format
                all_facilities = existing_data.copy()
                existing_ids = {facility['id'] for facility in existing_data}
                print(f"Found {len(existing_data)} existing facilities (old format)")
            elif isinstance(existing_data, dict):
                # New nested format - flatten it
                for center_name, center_data in existing_data.items():
                    for facility in center_data.get('facilities', []):
                        facility_with_center = facility.copy()
                        facility_with_center['center_name'] = center_name
                        facility_with_center['center_id'] = center_data.get('center_id')
                        all_facilities.append(facility_with_center)
                        existing_ids.add(facility['id'])
                print(f"Found {len(all_facilities)} existing facilities (nested format)")
        except Exception as e:
            print(f"Error loading existing facilities: {e}")
            all_facilities = []
            existing_ids = set()
    
    new_count = 0
    
    # First, get total count from first page
    print("Getting total facility count...")
    headers['page_info'] = json.dumps({
        "page_number": 1, 
        "total_records_per_page": 100
    })
    
    try:
        response = requests.post(url, params=params, headers=headers, json={}, timeout=15)
        if response.status_code == 200:
            data = response.json()
            if 'body' in data and 'items' in data['body']:
                total = data['body'].get('total', 0)
                items_per_page = len(data['body']['items'])
                print(f"Total facilities available: {total}")
                print(f"Items per page: {items_per_page}")
                
                # Calculate how many pages we need based on actual items per page
                if items_per_page > 0:
                    total_pages = (total + items_per_page - 1) // items_per_page
                else:
                    total_pages = 1
            else:
                print("Unexpected response structure")
                return []
        else:
            print(f"Error getting total: HTTP {response.status_code}")
            return []
    except Exception as e:
        print(f"Error getting total: {e}")
        return []
    
    # Now loop through exactly the number of pages we calculated
    print(f"Fetching {total_pages} pages...")
    
    for page in range(1, total_pages + 1):
        print(f"Fetching facilities page {page}/{total_pages}...")
        
        headers['page_info'] = json.dumps({
            "page_number": page, 
            "total_records_per_page": 100
        })
        
        try:
            response = requests.post(url, params=params, headers=headers, json={}, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'body' in data and 'items' in data['body']:
                    items = data['body']['items']
                    
                    print(f"  Got {len(items)} facilities")
                    
                    # Only add new facilities and filter fields
                    page_new_count = 0
                    for facility in items:
                        if facility['id'] not in existing_ids:
                            # Create filtered facility with only important fields
                            filtered_facility = {
                                'id': facility.get('id'),
                                'name': facility.get('name'),
                                'type_name': facility.get('type_name'),
                                'type_id': facility.get('type_id'),
                                'site_id': facility.get('site_id'),
                                'center_id': facility.get('center_id'),
                                'center_name': facility.get('center_name'),
                                'max_capacity': facility.get('max_capacity'),
                                'no_internet_permits': facility.get('no_internet_permits')
                            }
                            
                            all_facilities.append(filtered_facility)
                            existing_ids.add(facility['id'])
                            new_count += 1
                            page_new_count += 1
                    
                    print(f"    Added {page_new_count} new facilities")
                    
                    # Continue fetching all pages to get complete dataset
                    
                    if len(items) == 0:
                        print("  Empty page, stopping")
                        break
                    
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
    
    print(f"Collected {len(all_facilities)} facilities total")
    return all_facilities

def group_facilities_by_center(facilities):
    """Group facilities by center name"""
    centers = {}
    
    for facility in facilities:
        center_name = facility.get('center_name', 'Unknown Center')
        center_id = facility.get('center_id')
        
        if center_name not in centers:
            centers[center_name] = {
                'center_id': center_id,
                'facilities': []
            }
        
        # Remove center_name and center_id from facility since they're now at center level
        facility_data = {k: v for k, v in facility.items() if k not in ['center_name', 'center_id']}
        centers[center_name]['facilities'].append(facility_data)
    
    return centers

def main():
    print("Mississauga Facility List Scraper")
    print("=" * 40)
    
    # Create data directory
    os.makedirs("data", exist_ok=True)
    
    # Get all facilities
    facilities = get_all_facilities()
    
    if facilities:
        # Group facilities by center
        centers_data = group_facilities_by_center(facilities)
        
        # Save to JSON
        with open("data/all_facilities.json", "w") as f:
            json.dump(centers_data, f, indent=2)
        
        print(f"\nSaved {len(facilities)} facilities grouped by center to data/all_facilities.json")
        print(f"Number of centers: {len(centers_data)}")
        
        # Print summary
        facility_types = {}
        bookable_count = 0
        
        for center_name, center_data in centers_data.items():
            print(f"\n{center_name}: {len(center_data['facilities'])} facilities")
            for facility in center_data['facilities']:
                ftype = facility.get('type_name', 'Unknown')
                facility_types[ftype] = facility_types.get(ftype, 0) + 1
                if not facility.get('no_internet_permits', False):
                    bookable_count += 1
        
        print(f"\nFacility types:")
        for ftype, count in sorted(facility_types.items()):
            print(f"  {ftype}: {count}")
            
        print(f"\nBookable online: {bookable_count} out of {len(facilities)}")
        
    else:
        print("Failed to get facilities")

if __name__ == "__main__":
    main()