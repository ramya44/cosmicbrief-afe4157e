const DEVICE_ID_KEY = 'forecast_device_id';

/**
 * Get or create a device ID for rate limiting purposes.
 * Stored in localStorage for persistence across sessions.
 */
export function getDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch {
    // Fallback for private browsing or storage errors
    return crypto.randomUUID();
  }
}

/**
 * Clear the device ID (useful for testing)
 */
export function clearDeviceId(): void {
  try {
    localStorage.removeItem(DEVICE_ID_KEY);
  } catch {
    // Ignore storage errors
  }
}
