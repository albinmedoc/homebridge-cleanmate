import { API, Logging } from 'homebridge';
import { createCleanmateMock, createHomebridgeMock, createLoggingMock } from '../mocks';
import { RoomService } from '../../src/services';
import Constants from '../constants';
import Cleanmate from 'cleanmate';
import { PluginConfig } from '../../src/types';

describe('Dock service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmate: jest.Mocked<Cleanmate>;
  let log: jest.Mocked<Logging>;
  let roomService: RoomService;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmate = createCleanmateMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    log = createLoggingMock();
    roomService = new RoomService(homebridge.hap, log, Constants.FULL_CONFIG, cleanmate);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function addRoom(config: PluginConfig, roomId: number): PluginConfig{
    return {
      ...config,
      rooms: [
        ...config.rooms,
        {
          id: roomId,
          name: `Room ${roomId}`,
        },
      ],
    };
  }

  test('Correct number of services', () => {
    expect(roomService.services).toHaveLength(1);

    let config = addRoom(Constants.FULL_CONFIG, 2);
    roomService = new RoomService(homebridge.hap, log, config, cleanmate);
    expect(roomService.services).toHaveLength(2);

    config = addRoom(config, 3);
    roomService = new RoomService(homebridge.hap, log, config, cleanmate);
    expect(roomService.services).toHaveLength(3);
  });

  test('Can create room service', () => {
    expect(roomService.services).toHaveLength(1);

    const room = {
      id: 2,
      name: 'Room 2',
    };

    roomService['createRoom'](room);
    expect(Object.keys(roomService['rooms'])).toHaveLength(2);
    expect(Object.keys(roomService['rooms'])).toContain(room.id.toString());
    expect(roomService.services).toHaveLength(2);
  });

  test('Set room active state', () => {
    const room = Constants.FULL_CONFIG.rooms[0];
    const resetTimeoutSpy = jest.spyOn(RoomService.prototype as never, 'resetTimeout').mockImplementation();

    expect([...roomService['roomsToClean']]).toHaveLength(0);
    expect(resetTimeoutSpy).toBeCalledTimes(0);

    roomService['setRoomActiveState'](true, room);
    expect([...roomService['roomsToClean']]).toHaveLength(1);
    expect(resetTimeoutSpy).toBeCalledTimes(1);

    roomService['setRoomActiveState'](false, room);
    expect([...roomService['roomsToClean']]).toHaveLength(0);
    expect(resetTimeoutSpy).toBeCalledTimes(2);
  });

  test('Get room active state', () => {
    const room = Constants.FULL_CONFIG.rooms[0];
    expect(roomService['getRoomActiveState'](room)).toEqual(false);

    roomService['setRoomActiveState'](true, room);
    expect(roomService['getRoomActiveState'](room)).toEqual(true);

    roomService['setRoomActiveState'](false, room);
    expect(roomService['getRoomActiveState'](room)).toEqual(false);
  });

  test('Clean rooms after timeout', () => {
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
    const room = Constants.FULL_CONFIG.rooms[0];

    roomService['setRoomActiveState'](true, room);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), Constants.FULL_CONFIG.roomTimeout * 1000);
  });
});