import { API, Logging } from 'homebridge';
import { createCleanmateMock, createHomebridgeMock, createLoggingMock } from '../mocks';
import { ProblemSensor } from '../../src/services';
import Constants from '../constants';
import Cleanmate from 'cleanmate';
import { WorkState } from '../../src/types';

describe('Problem service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmate: jest.Mocked<Cleanmate>;
  let log: jest.Mocked<Logging>;
  let problemSensor: ProblemSensor;
  let updateCharacteristicSpy: jest.SpyInstance;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmate = createCleanmateMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    log = createLoggingMock();
    problemSensor = new ProblemSensor(homebridge.hap, log, Constants.FULL_CONFIG, cleanmate);
    updateCharacteristicSpy = jest.spyOn(problemSensor.services[0], 'updateCharacteristic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(problemSensor.services).toHaveLength(1);
  });

  test('Update characteristic when workstate changes', () => {
    cleanmate.events.emit('workStateChange', WorkState.Charging);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.MotionDetected, false);

    cleanmate.events.emit('workStateChange', WorkState.Problem);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.MotionDetected, true);
  });

  test('Get problem state', () => {
    jest.spyOn(cleanmate, 'workState', 'get').mockReturnValue(WorkState.Charging);
    expect(problemSensor['getProblemState']()).toEqual(false);

    jest.spyOn(cleanmate, 'workState', 'get').mockReturnValue(WorkState.Problem);
    expect(problemSensor['getProblemState']()).toEqual(true);
  });
});