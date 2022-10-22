import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import { PluginConfig, WorkState } from '../types';
import { ServiceBase } from './serviceBase';
import type Cleanmate from 'cleanmate';

export default class PauseSwitch extends ServiceBase {
  private readonly service: Service;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmate: Cleanmate){
    super(hap, log, config, cleanmate);

    this.service = new this.hap.Service.Switch(`${this.config.name} ${this.config.pauseSwitch.name}`);
    this.service.getCharacteristic(this.hap.Characteristic.On)
      .onGet(this.getPauseState.bind(this))
      .onSet(this.setPauseState.bind(this));
    this.cleanmate.addListener('workStateChange', this.workStateChanged.bind(this));
  }

  private workStateChanged(value: WorkState){
    const paused = value === WorkState.Paused;
    const onState = this.config.pauseSwitch.inverted ? !paused : paused;
    this.service.updateCharacteristic(this.hap.Characteristic.On, onState);
  }

  private getPauseState(): CharacteristicValue {
    const paused = this.cleanmate.workState === WorkState.Paused;
    const onState = this.config.pauseSwitch.inverted ? !paused : paused;
    return onState;
  }

  private setPauseState(value: CharacteristicValue): void {
    const pause = this.config.pauseSwitch.inverted ? !value : !!value;
    this.log.debug('Set pause', pause);
    if(pause) {
      this.cleanmate.pause();
    }else {
      this.cleanmate.start();
    }
  }

  public get services(): Service[] {
    return [this.service];
  }

}