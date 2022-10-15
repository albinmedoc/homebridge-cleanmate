import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import CleanmateService from '../cleanmateService';
import { PluginConfig, WorkState } from '../types';
import { ServiceBase } from './serviceBase';

export default class ProblemSensor extends ServiceBase {
  private readonly service: Service;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmateService: CleanmateService){
    super(hap, log, config, cleanmateService);

    this.service = new this.hap.Service.MotionSensor(`${this.config.name} ${this.config.motionSensor.name}`);
    this.service.getCharacteristic(this.hap.Characteristic.MotionDetected)
      .onGet(this.getProblemState.bind(this));
    this.cleanmateService.addListener('workStateChange', this.workStateChanged.bind(this));
  }

  private workStateChanged(value: WorkState){
    const problem = value === WorkState.Problem;
    const motionDetectedState = this.config.motionSensor.inverted ? !problem : problem;
    this.service.updateCharacteristic(this.hap.Characteristic.MotionDetected, motionDetectedState);
  }

  private getProblemState(): CharacteristicValue {
    const problem = this.cleanmateService.workState === WorkState.Problem;
    const motionDetectedState = this.config.occupancySensor.inverted ? !problem : problem;
    return motionDetectedState;
  }

  public get services(): Service[] {
    return [this.service];
  }

}