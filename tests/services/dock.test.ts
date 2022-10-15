import { API, Logging } from 'homebridge';
import { createHomebridgeMock } from '../__mocks__/homebridge';
import { createCleanmateServiceMock } from '../__mocks__/cleanmateService';
import { DockSensor } from '../../src/services';
import Constants from '../constants';
import CleanmateService from '../../src/cleanmateService';
import { WorkState } from '../../src/types';

describe('Dock service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmateService: jest.Mocked<CleanmateService>;
  let dockSensor: DockSensor;
  let updateCharacteristicSpy: jest.SpyInstance;
  const log: Logging = console as unknown as Logging;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmateService = createCleanmateServiceMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    dockSensor = new DockSensor(homebridge.hap, log, Constants.FULL_CONFIG, cleanmateService);
    updateCharacteristicSpy = jest.spyOn(dockSensor.services[0], 'updateCharacteristic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(dockSensor.services).toHaveLength(1);
  });

  test('Update characteristic when workstate changes', () => {
    cleanmateService.events.emit('workStateChange', WorkState.Cleaning);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.OccupancyDetected, false);

    cleanmateService.events.emit('workStateChange', WorkState.Charging);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.OccupancyDetected, true);
  });

  test('Get dock state', () => {
    jest.spyOn(cleanmateService, 'workState', 'get').mockReturnValue(WorkState.Cleaning);
    expect(dockSensor['getDockState']()).toEqual(false);

    jest.spyOn(cleanmateService, 'workState', 'get').mockReturnValue(WorkState.Charging);
    expect(dockSensor['getDockState']()).toEqual(true);
  });
});