import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import CleanmateService from '../cleanmateService';
import { PluginConfig } from '../types';
import { ServiceBase } from './serviceBase';

export default class InformationService extends ServiceBase {
  private readonly service: Service;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmateService: CleanmateService){
    super(hap, log, config, cleanmateService);

    this.service = new this.hap.Service.AccessoryInformation();
    this.service.setCharacteristic(this.hap.Characteristic.Manufacturer, 'Cleanmate');
    this.service.getCharacteristic(this.hap.Characteristic.FirmwareRevision)
      .onGet(this.getFirmwareRevisionState.bind(this));
    this.cleanmateService.on('versionChange', this.versionChanged.bind(this));
  }

  private versionChanged(value: string){
    this.service.updateCharacteristic(this.hap.Characteristic.FirmwareRevision, value);
  }

  private getFirmwareRevisionState(): CharacteristicValue{
    const firmwareRevisionState = this.cleanmateService.version;
    return firmwareRevisionState;
  }

  public get services(): Service[] {
    return [this.service];
  }

}