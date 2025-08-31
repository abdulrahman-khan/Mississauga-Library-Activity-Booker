"""
Script to investigate and potentially fake AJAX calls for time slot data
"""

import time
import json
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

def investigate_ajax_calls():
    # Setup Chrome with network logging
    options = Options()
    options.add_argument("--headless")
    options.add_experimental_option("useAutomationExtension", False)
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    
    # Enable performance logging to capture network requests
    options.add_experimental_option('perfLoggingPrefs', {
        'enableNetwork': True,
        'enablePage': False,
    })
    options.add_argument('--enable-logging')
    options.add_argument('--log-level=0')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        url = "https://anc.ca.apm.activecommunities.com/activemississauga/reservation/landing/search/detail/2143"
        print(f"Loading: {url}")
        driver.get(url)
        time.sleep(5)
        
        # Find a cell with "More" link
        more_links = driver.find_elements(By.CSS_SELECTOR, "a.more-link")
        
        if more_links:
            print(f"Found {len(more_links)} 'More' links")
            
            # Get network logs before hover
            logs_before = driver.get_log('performance')
            
            # Hover over the first "More" link
            print("Hovering over 'More' link...")
            ActionChains(driver).move_to_element(more_links[0]).perform()
            time.sleep(2)
            
            # Get network logs after hover
            logs_after = driver.get_log('performance')
            
            # Find new network requests
            new_requests = logs_after[len(logs_before):]
            
            print(f"\nFound {len(new_requests)} new network events:")
            
            ajax_calls = []
            for log in new_requests:
                message = json.loads(log['message'])
                if message['message']['method'] == 'Network.requestWillBeSent':
                    request = message['message']['params']['request']
                    url = request['url']
                    method = request['method']
                    
                    # Look for potential AJAX calls
                    if any(keyword in url.lower() for keyword in ['timeslot', 'availability', 'schedule', 'api', 'ajax']):
                        ajax_calls.append({
                            'url': url,
                            'method': method,
                            'headers': request.get('headers', {}),
                            'postData': request.get('postData', None)
                        })
                        print(f"Potential AJAX call: {method} {url}")
            
            if ajax_calls:
                print("\n=== AJAX Call Details ===")
                for call in ajax_calls:
                    print(f"URL: {call['url']}")
                    print(f"Method: {call['method']}")
                    print(f"Headers: {json.dumps(call['headers'], indent=2)}")
                    if call['postData']:
                        print(f"POST Data: {call['postData']}")
                    print("-" * 50)
                    
                return ajax_calls
            else:
                print("No obvious AJAX calls found. The data might be:")
                print("1. Embedded in JavaScript variables")
                print("2. Loaded via a different mechanism")
                print("3. Generated client-side")
        else:
            print("No 'More' links found")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()
    
    return []

def try_direct_api_call():
    """
    Try to make direct API calls based on common patterns
    """
    print("\n=== Trying Direct API Calls ===")
    
    # Common API endpoints to try
    base_url = "https://anc.ca.apm.activecommunities.com/activemississauga"
    facility_id = "2143"  # From the URL
    
    potential_endpoints = [
        f"{base_url}/api/facilities/{facility_id}/timeslots",
        f"{base_url}/api/reservation/timeslots?facilityId={facility_id}",
        f"{base_url}/reservation/api/availability/{facility_id}",
        f"{base_url}/api/calendar/availability?resource={facility_id}",
    ]
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest'
    })
    
    for endpoint in potential_endpoints:
        try:
            print(f"Trying: {endpoint}")
            response = session.get(endpoint)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"JSON Response: {json.dumps(data, indent=2)[:500]}...")
                    return data
                except:
                    print(f"Text Response: {response.text[:200]}...")
            
        except Exception as e:
            print(f"Error: {e}")
    
    return None

def extract_from_page_source():
    """
    Check if the data is embedded in JavaScript variables
    """
    print("\n=== Checking Page Source for Embedded Data ===")
    
    options = Options()
    options.add_argument("--headless")
    driver = webdriver.Chrome(options=options)
    
    try:
        url = "https://anc.ca.apm.activecommunities.com/activemississauga/reservation/landing/search/detail/2143"
        driver.get(url)
        time.sleep(5)
        
        # Get page source
        page_source = driver.page_source
        
        # Look for common patterns where data might be embedded
        patterns = [
            r'window\.__\w+\s*=\s*({.*?});',
            r'var\s+\w*[Tt]imeslots?\w*\s*=\s*(\[.*?\]);',
            r'var\s+\w*[Aa]vailability\w*\s*=\s*({.*?});',
            r'window\.\w*[Dd]ata\w*\s*=\s*({.*?});'
        ]
        
        import re
        for pattern in patterns:
            matches = re.findall(pattern, page_source, re.DOTALL)
            if matches:
                print(f"Found potential data with pattern: {pattern}")
                for match in matches[:3]:  # Show first 3 matches
                    try:
                        data = json.loads(match)
                        print(f"Data preview: {str(data)[:200]}...")
                        return data
                    except:
                        print(f"Raw match: {match[:200]}...")
        
        print("No embedded data patterns found")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()
    
    return None

def main():
    print("Investigating AJAX calls for time slot data...\n")
    
    # Method 1: Monitor network traffic during hover
    ajax_calls = investigate_ajax_calls()
    
    # Method 2: Try common API endpoints
    api_data = try_direct_api_call()
    
    # Method 3: Look for embedded JavaScript data
    embedded_data = extract_from_page_source()
    
    if ajax_calls:
        print(f"\n✓ Found {len(ajax_calls)} potential AJAX endpoints")
    if api_data:
        print("✓ Successfully called direct API")
    if embedded_data:
        print("✓ Found embedded JavaScript data")
    
    if not any([ajax_calls, api_data, embedded_data]):
        print("\n❌ No direct API method found. Hover interaction may be required.")

if __name__ == "__main__":
    main()