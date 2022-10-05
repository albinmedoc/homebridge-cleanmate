import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import CleanmateService from '../cleanmateService';
import { PluginConfig } from '../types';
import { ServiceBase } from './serviceBase';

export default class VolumeService extends ServiceBase {
  private readonly service: Service;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmateService: CleanmateService){
    super(hap, log, config, cleanmateService);

    this.service = new this.hap.Service.Lightbulb(`${this.config.name} ${this.config.volume.name}`);
    this.service.getCharacteristic(this.hap.Characteristic.On)
      .onGet(this.getVolumeState.bind(this))
      .onSet(this.setVolumeState.bind(this));

    this.service.getCharacteristic(this.hap.Characteristic.Brightness)
      .onGet(this.getVolumeLevelState.bind(this))
      .onSet(this.setVolumeLevelState.bind(this));
  }

  getVolumeState(): CharacteristicValue {
    return this.cleanmateService.volume > 0 ? true : false;
  }

  setVolumeState(value: CharacteristicValue) {
    const volume = value ? 100 : 0;
    this.cleanmateService.setVolume(volume);
  }

  getVolumeLevelState(): CharacteristicValue {
    return this.cleanmateService.volume;
  }

  setVolumeLevelState(value: CharacteristicValue) {
    this.cleanmateService.setVolume(value as number);
  }

  public get services(): Service[] {
    return [this.service];
  }

}