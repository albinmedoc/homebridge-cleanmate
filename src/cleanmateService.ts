import TCPService from './tcpService';
import { strToHex, tryParseInt } from './helpers';
import { WorkMode, CleanmateStatus, StatusResponse } from './types';

class CleanmateService {
  ipAddress: string;
  authCode: string;

  status: CleanmateStatus = {};

  latestStatusResponse?: StatusResponse;

  constructor(ipAddress: string, authCode: string) {
    this.ipAddress = ipAddress;
    this.authCode = authCode;
  }

  createRequest(prefix: string, value: Record<string, string>) {
    const request = {
      version: '1.0',
      control: {
        broadcast: '0',
        targetType: '2',
        targetId: 'C1F54FE0F16249689590EF3C6F04133B', // Looks like this can be anything with 32 characters
        authCode: this.authCode ?? '3592407072',
      },
      value,
    };
    const requesthex = strToHex(JSON.stringify(request));
    return `${prefix}${requesthex}`;
  }

  updateStatus(): Promise<CleanmateStatus> {
    const request = this.createRequest('bf000000fa000000010000001727000001000000', {
      state: '',
      transitCmd: '98',
    });
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
    return tcpService.getResponse<StatusResponse>()
      .then((data) => {
        this.status = {
          batteryLevel: tryParseInt(data.value.battery),
          waterLevel: tryParseInt(data.value.waterTank),
          version: data.value.version,
          workMode: tryParseInt(data.value.workMode),
          workState: tryParseInt(data.value.workState),
        };
        this.latestStatusResponse = data;
        return this.status;
      });
  }

  start() {
    const request = this.createRequest('c1000000fa000000010000004727000001000000', {
      start: '1',
      transitCmd: '100',
    });
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
    this.status.workMode = WorkMode.Cleaning;
  }

  pause() {
    const request = this.createRequest('ce000000fa000000010000004c27000001000000', {
      pause: '1',
      isStop: '0',
      transitCmd: '102',
    });
    const tcpService = new TCPService(this.ipAddress, 8888);
    tcpService.sendPacket(request);
    this.status.workMode = WorkMode.Idle;
  }
}

export default CleanmateService;