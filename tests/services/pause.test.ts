import { API, Logging } from 'homebridge';
import { createCleanmateServiceMock, createHomebridgeMock } from '../__mocks__';
import { PauseSwitch } from '../../src/services';
import Constants from '../constants';
import CleanmateService from '../../src/cleanmateService';
import { WorkState } from '../../src/types';

describe('Pause service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmateService: jest.Mocked<CleanmateService>;
  let pauseSwitch: PauseSwitch;
  let updateCharacteristicSpy: jest.SpyInstance;
  const log: Logging = console as unknown as Logging;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmateService = createCleanmateServiceMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    pauseSwitch = new PauseSwitch(homebridge.hap, log, Constants.FULL_CONFIG, cleanmateService);
    updateCharacteristicSpy = jest.spyOn(pauseSwitch.services[0], 'updateCharacteristic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(pauseSwitch.services).toHaveLength(1);
  });

  test('Update characteristic when workstate changes', () => {
    cleanmateService.events.emit('workStateChange', WorkState.Cleaning);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.On, false);

    cleanmateService.events.emit('workStateChange', WorkState.Paused);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.On, true);
  });

  test('Get pause state', () => {
    jest.spyOn(cleanmateService, 'workState', 'get').mockReturnValue(WorkState.Cleaning);
    expect(pauseSwitch['getPauseState']()).toEqual(false);

    jest.spyOn(cleanmateService, 'workState', 'get').mockReturnValue(WorkState.Paused);
    expect(pauseSwitch['getPauseState']()).toEqual(true);
  });

  test('Set pause state', () => {
    const startSpy = jest.spyOn(cleanmateService, 'start').mockResolvedValue();
    pauseSwitch['setPauseState'](false);
    expect(startSpy).toBeCalled();

    const pauseSpy = jest.spyOn(cleanmateService, 'pause').mockResolvedValue();
    pauseSwitch['setPauseState'](true);
    expect(pauseSpy).toBeCalled();
  });
});