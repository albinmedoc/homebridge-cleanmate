import events from 'events';
import { Blob } from 'buffer';
import TCPService from './tcpService';
import { strToHex, tryParseInt } from './helpers';
import { WorkMode, CleanmateStatus, StatusResponse, WorkState, MopMode } from './types';

class CleanmateService {
  public ipAddress: string;
  public authCode: string;
  public events: events;

  private port = 8888;

  private status: CleanmateStatus = {
    batteryLevel: 0,
    version: '',
    workMode: WorkMode.Standard,
    workState: WorkState.Charging,
    mopMode: MopMode.Medium,
    volume: 2,
  };

  constructor(ipAddress: string, authCode: string, pollInterval: number = 15) {
    this.ipAddress = ipAddress;
    this.authCode = authCode;
    this.events = new events.EventEmitter();

    /* Update status of Cleanmate robot at an interval */
    setInterval(() => {
      this.updateStatus();
    }, 1000 * pollInterval);
  }

  public get batteryLevel(): number {
    return this.status.batteryLevel || 0;
  }

  private set batteryLevel(value: number) {
    this.events.emit('batteryLevelChange', value);
    this.status.batteryLevel = value;
  }

  public get version(): string {
    return this.status.version;
  }

  private set version(value: string) {
    this.events.emit('versionChange', value);
    this.status.version = value;
  }

  public get workMode(): WorkMode {
    return this.status.workMode;
  }

  private set workMode(value: WorkMode) {
    this.events.emit('workModeChange', value);
    this.status.workMode = value;
  }

  public get workState(): WorkState {
    return this.status.workState;
  }

  private set workState(value: WorkState) {
    this.events.emit('workStateChange', value);
    this.status.workState = value;
  }

  public get mopMode(): MopMode {
    return this.status.mopMode;
  }

  private set mopMode(value: MopMode) {
    this.events.emit('mopModeChange', value);
    this.status.mopMode = value;
  }

  public get volume(): number {
    return this.status.volume;
  }

  private set volume(value: number) {
    this.events.emit('volumeChange', value);
    this.status.volume = value;
  }

  public on(eventName: string, callback: (value) => void) {
    this.events.on(eventName, callback);
  }

  private formatHexLength(hex: string): string {
    const temp = '0'.repeat(8 - hex.length) + hex;
    let out = '';
    for (let x = temp.length - 1; x > 0; x -= 2) {
      out += temp[x - 1] + temp[x];
    }
    return out;
  }

  private createRequest(value: Record<string, unknown>): string {
    const request = JSON.stringify({
      version: '1.0',
      control: {
        broadcast: '0',
        targetType: '2',
        targetId: 'C1F54FE0F16249689590EF3C6F04133B', // Looks like this can be anything with 32 characters
        authCode: this.authCode,
      },
      value,
    });
    const requestSize = new Blob([request]).size + 20;
    const requestSizeHex = requestSize.toString(16);
    const requesthex = strToHex(request);

    return `${this.formatHexLength(requestSizeHex)}fa00000001000000c527000001000000${requesthex}`;
  }

  private updateStatus(): Promise<void> {
    const request = this.createRequest({
      state: '',
      transitCmd: '98',
    });
    const tcpService = new TCPService(this.ipAddress, this.port);
    tcpService.sendPacket(request);
    return tcpService.getResponse<StatusResponse>()
      .then((data) => {
        this.batteryLevel = tryParseInt(data.value.battery);
        this.version = data.value.version;
        this.workMode = tryParseInt(data.value.workMode);
        this.workState = tryParseInt(data.value.workState);
        this.mopMode = tryParseInt(data.value.waterTank);
        this.volume = this.mapToVolume(tryParseInt(data.value.voice));
      });
  }

  public start(workMode?: WorkMode) {
    let request = '';
    if (workMode) {
      request = this.createRequest({
        mode: workMode.toString(),
        transitCmd: '106',
      });
      this.status.workMode = workMode;
    } else {
      request = this.createRequest({
        start: '1',
        transitCmd: '100',
      });
    }
    const tcpService = new TCPService(this.ipAddress, this.port);
    tcpService.sendPacket(request);
    this.status.workState = WorkState.Cleaning;
  }

  public pause() {
    const request = this.createRequest({
      pause: '1',
      isStop: '0',
      transitCmd: '102',
    });
    const tcpService = new TCPService(this.ipAddress, this.port);
    tcpService.sendPacket(request);
    this.status.workState = WorkState.Paused;
  }

  public charge() {
    const request = this.createRequest({
      charge: '1',
      transitCmd: '104',
    });
    const tcpService = new TCPService(this.ipAddress, this.port);
    tcpService.sendPacket(request);
  }

  public setMopMode(mopMode: MopMode) {
    const request = this.createRequest({
      waterTank: mopMode.toString(),
      watertank: mopMode.toString(),
      transitCmd: '145',
    });
    const tcpService = new TCPService(this.ipAddress, this.port);
    tcpService.sendPacket(request);
  }

  private mapToVolume(value: number): number {
    return (value - 1) * 100;
  }

  private mapFromVolume(volume: number): number {
    return 1 + Math.round((volume/100) * 10) / 10;
  }

  public setVolume(volumeLevel: number) {
    if(volumeLevel < 0 || volumeLevel > 100){
      throw new Error('Volume level has to be between 0-100');
    }
    const volume = this.mapFromVolume(volumeLevel);
    const request = this.createRequest({
      volume: volume.toString(),
      voice: '',
      transitCmd: '123',
    });

    const tcpService = new TCPService(this.ipAddress, this.port);
    tcpService.sendPacket(request);
    this.status.volume = volume;
  }

  public cleanRooms(roomIds: number[]){
    const uniqueSortedRoomIds = [...new Set(roomIds)].sort();
    const cleanBlocks = uniqueSortedRoomIds.map((roomId) => ({
      'cleanNum': '1',
      'blockNum': roomId.toString(),
    }));
    const request = this.createRequest({
      'opCmd': 'cleanBlocks',
      cleanBlocks,
    });

    const tcpService = new TCPService(this.ipAddress, this.port);
    tcpService.sendPacket(request);
    this.workState = WorkState.Cleaning;
  }
}

export default CleanmateService;