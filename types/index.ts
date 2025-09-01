// Global type definitions for the application

export interface Facility {
  id: string;
  name: string;
  center_name: string;
  category?: string;
  location?: string;
  description?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  booking_url?: string;
}

export interface AvailabilityData {
  facility_id: string;
  facility_name: string;
  date: string;
  slots: TimeSlot[];
}

export interface WeeklyAvailabilityData {
  facility_id: string;
  facility_name: string;
  week_start: string;
  week_end: string;
  daily_availability: {
    [date: string]: TimeSlot[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Electron API types
export interface ElectronAPI {
  getFacilities: () => Promise<ApiResponse<Facility[]>>;
  getFacilityAvailability: (facilityId: string, date: string) => Promise<ApiResponse<AvailabilityData>>;
  getFacilityWeeklyAvailability: (facilityId: string, startDate: string, endDate: string) => Promise<ApiResponse<WeeklyAvailabilityData>>;
  getFacilitiesByCenter: (centerName: string) => Promise<ApiResponse<Facility[]>>;
  refreshCookies: () => Promise<ApiResponse<boolean>>;
  getUniqueCenters: () => Promise<ApiResponse<string[]>>;
  openExternal: (url: string) => Promise<void>;
}

export interface Utils {
  formatDate: (date: Date | string) => string;
  groupByCenter: (facilities: Facility[]) => Record<string, Facility[]>;
  exportToJSON: (data: any, filename: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    utils: Utils;
  }
}