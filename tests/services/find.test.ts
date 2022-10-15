import { API, Logging } from 'homebridge';
import { createHomebridgeMock } from '../__mocks__/homebridge';
import { createCleanmateServiceMock } from '../__mocks__/cleanmateService';
import { FindSwitch } from '../../src/services';
import Constants from '../constants';
import CleanmateService from '../../src/cleanmateService';

describe('Find service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmateService: jest.Mocked<CleanmateService>;
  let findSwitch: FindSwitch;
  const log: Logging = console as unknown as Logging;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmateService = createCleanmateServiceMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
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