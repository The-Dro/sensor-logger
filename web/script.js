document.addEventListener('DOMContentLoaded', () => {

    const checkboxes = document.querySelectorAll('.module-controls input[type="checkbox"]');
    const modules = document.querySelectorAll('.module');
    let retryCount = 0;
    const MAX_RETRIES = 5;
    const BASE_DELAY = 1000; // 1 second
    let updateInterval = null;

    // Initialize Leaflet map
    let map = null;
    let marker = null;
    let path = [];
    let polyline = null;

    function initializeMap() {
        if (!map) {
            map = L.map('map', {
                attributionControl: false  // Remove attribution
            }).setView([0, 0], 13);
            
            // Use satellite imagery with topography from ESRI
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                attribution: false
            }).addTo(map);
            
            // Add topography contour lines as an overlay
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
                opacity: 0.3,
                attribution: false
            }).addTo(map);
            
            // Initialize polyline for the path with a more visible color
            polyline = L.polyline([], {
                color: '#ff2a6d',  // Use neon pink from your CSS variables
                weight: 4,
                opacity: 0.8
            }).addTo(map);
        }
    }

    // Create custom icon for location marker
    function createCustomIcon() {
        // Available icon options to choose from - uncomment one of these to change the icon:
        // const iconChar = '👤'; // Person
        // const iconChar = '📱'; // Mobile phone
        // const iconChar = '📍'; // Location pin
        // const iconChar = '🚶'; // Walking person
        // const iconChar = '🔴'; // Red circle
        // const iconChar = '⭐'; // Star
        // const iconChar = '📡'; // Satellite dish
        // const iconChar = '🧭'; // Compass
        // const iconChar = '🔷'; // Blue diamond
        // const iconChar = '💠'; // Diamond with dot
        
        const iconChar = '🚶'; // Default: Person icon
        
        return L.divIcon({
            html: `<i class="custom-marker">${iconChar}</i>`,
            className: 'custom-marker-container',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });
    }

    // Get the connection status indicator
    const statusIndicator = document.getElementById('connection-status');

    // Handle module visibility
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const moduleName = e.target.dataset.module;
            const module = document.getElementById(`${moduleName}-module`);
            module.style.display = e.target.checked ? 'block' : 'none';
            
            // Initialize map when location module is shown
            if (moduleName === 'location' && e.target.checked) {
                initializeMap();
            }
        });
    });

    // Function to update connection status
    function updateConnectionStatus(connected) {
        statusIndicator.textContent = connected ? 'Connected' : 'Disconnected';
        statusIndicator.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
    }

    // Function to update a value with animation
    function updateValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element && element.textContent !== value.toString()) {
            element.textContent = value;
            element.classList.add('updated');
            setTimeout(() => element.classList.remove('updated'), 300);
        }
    }

    // Function to process sensor data array and get the latest reading
    function getLatestReading(data, sensorName) {
        if (!data || !data.payload || !Array.isArray(data.payload)) {
            console.warn(`Invalid data format for ${sensorName}:`, data);
            return null;
        }
        
        const readings = data.payload.filter(item => {
            // Check both possible name formats
            const itemName = item.name || item.sensorName;
            return itemName === sensorName;
        });
        
        if (readings.length === 0) {
            console.debug(`No readings found for ${sensorName}`);
            return null;
        }
        
        return readings[readings.length - 1];
    }

    // Function to calculate retry delay
    function getRetryDelay() {
        return Math.min(BASE_DELAY * Math.pow(2, retryCount), 30000); // Max 30 seconds
    }

    // Function to update map with new location
    function updateMap(lat, lon) {
        if (!map) return;

        const newLatLng = [lat, lon];
        
        // Update or create marker
        if (!marker) {
            marker = L.marker(newLatLng, {
                icon: createCustomIcon()
            }).addTo(map);
        } else {
            marker.setLatLng(newLatLng);
        }

        // Add point to path
        path.push(newLatLng);
        polyline.setLatLngs(path);

        // Center map on new location
        map.setView(newLatLng);
    }

    // Get the base URL for the API
    function getBaseUrl() {
        // Use the hardcoded server address instead of the current window location
        //CHANGE THIS TO THE IP OF THE SERVER
        return 'http://10.0.0.3:8000';
    }

    // function getBaseUrl() {
    //     return window.location.origin;
    // }

    // function getBaseUrl() {
    //     const baseUrl = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
    //     console.log('Base URL:', baseUrl);  // Log the base URL
    //     return baseUrl;
    // }
    
    // function getBaseUrl() {
    //     return baseUrl;
    // }
    


    

    // Function to fetch and update sensor data
    async function updateSensorData() {
        try {
            console.debug('Fetching sensor data...');
            const apiUrl = getBaseUrl() + '/sensor-data';
            console.debug('API URL:', apiUrl);
            
            // Simple fetch without custom headers to avoid CORS preflight
            // const response = await fetch(apiUrl);

            // added 5 secs timeout to the fetch
            const response = await fetch(apiUrl, { timeout: 5000 }); // 5 seconds timeout


            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Log raw response for debugging
            const rawText = await response.text();
            console.debug('Raw response:', rawText);
            
            // Parse the JSON manually to catch any errors
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response was:', rawText.substring(0, 100) + '...');
                throw parseError;
            }
            
            console.debug('Received sensor data:', data);
            
            // Reset retry count on successful connection
            retryCount = 0;
            updateConnectionStatus(true);

            // Update accelerometer data
            const accelData = getLatestReading(data, 'accelerometer');
            if (accelData) {
                const values = accelData.values || accelData;
                updateValue('accel-x', values.x?.toFixed(4) || '--');
                updateValue('accel-y', values.y?.toFixed(4) || '--');
                updateValue('accel-z', values.z?.toFixed(4) || '--');
            }

            // Update gyroscope data
            const gyroData = getLatestReading(data, 'gyroscope');
            if (gyroData) {
                const values = gyroData.values || gyroData;
                updateValue('gyro-x', values.x?.toFixed(4) || '--');
                updateValue('gyro-y', values.y?.toFixed(4) || '--');
                updateValue('gyro-z', values.z?.toFixed(4) || '--');
            }

            // Update magnetometer data
            const magData = getLatestReading(data, 'magnetometer');
            if (magData) {
                const values = magData.values || magData;
                updateValue('mag-bearing', values.magneticBearing?.toFixed(2) || '--');
                if (magData.accuracy) {
                    updateValue('mag-accuracy', magData.accuracy);
                }
            }

            // Update compass data
            const compassData = getLatestReading(data, 'compass');
            if (compassData) {
                const values = compassData.values || compassData;
                updateValue('compass-bearing', values.magneticBearing?.toFixed(2) || '--');
                if (compassData.accuracy) {
                    updateValue('compass-accuracy', compassData.accuracy);
                }
            }

            // Update orientation data
            const orientationData = getLatestReading(data, 'orientation');
            if (orientationData) {
                const values = orientationData.values || orientationData;
                updateValue('orientation-yaw', values.yaw?.toFixed(4) || '--');
                updateValue('orientation-pitch', values.pitch?.toFixed(4) || '--');
                updateValue('orientation-roll', values.roll?.toFixed(4) || '--');
                updateValue('orientation-qx', values.qx?.toFixed(4) || '--');
                updateValue('orientation-qy', values.qy?.toFixed(4) || '--');
                updateValue('orientation-qz', values.qz?.toFixed(4) || '--');
                updateValue('orientation-qw', values.qw?.toFixed(4) || '--');
            }

            // Update gravity data
            const gravityData = getLatestReading(data, 'gravity');
            if (gravityData) {
                const values = gravityData.values || gravityData;
                updateValue('gravity-x', values.x?.toFixed(4) || '--');
                updateValue('gravity-y', values.y?.toFixed(4) || '--');
                updateValue('gravity-z', values.z?.toFixed(4) || '--');
            }

            // Update microphone data
            const micData = getLatestReading(data, 'microphone');
            if (micData) {
                const values = micData.values || micData;
                // Try both dbfs and dBFS property names
                const dbValue = values.dbfs || values.dBFS;
                updateValue('mic-dbfs', dbValue?.toFixed(2) || '--');
            }

            // Update location data
            const locationData = getLatestReading(data, 'location');
            if (locationData) {
                const values = locationData.values || locationData;
                updateValue('location-lat', values.latitude?.toFixed(6) || '--');
                updateValue('location-lon', values.longitude?.toFixed(6) || '--');
                updateValue('location-alt', values.altitude?.toFixed(2) || '--');
                updateValue('location-accuracy', values.accuracy?.toFixed(2) || '--');
                updateValue('location-speed', values.speed?.toFixed(2) || '--');

                if (values.latitude && values.longitude) {
                    updateMap(values.latitude, values.longitude);
                }
            }

        } catch (error) {
            console.error('Error updating sensor data:', error);
            updateConnectionStatus(false);
            
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                const delay = getRetryDelay();
                console.log(`Retrying in ${delay/1000} seconds... (Attempt ${retryCount}/${MAX_RETRIES})`);
                setTimeout(updateSensorData, delay);
            }
        }
    }

    // Start polling for updates
    function startPolling() {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
        updateInterval = setInterval(updateSensorData, 1000);
    }

    // Initialize map if location module is visible
    if (document.getElementById('location-module').style.display !== 'none') {
        initializeMap();
    }

    // Start polling for updates
    startPolling();
}); 