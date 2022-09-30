import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import CleanmateService from '../cleanmateService';
import { MopMode, PluginConfig, WorkMode, WorkState } from '../types';
import { ServiceBase } from './serviceBase';

export default class MainService extends ServiceBase {
  private readonly service: Service;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmateService: CleanmateService) {
    super(hap, log, config, cleanmateService);

    this.service = new this.hap.Service.Fanv2(this.config.name);
    this.service.getCharacteristic(this.hap.Characteristic.Active)
      .onGet(this.getActiveState.bind(this))
      .onSet(this.setActiveState.bind(this));
    this.service.getCharacteristic(this.hap.Characteristic.RotationSpeed)
      .onGet(this.getSpeedState.bind(this))
      .onSet(this.setSpeedState.bind(this));
    this.service.getCharacteristic(this.hap.Characteristic.RotationDirection)
      .onGet(this.getRotationState.bind(this))
      .onSet(this.setRotationState.bind(this));
    this.cleanmateService.on('workStateChange', this.workStateChanged.bind(this));
    this.cleanmateService.on('workModeChange', this.workModeChanged.bind(this));
    this.cleanmateService.on('mopModeChange', this.mopModeChanged.bind(this));
  }

  private workStateChanged(value: WorkState) {
    const activeState = value === WorkState.Cleaning;
    this.service.updateCharacteristic(this.hap.Characteristic.Active, activeState);
    if(value === WorkState.Cleaning) {
      const speedState = this.getSpeedByWorkMode(this.cleanmateService.workMode);
      this.service.updateCharacteristic(this.hap.Characteristic.RotationSpeed, speedState);
    }else {
      this.service.updateCharacteristic(this.hap.Characteristic.RotationSpeed, 0);
    }
  }

  private workModeChanged(value: WorkMode) {
    const speedState = this.getSpeedByWorkMode(value);
    this.service.updateCharacteristic(this.hap.Characteristic.RotationSpeed, speedState);
  }

  private mopModeChanged(value: MopMode) {
    const clockwise = value === this.config.clockwiseMode;
    const clockwiseState = clockwise ?
      this.hap.Characteristic.RotationDirection.CLOCKWISE :
      this.hap.Characteristic.RotationDirection.COUNTER_CLOCKWISE;
    this.service.updateCharacteristic(this.hap.Characteristic.RotationDirection, clockwiseState);
  }

  private getActiveState(): CharacteristicValue {
    const activeState = this.cleanmateService.workState === WorkState.Cleaning;
    return activeState;
  }

  private setActiveState(value: CharacteristicValue): void {
    value ? this.cleanmateService.start() : this.cleanmateService.pause();
  }

  private getSpeedByWorkMode(workMode: WorkMode): number {
    switch (workMode) {
      case WorkMode.Silent:
        return 17;
      case WorkMode.Standard:
        return 50;
      case WorkMode.Intensive:
        return 82;
      default:
        return 0;
    }
  }

  private getWorkModeBySpeed(speed: number): WorkMode | undefined {
    if (speed === 0) {
      return undefined;
    } else if (speed < 33) {
      return WorkMode.Silent;
    } else if (speed < 66) {
      return WorkMode.Standard;
    } else {
      return WorkMode.Intensive;
    }
  }

  private getSpeedState(): CharacteristicValue {
    if (this.cleanmateService.workState !== WorkState.Cleaning) {
      return 0;
    }
    return this.getSpeedByWorkMode(this.cleanmateService.workMode);
  }

  private setSpeedState(value: CharacteristicValue): void {
    const workMode = this.getWorkModeBySpeed(value as number);
    if(workMode){
      this.cleanmateService.start(workMode);
    }else {
      this.cleanmateService.charge();
    }
  }

  private getRotationState(): CharacteristicValue {
    const clockwise = this.cleanmateService.mopMode === this.config.clockwiseMode;
    return clockwise ? this.hap.Characteristic.RotationDirection.CLOCKWISE : this.hap.Characteristic.RotationDirection.COUNTER_CLOCKWISE;
  }

  private setRotationState(value: CharacteristicValue): void {
    const mopMode = value === this.hap.Characteristic.RotationDirection.CLOCKWISE ?
      this.config.clockwiseMode :
      this.config.counterClockwiseMode;

    this.cleanmateService.setMopMode(mopMode);
  }

  public get services(): Service[] {
    return [this.service];
  }

}