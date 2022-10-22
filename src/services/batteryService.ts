import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import { PluginConfig, WorkState } from '../types';
import { ServiceBase } from './serviceBase';
import type Cleanmate from 'cleanmate';

export default class DockSensor extends ServiceBase {
  private readonly service: Service;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmate: Cleanmate){
    super(hap, log, config, cleanmate);

    this.service = new this.hap.Service.Battery();
    this.service.getCharacteristic(this.hap.Characteristic.StatusLowBattery)
      .onGet(this.getLowBatteryState.bind(this));
    this.service.getCharacteristic(this.hap.Characteristic.BatteryLevel)
      .onGet(this.getBatteryLevelState.bind(this));
    this.service.getCharacteristic(this.hap.Characteristic.ChargingState)
      .onGet(this.getChargingState.bind(this));
    this.cleanmate.addListener('batteryLevelChange', this.batteryLevelChanged.bind(this));
    this.cleanmate.addListener('workStateChange', this.workStateChanged.bind(this));
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
    const lowBattery = this.cleanmate.batteryLevel <= this.config.lowBatteryPercentage;
    const lowBatteryState = lowBattery ?
      this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW :
      this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
    return lowBatteryState;
  }

  private getBatteryLevelState(): CharacteristicValue {
    const batteryLevelState = this.cleanmate.batteryLevel;
    return batteryLevelState;
  }

  private getChargingState(): CharacteristicValue {
    const charging = this.cleanmate.workState === WorkState.Charging;
    const chargingState = charging ?
      this.hap.Characteristic.ChargingState.CHARGING :
      this.hap.Characteristic.ChargingState.NOT_CHARGING;
    return chargingState;
  }

  public get services(): Service[] {
    return [this.service];
  }

}