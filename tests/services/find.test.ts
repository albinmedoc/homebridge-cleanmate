import { API, Logging } from 'homebridge';
import { createCleanmateServiceMock, createHomebridgeMock, createLoggingMock } from '../__mocks__';
import { FindSwitch } from '../../src/services';
import Constants from '../constants';
import CleanmateService from '../../src/cleanmateService';

describe('Find service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmateService: jest.Mocked<CleanmateService>;
  let log: jest.Mocked<Logging>;
  let findSwitch: FindSwitch;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmateService = createCleanmateServiceMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    log = createLoggingMock();
    findSwitch = new FindSwitch(homebridge.hap, log, Constants.FULL_CONFIG, cleanmateService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(findSwitch.services).toHaveLength(1);
  });

  test('Set pause state', () => {
    const startSpy = jest.spyOn(cleanmateService, 'findRobot').mockResolvedValue();
    findSwitch['setFindState'](false);
    expect(startSpy).toBeCalledTimes(1);

    findSwitch['setFindState'](false);
    expect(startSpy).toBeCalledTimes(2);
  });
});