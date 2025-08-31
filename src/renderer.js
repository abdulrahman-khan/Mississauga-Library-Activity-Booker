class FacilityBookingUI {
    constructor() {
        this.facilities = [];
        this.filteredFacilities = [];
        this.availabilityData = new Map();
        this.isLoading = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadFacilities();
    }

    initializeElements() {
        this.facilityTypeSelect = document.getElementById('facilityType');
        this.facilityCenterSelect = document.getElementById('facilityCenter');
        this.bookingDateInput = document.getElementById('bookingDate');
        this.searchBtn = document.getElementById('searchBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.statusMessage = document.getElementById('statusMessage');
        this.facilitiesList = document.getElementById('facilitiesList');

        this.setDefaultDate();
    }

    setDefaultDate() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        this.bookingDateInput.value = tomorrow.toISOString().split('T')[0];
    }

    attachEventListeners() {
        this.searchBtn.addEventListener('click', () => this.searchAvailability());
        this.refreshBtn.addEventListener('click', () => this.refreshData());
        this.exportBtn.addEventListener('click', () => this.exportResults());
        
        this.facilityTypeSelect.addEventListener('change', () => this.filterFacilities());
        this.facilityCenterSelect.addEventListener('change', () => this.filterFacilities());
        
        this.bookingDateInput.addEventListener('change', () => {
            this.availabilityData.clear();
            this.updateFacilitiesDisplay();
        });
    }

    async loadFacilities() {
        this.setLoading(true, 'Loading facilities...');
        
        try {
            this.facilities = await window.electronAPI.getFacilities();
            this.populateCenterDropdown();
            this.filterFacilities();
            this.setStatus(`Loaded ${this.facilities.length} facilities`, 'success');
        } catch (error) {
            console.error('Error loading facilities:', error);
            this.setStatus('Failed to load facilities. Please refresh the app.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    populateCenterDropdown() {
        const centers = new Set();
        this.facilities.forEach(facility => {
            if (facility.center_name) {
                centers.add(facility.center_name);
            }
        });

        this.facilityCenterSelect.innerHTML = '<option value="">All Centers</option>';
        Array.from(centers).sort().forEach(center => {
            const option = document.createElement('option');
            option.value = center;
            option.textContent = center;
            this.facilityCenterSelect.appendChild(option);
        });
    }

    filterFacilities() {
        const selectedType = this.facilityTypeSelect.value;
        const selectedCenter = this.facilityCenterSelect.value;

        this.filteredFacilities = this.facilities.filter(facility => {
            const typeMatch = !selectedType || 
                (facility.type_name && facility.type_name.toLowerCase().includes(selectedType.toLowerCase())) ||
                (facility.center_name && facility.center_name.toLowerCase().includes(selectedType.toLowerCase()));
            
            const centerMatch = !selectedCenter || 
                (facility.center_name && facility.center_name.includes(selectedCenter));
            
            const bookable = !facility.no_internet_permits;

            return typeMatch && centerMatch && bookable;
        });

        this.updateFacilitiesDisplay();
        this.setStatus(`Found ${this.filteredFacilities.length} matching facilities`);
    }

    updateFacilitiesDisplay() {
        this.facilitiesList.innerHTML = '';

        if (this.filteredFacilities.length === 0) {
            this.facilitiesList.innerHTML = '<div class="no-results">No facilities match your criteria</div>';
            this.exportBtn.disabled = true;
            return;
        }

        const groupedByCenter = utils.groupByCenter(this.filteredFacilities);

        Object.entries(groupedByCenter).forEach(([centerName, centerFacilities]) => {
            const centerCard = this.createCenterCard(centerName, centerFacilities);
            this.facilitiesList.appendChild(centerCard);
        });

        this.exportBtn.disabled = false;
    }

    createCenterCard(centerName, facilities) {
        const centerCard = document.createElement('div');
        centerCard.className = 'center-card';

        const centerHeader = document.createElement('h3');
        centerHeader.className = 'center-name';
        centerHeader.textContent = centerName;
        centerCard.appendChild(centerHeader);

        const facilitiesGrid = document.createElement('div');
        facilitiesGrid.className = 'facilities-grid';

        facilities.forEach(facility => {
            const facilityCard = this.createFacilityCard(facility);
            facilitiesGrid.appendChild(facilityCard);
        });

        centerCard.appendChild(facilitiesGrid);
        return centerCard;
    }

    createFacilityCard(facility) {
        const card = document.createElement('div');
        card.className = 'facility-card';
        card.dataset.facilityId = facility.id;

        const availability = this.availabilityData.get(facility.id);
        const hasAvailability = availability && availability.body && availability.body.details;

        card.innerHTML = `
            <div class="facility-header">
                <h4 class="facility-name">${facility.name}</h4>
                <span class="facility-type">${facility.type_name}</span>
            </div>
            <div class="facility-details">
                <div class="capacity">Capacity: ${facility.max_capacity}</div>
                ${hasAvailability ? this.renderAvailabilityInfo(availability) : '<div class="availability-placeholder">Click "Search Availability" to see times</div>'}
            </div>
        `;

        return card;
    }

    renderAvailabilityInfo(availability) {
        const details = availability.body.details;
        const dailyDetails = details.daily_details || [];
        
        if (dailyDetails.length === 0) {
            return '<div class="no-availability">No availability data</div>';
        }

        const dayData = dailyDetails[0];
        const times = dayData.times || [];

        if (times.length === 0) {
            return '<div class="no-times">No available times</div>';
        }

        const timeSlots = times.map(time => `
            <div class="time-slot ${time.status === 'available' ? 'available' : 'unavailable'}">
                ${time.start_time} - ${time.end_time}
                ${time.price ? `($${time.price})` : ''}
            </div>
        `).join('');

        return `
            <div class="availability-info">
                <div class="date-header">Available times for ${utils.formatDate(dayData.date)}</div>
                <div class="time-slots">${timeSlots}</div>
            </div>
        `;
    }

    async searchAvailability() {
        if (this.filteredFacilities.length === 0) {
            this.setStatus('No facilities to search. Please adjust your filters.', 'warning');
            return;
        }

        const selectedDate = this.bookingDateInput.value;
        if (!selectedDate) {
            this.setStatus('Please select a date', 'warning');
            return;
        }

        this.setLoading(true, `Searching availability for ${this.filteredFacilities.length} facilities...`);
        this.availabilityData.clear();

        const promises = this.filteredFacilities.map(async (facility) => {
            try {
                const availability = await window.electronAPI.getFacilityAvailability(facility.id, selectedDate);
                this.availabilityData.set(facility.id, availability);
            } catch (error) {
                console.error(`Error getting availability for ${facility.name}:`, error);
            }
        });

        try {
            await Promise.all(promises);
            this.updateFacilitiesDisplay();
            
            const availableCount = Array.from(this.availabilityData.values()).filter(av => 
                av && av.body && av.body.details && av.body.details.daily_details && 
                av.body.details.daily_details[0] && av.body.details.daily_details[0].times.length > 0
            ).length;
            
            this.setStatus(`Found availability for ${availableCount} facilities on ${utils.formatDate(selectedDate)}`, 'success');
        } catch (error) {
            this.setStatus('Error searching availability', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async refreshData() {
        this.setLoading(true, 'Refreshing data...');
        
        try {
            await window.electronAPI.refreshCookies();
            await this.loadFacilities();
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.setStatus('Failed to refresh data', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    exportResults() {
        const exportData = {
            searchDate: this.bookingDateInput.value,
            timestamp: new Date().toISOString(),
            facilities: this.filteredFacilities.map(facility => {
                const availability = this.availabilityData.get(facility.id);
                return {
                    id: facility.id,
                    name: facility.name,
                    type: facility.type_name,
                    center: facility.center_name,
                    capacity: facility.max_capacity,
                    availability: availability
                };
            })
        };

        const filename = `facility-availability-${this.bookingDateInput.value}.json`;
        utils.exportToJSON(exportData, filename);
        this.setStatus(`Exported results to ${filename}`, 'success');
    }

    setLoading(isLoading, message = '') {
        this.isLoading = isLoading;
        this.loadingIndicator.classList.toggle('hidden', !isLoading);
        this.searchBtn.disabled = isLoading;
        this.refreshBtn.disabled = isLoading;
        
        if (isLoading && message) {
            this.loadingIndicator.querySelector('span').textContent = message;
        }
    }

    setStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-${type}`;
        
        setTimeout(() => {
            if (this.statusMessage.textContent === message) {
                this.statusMessage.textContent = '';
                this.statusMessage.className = '';
            }
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FacilityBookingUI();
});