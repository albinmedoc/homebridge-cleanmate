import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import { PluginConfig, WorkState } from '../types';
import { ServiceBase } from './serviceBase';
import type Cleanmate from 'cleanmate';

export default class DockSensor extends ServiceBase {
  private readonly service: Service;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmate: Cleanmate){
    super(hap, log, config, cleanmate);

    this.service = new this.hap.Service.OccupancySensor(`${this.config.name} ${this.config.occupancySensor.name}`);
    this.service.getCharacteristic(this.hap.Characteristic.OccupancyDetected)
      .onGet(this.getDockState.bind(this));
    this.cleanmate.addListener('workStateChange', this.workStateChanged.bind(this));
  }

  private workStateChanged(value: WorkState){
    const docked = value === WorkState.Charging;
    const occupancyDetectedState = this.config.occupancySensor.inverted ? !docked : docked;
    this.service.updateCharacteristic(this.hap.Characteristic.OccupancyDetected, occupancyDetectedState);
  }

  private getDockState(): CharacteristicValue {
    const docked = this.cleanmate.workState === WorkState.Charging;
    const occupancyDetectedState = this.config.occupancySensor.inverted ? !docked : docked;
    return occupancyDetectedState;
  }

  public get services(): Service[] {
    return [this.service];
  }

}