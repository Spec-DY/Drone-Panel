export interface UnityData {
  deviceId: string;
  formattedTime: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  pitch: number;
  yaw: number;
  roll: number;
  speed: number;
  velocity: {
    x: number;
    y: number;
    z: number;
  };
  horizontalSpeed: number;
  verticalSpeed: number;
  flightDirection: number;
  groundDistance: number;
}
