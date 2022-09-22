import { AccessoryConfig } from 'homebridge';

export interface Config extends AccessoryConfig {
    name: string;
    ipAddress: string;
    authCode: string;
    pollInterval: number;
}

export enum WorkMode {
    Cleaning = 1,
    Idle = 2,
    Charging = 6,
    Problem = 7
}

export enum WorkState {
    Standard = 1,
    Intensive = 7,
    Silent = 9
}

export interface CleanmateStatus {
    batteryLevel?: number;
    waterLevel?: number;
    version?: string;
    workMode?: WorkMode;
    workState?: WorkState;
}

export interface StatusResponse {
    version: string;
    control: {
        targetId: string;
        targetType: string;
        broadcast: string;
    };
    value: {
        noteCmd: string;
        voice: string;
        workState: string;
        workMode: string;
        fan: string;
        direction: string;
        brush: string;
        battery: string;
        error: string;
        standbyMode: string;
        waterTank: string;
        clearComponent: string;
        waterMark: string;
        attract: string;
        deviceIp: string;
        devicePort: string;
        carpetColor: string;
        version: string;
        result: string;
        mopMode: string;
        extParam: string;
    };
}