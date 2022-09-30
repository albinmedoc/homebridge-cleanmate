import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import CleanmateService from '../cleanmateService';
import { PluginConfig, WorkState } from '../types';
import { ServiceBase } from './serviceBase';

export default class DockSensor extends ServiceBase {
  private readonly service: Service;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmateService: CleanmateService){
    super(hap, log, config, cleanmateService);

    this.service = new this.hap.Service.Battery();
    this.service.getCharacteristic(this.hap.Characteristic.StatusLowBattery)
      .onGet(this.getLowBatteryState.bind(this));
    this.service.getCharacteristic(this.hap.Characteristic.BatteryLevel)
      .onGet(this.getBatteryLevelState.bind(this));
    this.service.getCharacteristic(this.hap.Characteristic.ChargingState)
      .onGet(this.getChargingState.bind(this));
    this.cleanmateService.on('batteryLevelChange', this.batteryLevelChanged.bind(this));
    this.cleanmateService.on('workStateChange', this.workStateChanged.bind(this));
  }

  private batteryLevelChanged(value: number){
    const lowBattery = value <= this.config.lowBatteryPercentage;
    const lowBatteryState = lowBattery ?
      this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW :
      this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
    this.service.updateCharacteristic(this.hap.Characteristic.StatusLowBattery, lowBatteryState);

    this.service.updateCharacteristic(this.hap.Characteristic.BatteryLevel, value);
  }

  private workStateChanged(value: WorkState){
    const charging = value === WorkState.Charging;
    const chargingState = charging ?
      this.hap.Characteristic.ChargingState.CHARGING :
      this.hap.Characteristic.ChargingState.NOT_CHARGING;
    this.service.updateCharacteristic(this.hap.Characteristic.ChargingState, chargingState);
  }

  private getLowBatteryState(): CharacteristicValue {
    const lowBattery = this.cleanmateService.batteryLevel <= this.config.lowBatteryPercentage;
    const lowBatteryState = lowBattery ?
      this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW :
      this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
    return lowBatteryState;
  }

  private getBatteryLevelState(): CharacteristicValue {
    const batteryLevelState = this.cleanmateService.batteryLevel;
    return batteryLevelState;
  }

  private getChargingState(): CharacteristicValue {
    const charging = this.cleanmateService.workState === WorkState.Charging;
    const chargingState = charging ?
      this.hap.Characteristic.ChargingState.CHARGING :
      this.hap.Characteristic.ChargingState.NOT_CHARGING;
    return chargingState;
  }

  public get services(): Service[] {
    return [this.service];
  }

}