import { API, Logging } from 'homebridge';
import { createHomebridgeMock } from '../__mocks__/homebridge';
import { createCleanmateServiceMock } from '../__mocks__/cleanmateService';
import { VolumeService } from '../../src/services';
import Constants from '../constants';
import CleanmateService from '../../src/cleanmateService';
import { WorkState } from '../../src/types';

describe('Pause service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmateService: jest.Mocked<CleanmateService>;
  let volumeService: VolumeService;
  let updateCharacteristicSpy: jest.SpyInstance;
  const log: Logging = console as unknown as Logging;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmateService = createCleanmateServiceMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    volumeService = new VolumeService(homebridge.hap, log, Constants.FULL_CONFIG, cleanmateService);
    updateCharacteristicSpy = jest.spyOn(volumeService.services[0], 'updateCharacteristic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(volumeService.services).toHaveLength(1);
  });

  test('Get volume active state', () => {
    jest.spyOn(cleanmateService, 'volume', 'get').mockReturnValue(0);
    expect(volumeService['getVolumeState']()).toEqual(false);

    jest.spyOn(cleanmateService, 'volume', 'get').mockReturnValue(1);
    expect(volumeService['getVolumeState']()).toEqual(true);

    jest.spyOn(cleanmateService, 'volume', 'get').mockReturnValue(100);
    expect(volumeService['getVolumeState']()).toEqual(true);
  });

  test('Set volume active state', () => {
    const setVolumeSpy = jest.spyOn(cleanmateService, 'setVolume').mockResolvedValue();
    volumeService['setVolumeState'](false);
    expect(setVolumeSpy).toBeCalledWith(0);

    volumeService['setVolumeState'](true);
    expect(setVolumeSpy).toBeCalledWith(100);
  });

  test('Get volume level state', () => {
    const volume = 33;
    jest.spyOn(cleanmateService, 'volume', 'get').mockReturnValue(volume);
    expect(volumeService['getVolumeLevelState']()).toEqual(volume);
  });

  test('Set volume level state', () => {
    const setVolumeSpy = jest.spyOn(cleanmateService, 'setVolume').mockResolvedValue();

    volumeService['setVolumeLevelState'](0);
    expect(setVolumeSpy).toBeCalledWith(0);

    volumeService['setVolumeLevelState'](50);
    expect(setVolumeSpy).toBeCalledWith(50);

    volumeService['setVolumeLevelState'](100);
    expect(setVolumeSpy).toBeCalledWith(100);
  });
});