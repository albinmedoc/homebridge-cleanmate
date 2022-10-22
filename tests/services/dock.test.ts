import { API, Logging } from 'homebridge';
import { createCleanmateMock, createHomebridgeMock, createLoggingMock } from '../mocks';
import { DockSensor } from '../../src/services';
import Constants from '../constants';
import Cleanamte from 'cleanmate';
import { WorkState } from '../../src/types';

describe('Dock service', () => {
  let cleanmate: jest.Mocked<Cleanamte>;
  let homebridge: jest.Mocked<API>;
  let log: jest.Mocked<Logging>;
  let dockSensor: DockSensor;
  let updateCharacteristicSpy: jest.SpyInstance;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmate = createCleanmateMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    log = createLoggingMock();
    dockSensor = new DockSensor(homebridge.hap, log, Constants.FULL_CONFIG, cleanmate);
    updateCharacteristicSpy = jest.spyOn(dockSensor.services[0], 'updateCharacteristic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(dockSensor.services).toHaveLength(1);
  });

  test('Update characteristic when workstate changes', () => {
    cleanmate.events.emit('workStateChange', WorkState.Cleaning);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.OccupancyDetected, false);

    cleanmate.events.emit('workStateChange', WorkState.Charging);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.OccupancyDetected, true);
  });

  test('Get dock state', () => {
    jest.spyOn(cleanmate, 'workState', 'get').mockReturnValue(WorkState.Cleaning);
    expect(dockSensor['getDockState']()).toEqual(false);

    jest.spyOn(cleanmate, 'workState', 'get').mockReturnValue(WorkState.Charging);
    expect(dockSensor['getDockState']()).toEqual(true);
  });
});