import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import { PluginConfig } from '../types';
import { ServiceBase } from './serviceBase';
import type Cleanmate from 'cleanmate';

export default class InformationService extends ServiceBase {
  private readonly service: Service;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmate: Cleanmate){
    super(hap, log, config, cleanmate);

    this.service = new this.hap.Service.AccessoryInformation();
    this.service.setCharacteristic(this.hap.Characteristic.Manufacturer, 'Cleanmate');
    this.service.getCharacteristic(this.hap.Characteristic.FirmwareRevision)
      .onGet(this.getFirmwareRevisionState.bind(this));
    this.cleanmate.addListener('versionChange', this.versionChanged.bind(this));
  }

  private versionChanged(value: string){
    this.service.updateCharacteristic(this.hap.Characteristic.FirmwareRevision, value);
  }

  private getFirmwareRevisionState(): CharacteristicValue{
    const firmwareRevisionState = this.cleanmate.version;
    return firmwareRevisionState;
  }

  public get services(): Service[] {
    return [this.service];
  }

}