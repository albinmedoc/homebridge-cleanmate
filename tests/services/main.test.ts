import { API, Logging } from 'homebridge';
import { createCleanmateServiceMock, createHomebridgeMock } from '../__mocks__';
import { MainService } from '../../src/services';
import Constants from '../constants';
import CleanmateService from '../../src/cleanmateService';
import { MopMode, WorkMode, WorkState } from '../../src/types';

describe('Main service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmateService: jest.Mocked<CleanmateService>;
  let mainService: MainService;
  let updateCharacteristicSpy: jest.SpyInstance;
  const log: Logging = console as unknown as Logging;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmateService = createCleanmateServiceMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    mainService = new MainService(homebridge.hap, log, Constants.FULL_CONFIG, cleanmateService);
    updateCharacteristicSpy = jest.spyOn(mainService.services[0], 'updateCharacteristic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(mainService.services).toHaveLength(1);
  });

  test('Update characteristic when workstate changes', () => {
    cleanmateService.events.emit('workStateChange', WorkState.Charging);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.Active, false);

    jest.spyOn(cleanmateService, 'workMode', 'get').mockReturnValue(WorkMode.Standard);
    cleanmateService.events.emit('workStateChange', WorkState.Cleaning);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.Active, true);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.RotationSpeed, expect.anything());
  });

  test('Update characteristic when workmode changes', () => {
    cleanmateService.events.emit('workModeChange', WorkMode.Silent);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.RotationSpeed, expect.anything());
  });

  test('Update characteristic when mopmode changes', () => {
    cleanmateService.events.emit('mopModeChange', MopMode.High);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.RotationDirection, 0);

    cleanmateService.events.emit('mopModeChange', MopMode.Low);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.RotationDirection, 1);
  });

  test('Get active state', () => {
    jest.spyOn(cleanmateService, 'workState', 'get').mockReturnValue(WorkState.Paused);
    expect(mainService['getActiveState']()).toEqual(false);

    jest.spyOn(cleanmateService, 'workState', 'get').mockReturnValue(WorkState.Cleaning);
    expect(mainService['getActiveState']()).toEqual(true);
  });

  test('Set active state', () => {
    const pauseSpy = jest.spyOn(cleanmateService, 'pause').mockResolvedValue();
    mainService['setActiveState'](false);
    expect(pauseSpy).toBeCalled();

    const startSpy = jest.spyOn(cleanmateService, 'start').mockResolvedValue();
    mainService['setActiveState'](true);
    expect(startSpy).toBeCalled();
  });

  test('Get speed by workmode', () => {
    expect(mainService['getSpeedByWorkMode'](WorkMode.Silent)).toEqual(17);
    expect(mainService['getSpeedByWorkMode'](WorkMode.Standard)).toEqual(50);
    expect(mainService['getSpeedByWorkMode'](WorkMode.Intensive)).toEqual(82);
  });

  test('Get workmode by speed', () => {
    expect(mainService['getWorkModeBySpeed'](0)).toEqual(undefined);

    expect(mainService['getWorkModeBySpeed'](1)).toEqual(WorkMode.Silent);
    expect(mainService['getWorkModeBySpeed'](32)).toEqual(WorkMode.Silent);

    expect(mainService['getWorkModeBySpeed'](33)).toEqual(WorkMode.Standard);
    expect(mainService['getWorkModeBySpeed'](65)).toEqual(WorkMode.Standard);

    expect(mainService['getWorkModeBySpeed'](66)).toEqual(WorkMode.Intensive);
    expect(mainService['getWorkModeBySpeed'](100)).toEqual(WorkMode.Intensive);
  });

  test('Get speed state', () => {
    jest.spyOn(cleanmateService, 'workState', 'get').mockReturnValue(WorkState.Charging);
    expect(mainService['getSpeedState']()).toEqual(0);

    jest.spyOn(cleanmateService, 'workState', 'get').mockReturnValue(WorkState.Cleaning);

    jest.spyOn(cleanmateService, 'workMode', 'get').mockReturnValue(WorkMode.Silent);
    expect(mainService['getSpeedState']()).toEqual(17);

    jest.spyOn(cleanmateService, 'workMode', 'get').mockReturnValue(WorkMode.Standard);
    expect(mainService['getSpeedState']()).toEqual(50);

    jest.spyOn(cleanmateService, 'workMode', 'get').mockReturnValue(WorkMode.Intensive);
    expect(mainService['getSpeedState']()).toEqual(82);
  });

  test('Set speed state', () => {
    const chargeSpy = jest.spyOn(cleanmateService, 'charge').mockResolvedValue();
    mainService['setSpeedState'](0);
    expect(chargeSpy).toBeCalled();

    const startSpy = jest.spyOn(cleanmateService, 'start').mockResolvedValue();

    mainService['setSpeedState'](10);
    expect(startSpy).toHaveBeenCalledWith(WorkMode.Silent);

    mainService['setSpeedState'](45);
    expect(startSpy).toBeCalledWith(WorkMode.Standard);

    mainService['setSpeedState'](90);
    expect(startSpy).toBeCalledWith(WorkMode.Intensive);
  });

  test('Set rotation state', () => {

    jest.spyOn(cleanmateService, 'mopMode', 'get').mockReturnValue(MopMode.High);
    expect(mainService['getRotationState']()).toEqual(0);

    jest.spyOn(cleanmateService, 'mopMode', 'get').mockReturnValue(MopMode.Low);
    expect(mainService['getRotationState']()).toEqual(1);
  });

  test('Set rotation state', () => {
    const mopModeSpy = jest.spyOn(cleanmateService, 'setMopMode').mockResolvedValue();
    mainService['setRotationState'](0);
    expect(mopModeSpy).toBeCalledWith(MopMode.High);

    mainService['setRotationState'](1);
    expect(mopModeSpy).toBeCalledWith(MopMode.Low);
  });
});