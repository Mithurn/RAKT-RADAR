/**
 * Real-time Service for RAKT-RADAR Hackathon Demo
 * Handles communication across 3 laptops (Hospital, Blood Bank, Driver)
 * Uses HTTP polling for reliable real-time updates
 */

class RealtimeService {
    constructor() {
        this.baseUrl = 'http://localhost:8000';
        this.pollingIntervals = {};
        this.callbacks = {
            emergencyRequests: [],
            driverUpdates: [],
            systemStatus: []
        };
        this.isConnected = false;
        this.currentRole = null;
        this.lastUpdate = null;
    }

    /**
     * Connect to the real-time service
     * @param {string} role - 'hospital', 'blood_bank', or 'driver'
     * @param {string} serverUrl - Backend server URL (default: localhost:8000)
     */
    connect(role, serverUrl = 'http://localhost:8000') {
        this.currentRole = role;
        this.baseUrl = serverUrl;
        this.isConnected = true;
        
        console.log(`🔌 RealtimeService connected as ${role} to ${serverUrl}`);
        
        // Start polling for updates
        this.startPolling();
        
        return true;
    }

    /**
     * Start polling for real-time updates
     */
    startPolling() {
        // Poll emergency requests every 2 seconds
        this.pollingIntervals.emergencyRequests = setInterval(() => {
            this.pollEmergencyRequests();
        }, 2000);

        // Poll driver updates every 3 seconds
        this.pollingIntervals.driverUpdates = setInterval(() => {
            this.pollDriverUpdates();
        }, 3000);

        // Poll system status every 5 seconds
        this.pollingIntervals.systemStatus = setInterval(() => {
            this.pollSystemStatus();
        }, 5000);

        console.log('📡 Started real-time polling for all updates');
    }

    /**
     * Stop all polling
     */
    stopPolling() {
        Object.values(this.pollingIntervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        this.pollingIntervals = {};
        this.isConnected = false;
        console.log('🛑 Stopped all real-time polling');
    }

    /**
     * Poll for emergency requests
     */
    async pollEmergencyRequests() {
        try {
            const response = await fetch(`${this.baseUrl}/api/realtime/emergency-requests`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.notifyEmergencyRequests(data.data);
                }
            }
        } catch (error) {
            console.log('📡 Emergency requests polling error:', error);
        }
    }

    /**
     * Poll for driver updates
     */
    async pollDriverUpdates() {
        try {
            const response = await fetch(`${this.baseUrl}/api/realtime/driver-updates`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.notifyDriverUpdates(data.data);
                }
            }
        } catch (error) {
            console.log('📡 Driver updates polling error:', error);
        }
    }

    /**
     * Poll for system status
     */
    async pollSystemStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/realtime/status`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.system_status) {
                    this.notifySystemStatus(data.system_status);
                }
            }
        } catch (error) {
            console.log('📡 System status polling error:', error);
        }
    }

    /**
     * Subscribe to emergency request updates
     */
    onEmergencyRequests(callback) {
        this.callbacks.emergencyRequests.push(callback);
        return () => {
            const index = this.callbacks.emergencyRequests.indexOf(callback);
            if (index > -1) {
                this.callbacks.emergencyRequests.splice(index, 1);
            }
        };
    }

    /**
     * Subscribe to driver update updates
     */
    onDriverUpdates(callback) {
        this.callbacks.driverUpdates.push(callback);
        return () => {
            const index = this.callbacks.driverUpdates.indexOf(callback);
            if (index > -1) {
                this.callbacks.driverUpdates.splice(index, 1);
            }
        };
    }

    /**
     * Subscribe to system status updates
     */
    onSystemStatus(callback) {
        this.callbacks.systemStatus.push(callback);
        return () => {
            const index = this.callbacks.systemStatus.indexOf(callback);
            if (index > -1) {
                this.callbacks.systemStatus.splice(index, 1);
            }
        };
    }

    /**
     * Notify all emergency request subscribers
     */
    notifyEmergencyRequests(data) {
        this.callbacks.emergencyRequests.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Emergency requests callback error:', error);
            }
        });
    }

    /**
     * Notify all driver update subscribers
     */
    notifyDriverUpdates(data) {
        this.callbacks.driverUpdates.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Driver updates callback error:', error);
            }
        });
    }

    /**
     * Notify all system status subscribers
     */
    notifySystemStatus(data) {
        this.callbacks.systemStatus.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('System status callback error:', error);
            }
        });
    }

    /**
     * Get current connection status
     */
    getConnectionStatus() {
        return this.isConnected;
    }

    /**
     * Get current role
     */
    getCurrentRole() {
        return this.currentRole;
    }

    /**
     * Disconnect and cleanup
     */
    disconnect() {
        this.stopPolling();
        this.callbacks = {
            emergencyRequests: [],
            driverUpdates: [],
            systemStatus: []
        };
        console.log('🔌 RealtimeService disconnected');
    }

    /**
     * Convenience methods for different roles
     */
    connectAsHospital(serverUrl) {
        return this.connect('hospital', serverUrl);
    }

    connectAsBloodBank(serverUrl) {
        return this.connect('blood_bank', serverUrl);
    }

    connectAsDriver(serverUrl) {
        return this.connect('driver', serverUrl);
    }
}

// Create singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;
