const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    getFacilities: () => ipcRenderer.invoke('get-facilities'),
    getFacilityAvailability: (facilityId, date) => 
        ipcRenderer.invoke('get-facility-availability', facilityId, date),
    getFacilityWeeklyAvailability: (facilityId, startDate, endDate) =>
        ipcRenderer.invoke('get-facility-weekly-availability', facilityId, startDate, endDate),
    getFacilitiesByCenter: (centerName) => 
        ipcRenderer.invoke('get-facilities-by-center', centerName),
    refreshCookies: () => ipcRenderer.invoke('refresh-cookies'),
    getUniqueCenters: () => ipcRenderer.invoke('get-unique-centers'),
    openExternal: (url) => ipcRenderer.invoke('open-external', url)
});

// Utility functions for the renderer
contextBridge.exposeInMainWorld('utils', {
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('en-CA');
    },
    groupByCenter: (facilities) => {
        return facilities.reduce((groups, facility) => {
            const center = facility.center_name;
            if (!groups[center]) {
                groups[center] = [];
            }
            groups[center].push(facility);
            return groups;
        }, {});
    },
    exportToJSON: (data, filename) => {
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
});