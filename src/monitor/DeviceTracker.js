/**
 * DeviceTracker - Tracks completion status of interactive devices
 * Integrates with conversation system to block/unblock player options
 */

export class DeviceTracker {
  constructor() {
    this.devices = {
      equalizer_game: false,
      military_radio: false,
      power_source: false
    };
    
    this.isPowerAvailable = false;
    this.onDeviceCompleteCallbacks = [];
    
    // Make globally accessible
    window.deviceTracker = this;
    
    console.log('DeviceTracker initialized');
  }
  
  /**
   * Mark a device as complete
   */
  completeDevice(deviceName) {
    if (this.devices.hasOwnProperty(deviceName)) {
      console.log(`Device completed: ${deviceName}`);
      this.devices[deviceName] = true;
      
      // Special handling for power source
      if (deviceName === 'power_source') {
        this.isPowerAvailable = true;
        console.log('Power is now available');
      }
      
      // Trigger callbacks
      this.onDeviceCompleteCallbacks.forEach(callback => {
        callback(deviceName);
      });
    }
  }
  
  /**
   * Check if a device is complete
   */
  isDeviceComplete(deviceName) {
    return this.devices[deviceName] === true;
  }
  
  /**
   * Register callback for when device completes
   */
  onDeviceComplete(callback) {
    this.onDeviceCompleteCallbacks.push(callback);
  }
  
  /**
   * Check if all devices are complete
   */
  areAllDevicesComplete() {
    return Object.values(this.devices).every(status => status === true);
  }
}

