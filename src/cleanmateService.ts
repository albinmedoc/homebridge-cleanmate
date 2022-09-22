import TCPService from './tcpService';
import { strToHex, tryParseInt, stringifyRecord } from './helpers';
import { WorkMode, CleanmateStatus, StatusResponse, WorkState, MopMode } from './types';
import Constants from './constants';

class CleanmateService {
  ipAddress: string;
  authCode: string;

  status: CleanmateStatus = {};

  latestStatusResponse?: StatusResponse;
  lastStatusUpdate?: number;

  constructor(ipAddress: string, authCode: string) {
    this.ipAddress = ipAddress;
    this.authCode = authCode;
  }

  createRequest(prefix: string, transitCmd: number, value: Record<string, string | number>) {
    const request = {
      version: '1.0',
      control: {
        broadcast: '0',
        targetType: '2',
        targetId: 'C1F54FE0F16249689590EF3C6F04133B', // Looks like this can be anything with 32 characters
        authCode: this.authCode,
      },
      value: stringifyRecord({...value, transitCmd}),
    };
    const requesthex = strToHex(JSON.stringify(request));
    return `${prefix}${requesthex}`;
  }

  updateStatus(): Promise<CleanmateStatus> {
    const request = this.createRequest(Constants.StatusPrefix, 98, {
      state: '',
    });
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
    return tcpService.getResponse<StatusResponse>()
      .then((data) => {
        this.status = {
          batteryLevel: tryParseInt(data.value.battery),
          mopMode: tryParseInt(data.value.waterTank),
          version: data.value.version,
          workMode: tryParseInt(data.value.workMode),
          workState: tryParseInt(data.value.workState),
        };
        this.latestStatusResponse = data;
        this.lastStatusUpdate = Date.now();
        return this.status;
      });
  }

  start(workMode?: WorkMode) {
    let request = '';
    if(workMode) {
      request = this.createRequest(Constants.WorkModePrefix, 106, {
        mode: workMode,
      });
      this.status.workMode = workMode;
    }else {
      request = this.createRequest(Constants.StartPrefix, 100, {
        start: 1,
      });
    }
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
    this.status.workState = WorkState.Cleaning;
  }

  pause() {
    const request = this.createRequest(Constants.PausePrefix, 102, {
      pause: 1,
      isStop: 0,
    });
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
    this.status.workState = WorkState.Paused;
  }

  charge() {
    const request = this.createRequest(Constants.ChargePrefix, 104, {
      charge: 1,
    });
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
  }

  setMopMode(mopMode: MopMode) {
    const request = this.createRequest(Constants.MopModePrefix, 145, {
      waterTank: mopMode,
      watertank: mopMode,
    });
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
  }
}

export default CleanmateService;