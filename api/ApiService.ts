import axios, { AxiosRequestConfig } from 'axios';
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Facility, ApiResponse, AvailabilityData, WeeklyAvailabilityData } from '../types';

interface CookieData {
  [key: string]: string;
}

interface FacilitiesJson {
  [centerName: string]: {
    facilities?: Facility[];
  };
}

class ApiService {
  private baseUrl: string;
  private cookies: CookieData;
  private facilitiesCache: Facility[] | null;
  private facilitiesCacheFile: string;

  constructor() {
    this.baseUrl = 'https://anc.ca.apm.activecommunities.com/activemississauga';
    this.cookies = {};
    this.facilitiesCache = null;
    this.facilitiesCacheFile = path.join(__dirname, '..', 'data', 'facilities_cache.json');
  }

  async refreshCookies(): Promise<ApiResponse<boolean>> {
    console.log('Getting fresh cookies from browser...');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0');
      
      await page.goto(`${this.baseUrl}/reservation/landing/search`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      const cookies = await page.cookies();
      this.cookies = cookies.reduce((acc: CookieData, cookie) => {
        acc[cookie.name] = cookie.value;
        return acc;
      }, {});

      console.log(`Got ${Object.keys(this.cookies).length} cookies`);
      return { 
        success: true, 
        data: true,
        message: `Got ${Object.keys(this.cookies).length} cookies`
      };
    } catch (error) {
      console.error('Error getting cookies:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      await browser.close();
    }
  }

  async getAllFacilities(): Promise<ApiResponse<Facility[]>> {
    try {
      const facilitiesPath = path.join(__dirname, '..', 'data', 'all_facilities.json');
      const facilitiesData = await fs.readFile(facilitiesPath, 'utf-8');
      const facilitiesJson: FacilitiesJson = JSON.parse(facilitiesData);
      
      // Convert nested structure to flat list
      const facilities: Facility[] = [];
      for (const [centerName, centerData] of Object.entries(facilitiesJson)) {
        const centerFacilities = centerData.facilities || [];
        for (const facility of centerFacilities) {
          facility.center_name = centerName;
          facilities.push(facility);
        }
      }
      
      console.log(`Loaded ${facilities.length} facilities from all_facilities.json`);
      this.facilitiesCache = facilities;
      
      return {
        success: true,
        data: facilities
      };
    } catch (error) {
      console.error('Error loading facilities from all_facilities.json:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load facilities'
      };
    }
  }

  async getFacilityAvailability(facilityId: string, date: string): Promise<ApiResponse<any>> {
    if (Object.keys(this.cookies).length === 0) {
      await this.refreshCookies();
    }

    const startDate = date;
    const endDate = date;
    
    const url = `${this.baseUrl}/rest/reservation/resource/availability/daily/${facilityId}`;
    
    const params = {
      'start_date': startDate,
      'end_date': endDate,
      'customer_id': '0',
      'company_id': '0',
      'locale': 'en-US',
      'ui_random': Date.now().toString()
    };

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-CA,en-US;q=0.7,en;q=0.3',
      'Referer': `${this.baseUrl}/reservation/landing/search/detail/${facilityId}`,
    };

    const config: AxiosRequestConfig = {
      method: 'get',
      url: url,
      params: params,
      headers: headers,
      timeout: 10000
    };

    if (Object.keys(this.cookies).length > 0) {
      config.headers!['Cookie'] = Object.entries(this.cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
    }

    try {
      const response = await axios(config);
      
      if (response.status === 200 && response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error getting availability for facility ${facilityId}:`, error instanceof Error ? error.message : error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get facility availability'
      };
    }
  }

  async getFacilityWeeklyAvailability(facilityId: string, startDate: string, endDate: string): Promise<ApiResponse<any>> {
    if (Object.keys(this.cookies).length === 0) {
      await this.refreshCookies();
    }
    
    const url = `${this.baseUrl}/rest/reservation/resource/availability/daily/${facilityId}`;
    
    const params = {
      'start_date': startDate,
      'end_date': endDate,
      'customer_id': '0',
      'company_id': '0',
      'locale': 'en-US',
      'ui_random': Date.now().toString()
    };

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-CA,en-US;q=0.7,en;q=0.3',
      'Referer': `${this.baseUrl}/reservation/landing/search/detail/${facilityId}`,
    };

    const config: AxiosRequestConfig = {
      method: 'get',
      url: url,
      params: params,
      headers: headers,
      timeout: 15000
    };

    if (Object.keys(this.cookies).length > 0) {
      config.headers!['Cookie'] = Object.entries(this.cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
    }

    try {
      console.log(`Fetching weekly availability for facility ${facilityId} from ${startDate} to ${endDate}`);
      const response = await axios(config);
      
      if (response.status === 200 && response.data) {
        console.log(`Weekly availability data received for facility ${facilityId}`);
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error getting weekly availability for facility ${facilityId}:`, error instanceof Error ? error.message : error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get weekly availability'
      };
    }
  }

  async getFacilitiesByCenter(centerName: string): Promise<ApiResponse<Facility[]>> {
    try {
      const facilitiesPath = path.join(__dirname, '..', 'data', 'all_facilities.json');
      const facilitiesData = await fs.readFile(facilitiesPath, 'utf-8');
      const facilitiesJson: FacilitiesJson = JSON.parse(facilitiesData);
      
      if (!centerName || !facilitiesJson[centerName]) {
        return {
          success: true,
          data: []
        };
      }
      
      const centerData = facilitiesJson[centerName];
      const facilities = centerData.facilities || [];
      
      // Add center_name to each facility
      facilities.forEach(facility => {
        facility.center_name = centerName;
      });
      
      console.log(`Found ${facilities.length} facilities for center: ${centerName}`);
      return {
        success: true,
        data: facilities
      };
    } catch (error) {
      console.error(`Error loading facilities for center ${centerName}:`, error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to load facilities by center'
      };
    }
  }

  async getUniqueCenters(): Promise<ApiResponse<string[]>> {
    try {
      const facilitiesPath = path.join(__dirname, '..', 'data', 'all_facilities.json');
      const facilitiesData = await fs.readFile(facilitiesPath, 'utf-8');
      const facilitiesJson: FacilitiesJson = JSON.parse(facilitiesData);
      
      const centers = Object.keys(facilitiesJson).sort();
      console.log(`Found ${centers.length} centers`);
      
      return {
        success: true,
        data: centers
      };
    } catch (error) {
      console.error('Error loading centers from all_facilities.json:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to load centers'
      };
    }
  }

  async clearCache(): Promise<void> {
    this.facilitiesCache = null;
    try {
      await fs.unlink(this.facilitiesCacheFile);
      console.log('Cache cleared');
    } catch (error) {
      console.log('No cache file to clear');
    }
  }
}

export default ApiService;