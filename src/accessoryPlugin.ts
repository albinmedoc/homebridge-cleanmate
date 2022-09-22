import { AccessoryPlugin, Logging, API, Service, HAP, CharacteristicValue, AccessoryConfig } from 'homebridge';
import CleanmateService from './cleanmateService';
import { Config, WorkState } from './types';

class CleanmatePlugin implements AccessoryPlugin {
  logger: Logging;
  api: API;
  hap: HAP;
  config: Config;

  informationService: Service;
  batteryService: Service;
  fanService: Service;
  switchService: Service;

  cleanmateService: CleanmateService;

  constructor(logger: Logging, config: AccessoryConfig, api: API) {
    this.logger = logger;
    this.config = config as Config;
    this.api = api;
    this.hap = api.hap;

    this.logger.debug('Cleanmate Plugin Loaded');

    /* Information Service */
    this.logger.debug('Initializing Information Service');
    this.informationService = new this.hap.Service.AccessoryInformation();
    this.informationService.setCharacteristic(this.hap.Characteristic.Manufacturer, 'Cleanmate');
    this.informationService.setCharacteristic(this.hap.Characteristic.Manufacturer, 'TCP');
    this.informationService.getCharacteristic(this.hap.Characteristic.FirmwareRevision)
      .onGet(this.getFirmwareRevision.bind(this));

    /* Battery Service */
    this.logger.debug('Initializing Battery Service');
    this.batteryService = new this.hap.Service.Battery();
    this.batteryService.getCharacteristic(this.hap.Characteristic.StatusLowBattery)
      .onGet(this.getLowBatteryHandler.bind(this));
    this.batteryService.getCharacteristic(this.hap.Characteristic.BatteryLevel)
      .onGet(this.getBatteryLevelHandler.bind(this));
    this.batteryService.getCharacteristic(this.hap.Characteristic.ChargingState)
      .onGet(this.getChargingStateHandler.bind(this));

    /* Fan Service */
    this.logger.debug('Initializing Fan Service');
    this.fanService = new this.hap.Service.Fanv2(this.config.name);
    this.fanService.getCharacteristic(this.hap.Characteristic.Active)
      .onGet(this.getActiveHandler.bind(this))
      .onSet(this.setActiveHandler.bind(this));

    /* Switch Service */
    this.logger.debug('Initializing Switch Service');
    this.switchService = new this.hap.Service.Switch(this.config.name);
    this.switchService.getCharacteristic(this.hap.Characteristic.On)
      .onGet(this.getPauseHandler.bind(this))
      .onSet(this.setPauseHandler.bind(this));

    /* Setup cleanmate service */
    this.cleanmateService = new CleanmateService(this.config.ipAddress, this.config.authCode);

    /* Update status of Cleanmate robot at an interval */
    setInterval(() => {
      this.logger.debug(`Try getting status from ${this.config.name}`);
      this.cleanmateService.updateStatus().then(() => {
        this.logger.debug(`Got status from ${this.config.name}`, this.cleanmateService.status);
      }).catch((err) => {
        this.logger.error(`Could not get status from ${this.config.name}`, err);
      });
    }, 1000 * this.config.pollInterval);
  }

  getServices() {
    return [
      this.informationService,
      this.batteryService,
      this.fanService,
      this.switchService,
    ];
  }

  /* --- Information Service --- */

  /* Get the firmwate revision of the robot */
  getFirmwareRevision(): CharacteristicValue {
    return this.cleanmateService.status.version ?? '1.0';
  }

  /* --- Battery Service --- */

  /* Get low battery status of the robot */
  getLowBatteryHandler(): CharacteristicValue {
    const low = this.cleanmateService.status.batteryLevel ? this.cleanmateService.status.batteryLevel < 15 : false;
    return low ? this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
  }

  /* Get current battery level of the robot */
  getBatteryLevelHandler(): CharacteristicValue {
    return this.cleanmateService.status.batteryLevel || 100;
  }

  /* Get charging status of the robot */
  getChargingStateHandler(): CharacteristicValue {
    const charging = this.cleanmateService.status.workState === WorkState.Charging;
    return charging ? this.hap.Characteristic.ChargingState.CHARGING : this.hap.Characteristic.ChargingState.NOT_CHARGING;
  }

  /* --- Fan Service --- */

  /* Get active/cleaning status of the robot */
  getActiveHandler(): CharacteristicValue {
    const active = this.cleanmateService.status.workState === WorkState.Cleaning;

    return active ? this.hap.Characteristic.Active.ACTIVE : this.hap.Characteristic.Active.INACTIVE;
  }

  /* Set active/cleaning status of the robot */
  setActiveHandler(value: CharacteristicValue) {
    value === this.hap.Characteristic.Active.ACTIVE ? this.cleanmateService.start() : this.cleanmateService.charge();
  }

  /* --- Switch Service --- */

  /* Get active/cleaning status of the robot */
  getPauseHandler(): CharacteristicValue {
    const paused = this.cleanmateService.status.workState === WorkState.Paused;
    return paused;
  }

  /* Set active/cleaning status of the robot */
  setPauseHandler(value: CharacteristicValue) {
    value ? this.cleanmateService.pause() : this.cleanmateService.start();
  }
}

export default CleanmatePlugin;