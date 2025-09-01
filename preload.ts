import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI, Utils, Facility, ApiResponse, AvailabilityData, WeeklyAvailabilityData } from './types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI: ElectronAPI = {
    getFacilities: (): Promise<ApiResponse<Facility[]>> => 
        ipcRenderer.invoke('get-facilities'),
    getFacilityAvailability: (facilityId: string, date: string): Promise<ApiResponse<AvailabilityData>> => 
        ipcRenderer.invoke('get-facility-availability', facilityId, date),
    getFacilityWeeklyAvailability: (facilityId: string, startDate: string, endDate: string): Promise<ApiResponse<WeeklyAvailabilityData>> =>
        ipcRenderer.invoke('get-facility-weekly-availability', facilityId, startDate, endDate),
    getFacilitiesByCenter: (centerName: string): Promise<ApiResponse<Facility[]>> => 
        ipcRenderer.invoke('get-facilities-by-center', centerName),
    refreshCookies: (): Promise<ApiResponse<boolean>> => 
        ipcRenderer.invoke('refresh-cookies'),
    getUniqueCenters: (): Promise<ApiResponse<string[]>> => 
        ipcRenderer.invoke('get-unique-centers'),
    openExternal: (url: string): Promise<void> => 
        ipcRenderer.invoke('open-external', url)
};

// Utility functions for the renderer
const utils: Utils = {
    formatDate: (date: Date | string): string => {
        return new Date(date).toLocaleDateString('en-CA');
    },
    groupByCenter: (facilities: Facility[]): Record<string, Facility[]> => {
        return facilities.reduce((groups: Record<string, Facility[]>, facility: Facility) => {
            const center = facility.center_name;
            if (!groups[center]) {
                groups[center] = [];
            }
            groups[center].push(facility);
            return groups;
        }, {});
    },
    exportToJSON: (data: any, filename: string): void => {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
contextBridge.exposeInMainWorld('utils', utils);