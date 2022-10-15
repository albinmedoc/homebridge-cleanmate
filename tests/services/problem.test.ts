import { API, Logging } from 'homebridge';
import { createCleanmateServiceMock, createHomebridgeMock } from '../__mocks__';
import { ProblemSensor } from '../../src/services';
import Constants from '../constants';
import CleanmateService from '../../src/cleanmateService';
import { WorkState } from '../../src/types';

describe('Problem service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmateService: jest.Mocked<CleanmateService>;
  let problemSensor: ProblemSensor;
  let updateCharacteristicSpy: jest.SpyInstance;
  const log: Logging = console as unknown as Logging;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmateService = createCleanmateServiceMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    problemSensor = new ProblemSensor(homebridge.hap, log, Constants.FULL_CONFIG, cleanmateService);
    updateCharacteristicSpy = jest.spyOn(problemSensor.services[0], 'updateCharacteristic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(problemSensor.services).toHaveLength(1);
  });

  test('Update characteristic when workstate changes', () => {
    cleanmateService.events.emit('workStateChange', WorkState.Charging);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.MotionDetected, false);

    cleanmateService.events.emit('workStateChange', WorkState.Problem);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.MotionDetected, true);
  });

  test('Get problem state', () => {
    jest.spyOn(cleanmateService, 'workState', 'get').mockReturnValue(WorkState.Charging);
    expect(problemSensor['getProblemState']()).toEqual(false);

    jest.spyOn(cleanmateService, 'workState', 'get').mockReturnValue(WorkState.Problem);
    expect(problemSensor['getProblemState']()).toEqual(true);
  });
});