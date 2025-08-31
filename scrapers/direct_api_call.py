"""
Test script to debug availability API for a single facility
"""

import requests
import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def get_fresh_cookies():
    """
    Use Selenium to get fresh cookies
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

def test_facility_availability(facility_id, cookies):
    """
    Test availability API with detailed debugging
    """
    url = f"https://anc.ca.apm.activecommunities.com/activemississauga/rest/reservation/resource/availability/daily/{facility_id}"
    
    params = {
        'start_date': '2025-07-27',
        'end_date': '2025-09-06',
        'customer_id': '0',
        'company_id': '0',
        'locale': 'en-US',
        'ui_random': '1756584525663'
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-CA,en-US;q=0.7,en;q=0.3',
        'Referer': f'https://anc.ca.apm.activecommunities.com/activemississauga/reservation/landing/search/detail/{facility_id}',
    }
    
    print(f"\nTesting facility {facility_id}...")
    print(f"URL: {url}")
    print(f"Params: {params}")
    
    try:
        response = requests.get(url, params=params, headers=headers, cookies=cookies, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Length: {len(response.text)} characters")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"JSON Response Type: {type(data)}")
                
                if isinstance(data, dict):
                    print(f"Response Keys: {list(data.keys())}")
                    print(f"Full Response: {json.dumps(data, indent=2)}")
                else:
                    print(f"Response: {data}")
                
                return data
            except:
                print("Response is not valid JSON")
                print(f"Raw Response: {response.text}")
        else:
            print(f"Error Response: {response.text}")
        
        return None
        
    except Exception as e:
        print(f"Request Exception: {e}")
        return None

def main():
    print("Single Facility Availability Test")
    print("=" * 40)
    
    # Get fresh cookies
    cookies = get_fresh_cookies()
    
    if not cookies:
        print("No cookies obtained - cannot proceed")
        return
    
    # Test with known facility ID
    facility_id = 2143  # Central Library - Meeting Room 201
    
    print(f"\n" + "=" * 40)
    result = test_facility_availability(facility_id, cookies)
    
    if result:
        print("\nSUCCESS: Got availability data!")
        
        # Save for inspection
        with open("test_availability_response.json", "w") as f:
            json.dump(result, f, indent=2)
        print("Saved response to: test_availability_response.json")
    else:
        print("\nFAILED: No availability data returned")

if __name__ == "__main__":
    main()