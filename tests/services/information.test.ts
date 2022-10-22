import { API, Logging } from 'homebridge';
import { createCleanmateMock, createHomebridgeMock, createLoggingMock } from '../mocks';
import { InformationService } from '../../src/services';
import Constants from '../constants';
import Cleanmate from 'cleanmate';

describe('Dock service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmate: jest.Mocked<Cleanmate>;
  let log: jest.Mocked<Logging>;
  let informationService: InformationService;
  let updateCharacteristicSpy: jest.SpyInstance;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmate = createCleanmateMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    log = createLoggingMock();
    informationService = new InformationService(homebridge.hap, log, Constants.FULL_CONFIG, cleanmate);
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
    cleanmate.events.emit('versionChange', version);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.FirmwareRevision, version);
  });

  test('Get version state', () => {
    const version = 'Version 2';
    jest.spyOn(cleanmate, 'version', 'get').mockReturnValue(version);
    expect(informationService['getFirmwareRevisionState']()).toEqual(version);
  });
});