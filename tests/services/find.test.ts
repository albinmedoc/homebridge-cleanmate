import { API, Logging } from 'homebridge';
import { createCleanmateMock, createHomebridgeMock, createLoggingMock } from '../mocks';
import { FindSwitch } from '../../src/services';
import Constants from '../constants';
import Cleanmate from 'cleanmate';

describe('Find service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmate: jest.Mocked<Cleanmate>;
  let log: jest.Mocked<Logging>;
  let findSwitch: FindSwitch;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmate = createCleanmateMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    log = createLoggingMock();
    findSwitch = new FindSwitch(homebridge.hap, log, Constants.FULL_CONFIG, cleanmate);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(findSwitch.services).toHaveLength(1);
  });

  test('Set pause state', () => {
    const startSpy = jest.spyOn(cleanmate, 'findRobot').mockResolvedValue();
    findSwitch['setFindState'](false);
    expect(startSpy).toBeCalledTimes(1);

    findSwitch['setFindState'](false);
    expect(startSpy).toBeCalledTimes(2);
  });
});