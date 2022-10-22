import { API, Logging } from 'homebridge';
import EntryPoint from '../src';
import CleanmatePlugin from '../src/cleanmatePlugin';
import { PLATFORM_NAME } from '../src/settings';
import { Config } from '../src/types';
import Constants from './constants';
import { createHomebridgeMock, createLoggingMock } from './mocks';

const minConfig: Config = {
  accessory: 'homebridge-cleanmate',
  name: 'homebridge-cleanmate',
  ipAddress: Constants.IP_ADDRESS,
  authCode: Constants.AUTH_CODE,
};

jest.useFakeTimers();
describe('Cleanmate plugin', () => {
  let homebridge: jest.Mocked<API>;
  let log: jest.Mocked<Logging>;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    log = createLoggingMock();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Should register the accessory', () => {
    expect(() => EntryPoint(homebridge)).not.toThrow();
    expect(homebridge.registerAccessory).toHaveBeenCalledWith(
      PLATFORM_NAME,
      expect.any(Function),
    );
  });

  test('Returns the accessory class', () => {
    expect(CleanmatePlugin).toHaveProperty('prototype');
    expect(CleanmatePlugin.prototype).toHaveProperty('getServices');
  });

  test('Can create Cleanmate plugin', () => {
    expect(() => new CleanmatePlugin(log, minConfig, homebridge)).not.toThrow();
  });

  test('Min config gives 4 services', () => {
    const plugin = new CleanmatePlugin(log, minConfig, homebridge);
    expect(plugin.getServices()).toHaveLength(4);
  });

  test('Config enabling all services gives 9 services', () => {
    const fullServiceConfig: Config = {
      ...minConfig,
      pauseSwitch: {
        enable: true,
      },
      motionSensor: {
        enable: true,
      },
      occupancySensor: {
        enable: true,
      },
      volume: {
        enable: true,
      },
      findSwitch: {
        enable: true,
      },
      rooms: [
        {
          id: 1,
          name: 'Room 1',
        },
      ],
    };
    const plugin = new CleanmatePlugin(log, fullServiceConfig, homebridge);
    expect(plugin.getServices()).toHaveLength(9);
  });

  test('Make robot talk when identify is called', () => {
    const plugin = new CleanmatePlugin(log, minConfig, homebridge);
    const findRobotSpy = jest.spyOn(plugin.cleanmateService, 'findRobot').mockImplementation();
    plugin.identify();
    expect(findRobotSpy).toBeCalled();
  });
});