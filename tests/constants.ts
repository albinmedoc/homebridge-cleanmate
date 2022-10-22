import { MopMode, PluginConfig } from '../src/types';

class Constants {
  IP_ADDRESS = '127.0.0.1';
  AUTH_CODE = 'ABCDEFGHIJ';

  FULL_CONFIG: PluginConfig = {
    accessory: 'homebridge-cleanmate',
    name: 'homebridge-cleanmate',
    ipAddress: this.IP_ADDRESS,
    authCode: this.AUTH_CODE,
    pollInterval: 0,
    lowBatteryPercentage: 15,
    clockwiseMode: MopMode.High,
    counterClockwiseMode: MopMode.Low,
    pauseSwitch: {
      enable: true,
      name: 'Pause',
      inverted: false,
    },
    motionSensor: {
      enable: true,
      name: 'Motion',
      inverted: false,
    },
    occupancySensor: {
      enable: true,
      name: 'Occupancy',
      inverted: false,
    },
    volume: {
      enable: true,
      name: 'Volume',
    },
    findSwitch: {
      enable: true,
      name: 'Find',
    },
    roomTimeout: 20,
    rooms: [
      {
        id: 1,
        name: 'Room 1',
      },
    ],
  };
}

export default new Constants();