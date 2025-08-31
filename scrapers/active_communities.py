"""
Simple scraper to extract available time slots and save to JSON
"""

import time
import json
import re
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup

def scrape_timeslots():
    # Setup Chrome
    options = Options()
    options.add_argument("--headless")
    driver = webdriver.Chrome(options=options)
    
    try:
        # Load page
        url = "https://anc.ca.apm.activecommunities.com/activemississauga/reservation/landing/search/detail/2143"
        print(f"Loading: {url}")
        driver.get(url)
        time.sleep(5)  # Wait for page to load
        
        # Get page source and parse
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Extract location name
        location_element = soup.find('div', class_='facility-detail__center__name')
        location = location_element.get_text(strip=True) if location_element else "Hazel McCallion Central Library"
        
        # Extract room name
        room_element = soup.find('h1', class_='facility-detail__head-name')
        room_name = room_element.get_text(strip=True) if room_element else "Meeting Room 201"
        
        # Find all calendar cells with available times
        available_dates = {}
        
        # First, get all available calendar cells using Selenium
        calendar_cells = driver.find_elements(By.CSS_SELECTOR, "div[class*='calendar-cell--available']")
        
        for cell in calendar_cells:
            try:
                # Get the date from aria-label
                aria_label = cell.get_attribute('aria-label') or ''
                
                # Extract date using regex
                date_match = re.search(r'(Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul) \d+, \d{4}', aria_label)
                if not date_match:
                    continue
                    
                date_str = date_match.group(0)
                times = []
                
                # Get the main time slot
                main_time_element = cell.find_element(By.CSS_SELECTOR, "a.timeslots__avaliable")
                if main_time_element:
                    time_text = main_time_element.text.strip()
                    times.append(time_text)
                
                # Check for "More" link and hover to get additional times
                try:
                    more_link = cell.find_element(By.CSS_SELECTOR, "a.more-link")
                    if more_link:
                        # Hover over the "More" link to reveal tooltip
                        ActionChains(driver).move_to_element(more_link).perform()
                        time.sleep(1)  # Wait for tooltip to appear
                        
                        # Try to find tooltip content with additional time slots
                        tooltip_selectors = [
                            ".an-tooltip2__content",
                            ".tooltip-content", 
                            "[class*='tooltip']",
                            "[class*='popover']"
                        ]
                        
                        tooltip_found = False
                        for selector in tooltip_selectors:
                            try:
                                tooltip_elements = driver.find_elements(By.CSS_SELECTOR, selector)
                                for tooltip in tooltip_elements:
                                    if tooltip.is_displayed():
                                        tooltip_text = tooltip.text.strip()
                                        if tooltip_text and any(word in tooltip_text.lower() for word in ['am', 'pm', ':']):
                                            # Parse time slots from tooltip
                                            time_lines = [line.strip() for line in tooltip_text.split('\n') if line.strip()]
                                            for line in time_lines:
                                                if re.search(r'\d+:\d+\s*(AM|PM)', line, re.IGNORECASE):
                                                    if line not in times:  # Avoid duplicates
                                                        times.append(line)
                                            tooltip_found = True
                                            break
                                if tooltip_found:
                                    break
                            except:
                                continue
                        
                        # Move mouse away to close tooltip
                        ActionChains(driver).move_by_offset(100, 100).perform()
                        time.sleep(0.5)
                        
                except:
                    # If hover fails, just note that there are additional slots
                    more_text = more_link.text.strip() if more_link else ""
                    if more_text:
                        times.append(f"({more_text} - hover failed)")
                
                if times:
                    available_dates[date_str] = times
                    
            except Exception as e:
                print(f"Error processing cell: {e}")
                continue
        
        # Create JSON structure with nested format
        result = {
            location: {
                room_name: available_dates
            }
        }
        
        # Save to JSON file
        with open("available_timeslots.json", "w") as f:
            json.dump(result, f, indent=2)
        
        print(f"Saved {len(available_dates)} dates with time slots to available_timeslots.json")
        
        # Print summary
        for date, times in available_dates.items():
            print(f"{date}: {', '.join(times)}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    scrape_timeslots()