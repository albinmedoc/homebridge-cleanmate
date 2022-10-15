import { API, Logging } from 'homebridge';
import { createHomebridgeMock } from '../__mocks__/homebridge';
import { createCleanmateServiceMock } from '../__mocks__/cleanmateService';
import { InformationService } from '../../src/services';
import Constants from '../constants';
import CleanmateService from '../../src/cleanmateService';

describe('Dock service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmateService: jest.Mocked<CleanmateService>;
  let informationService: InformationService;
  let updateCharacteristicSpy: jest.SpyInstance;
  const log: Logging = console as unknown as Logging;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmateService = createCleanmateServiceMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    informationService = new InformationService(homebridge.hap, log, Constants.FULL_CONFIG, cleanmateService);
    updateCharacteristicSpy = jest.spyOn(informationService.services[0], 'updateCharacteristic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(informationService.services).toHaveLength(1);
  });

  test('Update characteristic when version changes', () => {
    const version = 'Version 1';
    cleanmateService.events.emit('versionChange', version);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.FirmwareRevision, version);
  });

  test('Get version state', () => {
    const version = 'Version 2';
    jest.spyOn(cleanmateService, 'version', 'get').mockReturnValue(version);
    expect(informationService['getFirmwareRevisionState']()).toEqual(version);
  });
});