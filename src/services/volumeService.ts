import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import { PluginConfig } from '../types';
import { ServiceBase } from './serviceBase';
import type Cleanmate from 'cleanmate';

export default class VolumeService extends ServiceBase {
  private readonly service: Service;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmate: Cleanmate){
    super(hap, log, config, cleanmate);

    this.service = new this.hap.Service.Lightbulb(`${this.config.name} ${this.config.volume.name}`);
    this.service.getCharacteristic(this.hap.Characteristic.On)
      .onGet(this.getVolumeState.bind(this))
      .onSet(this.setVolumeState.bind(this));

    this.service.getCharacteristic(this.hap.Characteristic.Brightness)
      .onGet(this.getVolumeLevelState.bind(this))
      .onSet(this.setVolumeLevelState.bind(this));

    this.cleanmate.addListener('volumeChange', this.volumeChanged.bind(this));
  }

  volumeChanged(volume: number) {
    this.service.updateCharacteristic(this.hap.Characteristic.On, volume !== 0);
    this.service.updateCharacteristic(this.hap.Characteristic.Brightness, volume);
  }

  getVolumeState(): CharacteristicValue {
    return this.cleanmate.volume > 0 ? true : false;
  }

  setVolumeState(value: CharacteristicValue) {
    const volume = value ? 100 : 0;
    this.log.debug(`Turn ${value ? 'on' : 'off'} volume`);
    this.cleanmate.setVolume(volume);
  }

  getVolumeLevelState(): CharacteristicValue {
    return this.cleanmate.volume;
  }

  setVolumeLevelState(value: CharacteristicValue) {
    this.cleanmate.setVolume(value as number);
    this.log.debug('Setting volume level to', value);
  }

  public get services(): Service[] {
    return [this.service];
  }

}