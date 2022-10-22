import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import { PluginConfig, WorkState } from '../types';
import { ServiceBase } from './serviceBase';
import type Cleanmate from 'cleanmate';

export default class ProblemSensor extends ServiceBase {
  private readonly service: Service;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmate: Cleanmate){
    super(hap, log, config, cleanmate);

    this.service = new this.hap.Service.MotionSensor(`${this.config.name} ${this.config.motionSensor.name}`);
    this.service.getCharacteristic(this.hap.Characteristic.MotionDetected)
      .onGet(this.getProblemState.bind(this));
    this.cleanmate.addListener('workStateChange', this.workStateChanged.bind(this));
  }

  private workStateChanged(value: WorkState){
    const problem = value === WorkState.Problem;
    const motionDetectedState = this.config.motionSensor.inverted ? !problem : problem;
    this.service.updateCharacteristic(this.hap.Characteristic.MotionDetected, motionDetectedState);
  }

  private getProblemState(): CharacteristicValue {
    const problem = this.cleanmate.workState === WorkState.Problem;
    const motionDetectedState = this.config.occupancySensor.inverted ? !problem : problem;
    return motionDetectedState;
  }

  public get services(): Service[] {
    return [this.service];
  }

}