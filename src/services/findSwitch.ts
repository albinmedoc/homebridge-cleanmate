import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import { PluginConfig } from '../types';
import { ServiceBase } from './serviceBase';
import type Cleanmate from 'cleanmate';

export default class FindSwitch extends ServiceBase {
  private readonly service: Service;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmate: Cleanmate){
    super(hap, log, config, cleanmate);

    this.service = new this.hap.Service.Switch(`${this.config.name} ${this.config.findSwitch.name}`, 'find');
    this.service.getCharacteristic(this.hap.Characteristic.On)
      .onGet(() => false)
      .onSet(this.setFindState.bind(this));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private setFindState(_value: CharacteristicValue): void {
    this.cleanmate.findRobot();
  }

  public get services(): Service[] {
    return [this.service];
  }

}