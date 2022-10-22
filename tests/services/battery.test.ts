import { API, Logging } from 'homebridge';
import { createCleanmateMock, createHomebridgeMock, createLoggingMock } from '../mocks';
import { BatteryService } from '../../src/services';
import Constants from '../constants';
import type Cleanmate from 'cleanmate';
import { WorkState } from '../../src/types';

describe('Battery service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmate: jest.Mocked<Cleanmate>;
  let log: jest.Mocked<Logging>;
  let batteryService: BatteryService;
  let updateCharacteristicSpy: jest.SpyInstance;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmate = createCleanmateMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    log = createLoggingMock();
    batteryService = new BatteryService(homebridge.hap, log, Constants.FULL_CONFIG, cleanmate);
    updateCharacteristicSpy = jest.spyOn(batteryService.services[0], 'updateCharacteristic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(batteryService.services).toHaveLength(1);
  });

  test('Update characteristic when battery level changes', () => {
    cleanmate.events.emit('batteryLevelChange', 50);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.BatteryLevel, 50);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.StatusLowBattery, 0);

    cleanmate.events.emit('batteryLevelChange', 5);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.BatteryLevel, 5);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.StatusLowBattery, 1);
  });

  test('Update characteristic when workstate changes', () => {
    cleanmate.events.emit('workStateChange', WorkState.Cleaning);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.ChargingState, 0);

    cleanmate.events.emit('workStateChange', WorkState.Charging);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.ChargingState, 1);
  });

  test('Get low battery state', () => {
    jest.spyOn(cleanmate, 'batteryLevel', 'get').mockReturnValue(50);
    expect(batteryService['getLowBatteryState']()).toEqual(0);

    jest.spyOn(cleanmate, 'batteryLevel', 'get').mockReturnValue(5);
    expect(batteryService['getLowBatteryState']()).toEqual(1);
  });

  test('Get battery level state', () => {
    jest.spyOn(cleanmate, 'batteryLevel', 'get').mockReturnValue(50);
    expect(batteryService['getBatteryLevelState']()).toEqual(50);

    jest.spyOn(cleanmate, 'batteryLevel', 'get').mockReturnValue(5);
    expect(batteryService['getBatteryLevelState']()).toEqual(5);
  });

  test('Get charging state', () => {
    jest.spyOn(cleanmate, 'workState', 'get').mockReturnValue(WorkState.Cleaning);
    expect(batteryService['getChargingState']()).toEqual(0);

    jest.spyOn(cleanmate, 'workState', 'get').mockReturnValue(WorkState.Charging);
    expect(batteryService['getChargingState']()).toEqual(1);
  });
});