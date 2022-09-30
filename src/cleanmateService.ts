import events from 'events';
import TCPService from './tcpService';
import { strToHex, tryParseInt, stringifyRecord } from './helpers';
import { WorkMode, CleanmateStatus, StatusResponse, WorkState, MopMode } from './types';
import Constants from './constants';

class CleanmateService {
  ipAddress: string;
  authCode: string;

  status: CleanmateStatus = {
    batteryLevel: 0,
    version: '',
    workMode: WorkMode.Standard,
    workState: WorkState.Charging,
    mopMode: MopMode.Medium,
  };

  latestStatusResponse?: StatusResponse;
  lastStatusUpdate?: number;
  events: events;

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

  public on(eventName: string, callback: (value) => void) {
    this.events.on(eventName, callback);
  }

  private createRequest(prefix: string, transitCmd: number, value: Record<string, string | number>) {
    const request = {
      version: '1.0',
      control: {
        broadcast: '0',
        targetType: '2',
        targetId: 'C1F54FE0F16249689590EF3C6F04133B', // Looks like this can be anything with 32 characters
        authCode: this.authCode,
      },
      value: stringifyRecord({ ...value, transitCmd }),
    };
    const requesthex = strToHex(JSON.stringify(request));
    return `${prefix}${requesthex}`;
  }

  private updateStatus(): Promise<void> {
    const request = this.createRequest(Constants.StatusPrefix, 98, {
      state: '',
    });
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
    return tcpService.getResponse<StatusResponse>()
      .then((data) => {
        this.batteryLevel = tryParseInt(data.value.battery);
        this.version = data.value.version;
        this.workMode = tryParseInt(data.value.workMode);
        this.workState = tryParseInt(data.value.workState);
        this.mopMode = tryParseInt(data.value.waterTank);

        this.latestStatusResponse = data;
        this.lastStatusUpdate = Date.now();
      });
  }

  public start(workMode?: WorkMode) {
    let request = '';
    if (workMode) {
      request = this.createRequest(Constants.WorkModePrefix, 106, {
        mode: workMode,
      });
      this.status.workMode = workMode;
    } else {
      request = this.createRequest(Constants.StartPrefix, 100, {
        start: 1,
      });
    }
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
    this.status.workState = WorkState.Cleaning;
  }

  public pause() {
    const request = this.createRequest(Constants.PausePrefix, 102, {
      pause: 1,
      isStop: 0,
    });
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
    this.status.workState = WorkState.Paused;
  }

  public charge() {
    const request = this.createRequest(Constants.ChargePrefix, 104, {
      charge: 1,
    });
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
  }

  public setMopMode(mopMode: MopMode) {
    const request = this.createRequest(Constants.MopModePrefix, 145, {
      waterTank: mopMode,
      watertank: mopMode,
    });
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
  }
}

export default CleanmateService;