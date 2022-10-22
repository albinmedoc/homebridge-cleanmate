import { API, Logging } from 'homebridge';
import { createCleanmateMock, createHomebridgeMock, createLoggingMock } from '../mocks';
import { VolumeService } from '../../src/services';
import Constants from '../constants';
import Cleanmate from 'cleanmate';

describe('Pause service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmate: jest.Mocked<Cleanmate>;
  let log: jest.Mocked<Logging>;
  let volumeService: VolumeService;
  let updateCharacteristicSpy: jest.SpyInstance;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmate = createCleanmateMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    log = createLoggingMock();
    volumeService = new VolumeService(homebridge.hap, log, Constants.FULL_CONFIG, cleanmate);
    updateCharacteristicSpy = jest.spyOn(volumeService.services[0], 'updateCharacteristic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(volumeService.services).toHaveLength(1);
  });

  test('Update characteristic when volume changes', () => {
    cleanmate.events.emit('volumeChange', 0);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.On, false);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.Brightness, 0);

    cleanmate.events.emit('volumeChange', 100);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.On, true);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.Brightness, 100);
  });

  test('Get volume active state', () => {
    jest.spyOn(cleanmate, 'volume', 'get').mockReturnValue(0);
    expect(volumeService['getVolumeState']()).toEqual(false);

    jest.spyOn(cleanmate, 'volume', 'get').mockReturnValue(1);
    expect(volumeService['getVolumeState']()).toEqual(true);

    jest.spyOn(cleanmate, 'volume', 'get').mockReturnValue(100);
    expect(volumeService['getVolumeState']()).toEqual(true);
  });

  test('Set volume active state', () => {
    const setVolumeSpy = jest.spyOn(cleanmate, 'setVolume').mockResolvedValue();
    volumeService['setVolumeState'](false);
    expect(setVolumeSpy).toBeCalledWith(0);

    volumeService['setVolumeState'](true);
    expect(setVolumeSpy).toBeCalledWith(100);
  });

  test('Get volume level state', () => {
    const volume = 33;
    jest.spyOn(cleanmate, 'volume', 'get').mockReturnValue(volume);
    expect(volumeService['getVolumeLevelState']()).toEqual(volume);
  });

  test('Set volume level state', () => {
    const setVolumeSpy = jest.spyOn(cleanmate, 'setVolume').mockResolvedValue();

    volumeService['setVolumeLevelState'](0);
    expect(setVolumeSpy).toBeCalledWith(0);

    volumeService['setVolumeLevelState'](50);
    expect(setVolumeSpy).toBeCalledWith(50);

    volumeService['setVolumeLevelState'](100);
    expect(setVolumeSpy).toBeCalledWith(100);
  });
});