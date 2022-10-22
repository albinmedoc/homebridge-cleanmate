import { API, Logging } from 'homebridge';
import { createCleanmateMock, createHomebridgeMock, createLoggingMock } from '../mocks';
import { PauseSwitch } from '../../src/services';
import Constants from '../constants';
import Cleanamte from 'cleanmate';
import { WorkState } from '../../src/types';

describe('Pause service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmate: jest.Mocked<Cleanamte>;
  let log: jest.Mocked<Logging>;
  let pauseSwitch: PauseSwitch;
  let updateCharacteristicSpy: jest.SpyInstance;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmate = createCleanmateMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    log = createLoggingMock();
    pauseSwitch = new PauseSwitch(homebridge.hap, log, Constants.FULL_CONFIG, cleanmate);
    updateCharacteristicSpy = jest.spyOn(pauseSwitch.services[0], 'updateCharacteristic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(pauseSwitch.services).toHaveLength(1);
  });

  test('Update characteristic when workstate changes', () => {
    cleanmate.events.emit('workStateChange', WorkState.Cleaning);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.On, false);

    cleanmate.events.emit('workStateChange', WorkState.Paused);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.On, true);
  });

  test('Get pause state', () => {
    jest.spyOn(cleanmate, 'workState', 'get').mockReturnValue(WorkState.Cleaning);
    expect(pauseSwitch['getPauseState']()).toEqual(false);

    jest.spyOn(cleanmate, 'workState', 'get').mockReturnValue(WorkState.Paused);
    expect(pauseSwitch['getPauseState']()).toEqual(true);
  });

  test('Set pause state', () => {
    const startSpy = jest.spyOn(cleanmate, 'start').mockResolvedValue();
    pauseSwitch['setPauseState'](false);
    expect(startSpy).toBeCalled();

    const pauseSpy = jest.spyOn(cleanmate, 'pause').mockResolvedValue();
    pauseSwitch['setPauseState'](true);
    expect(pauseSpy).toBeCalled();
  });
});