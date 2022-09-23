import { AccessoryPlugin, Logging, API, Service, HAP, CharacteristicValue, AccessoryConfig } from 'homebridge';
import CleanmateService from './cleanmateService';
import { CleanmateStatus, Config, PluginConfig, WorkMode, WorkState } from './types';

class CleanmatePlugin implements AccessoryPlugin {
  logger: Logging;
  api: API;
  hap: HAP;
  config: PluginConfig;

  informationService: Service;
  batteryService: Service;
  fanService: Service;
  switchService: Service;
  occupancyService?: Service;

  cleanmateService: CleanmateService;
  lastStatus?: CleanmateStatus;

  constructor(logger: Logging, config: AccessoryConfig, api: API) {
    this.logger = logger;
    this.config = {
      ...config as Config,
      pollInterval: config.pollInterval ?? 30,
      lowBatteryPercentage: config.lowBatteryPercentage ?? 15,
      occupancySensor: {
        enable: config.occupancySensor?.enable ?? true,
        inverted: config.occupancySensor?.inverted ?? false,
      },
    };
    this.api = api;
    this.hap = api.hap;

    this.logger.debug('Cleanmate Plugin Loaded');

    /* Information Service */
    this.informationService = new this.hap.Service.AccessoryInformation();
    this.informationService.setCharacteristic(this.hap.Characteristic.Manufacturer, 'Cleanmate');
    this.informationService.getCharacteristic(this.hap.Characteristic.FirmwareRevision)
      .onGet(this.getFirmwareRevision.bind(this));

    /* Battery Service */
    this.batteryService = new this.hap.Service.Battery();
    this.batteryService.getCharacteristic(this.hap.Characteristic.StatusLowBattery)
      .onGet(this.getLowBatteryHandler.bind(this));
    this.batteryService.getCharacteristic(this.hap.Characteristic.BatteryLevel)
      .onGet(this.getBatteryLevelHandler.bind(this));
    this.batteryService.getCharacteristic(this.hap.Characteristic.ChargingState)
      .onGet(this.getChargingStateHandler.bind(this));

    /* Fan Service */
    this.fanService = new this.hap.Service.Fanv2(this.config.name);
    this.fanService.getCharacteristic(this.hap.Characteristic.Active)
      .onGet(this.getActiveHandler.bind(this))
      .onSet(this.setActiveHandler.bind(this));
    this.fanService.getCharacteristic(this.hap.Characteristic.RotationSpeed)
      .onGet(this.getSpeedHandler.bind(this))
      .onSet(this.setSpeedHandler.bind(this));

    /* Switch Service */
    this.logger.debug('Initializing Switch Service');
    this.switchService = new this.hap.Service.Switch(this.config.name);
    this.switchService.getCharacteristic(this.hap.Characteristic.On)
      .onGet(this.getPauseHandler.bind(this))
      .onSet(this.setPauseHandler.bind(this));

    /* Occupancy Service */
    if(this.config.occupancySensor.enable){
      this.occupancyService = new this.hap.Service.OccupancySensor(this.config.name);
      this.occupancyService.getCharacteristic(this.hap.Characteristic.OccupancyDetected)
        .onGet(this.getOccupancyHandler.bind(this));
    }

    /* Setup cleanmate service */
    this.cleanmateService = new CleanmateService(this.config.ipAddress, this.config.authCode);

    /* Update status of Cleanmate robot at an interval */
    setInterval(() => {
      this.cleanmateService.updateStatus().then((status) => {
        this.logger.debug(`Got status from ${this.config.name}`, this.cleanmateService.status);
        this.onStatusUpdate(status);
      }).catch((err) => {
        this.logger.error(`Could not get status from ${this.config.name}`, err);
      });
    }, 1000 * this.config.pollInterval);
  }

  onStatusUpdate(status: CleanmateStatus) {
    if(status.version && this.lastStatus?.version !== status.version) {
      this.informationService.updateCharacteristic(this.hap.Characteristic.FirmwareRevision, status.version);
    }
    if(status.batteryLevel && this.lastStatus?.batteryLevel !== status.batteryLevel) {
      this.batteryService.updateCharacteristic(this.hap.Characteristic.BatteryLevel, status.batteryLevel);
      this.batteryService.updateCharacteristic(
        this.hap.Characteristic.StatusLowBattery,
        status.batteryLevel <= this.config.lowBatteryPercentage,
      );
    }
    if(status.workState && this.lastStatus?.workState !== status.workState) {
      const charging = status.workState === WorkState.Charging;
      this.batteryService.updateCharacteristic(
        this.hap.Characteristic.ChargingState,
        charging ?
          this.hap.Characteristic.ChargingState.CHARGING :
          this.hap.Characteristic.ChargingState.NOT_CHARGING,
      );

      const docked = this.config.occupancySensor.inverted ? !charging : charging;

      this.occupancyService?.updateCharacteristic(
        this.hap.Characteristic.OccupancyDetected,
        docked ?
          this.hap.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED :
          this.hap.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED,
      );

      const active = status.workState === WorkState.Charging;
      this.fanService.updateCharacteristic(
        this.hap.Characteristic.Active,
        active ?
          this.hap.Characteristic.Active.ACTIVE :
          this.hap.Characteristic.Active.INACTIVE,
      );

      const paused = status.workState === WorkState.Paused;
      this.switchService.updateCharacteristic(this.hap.Characteristic.On, paused);
    }
    if(status.workMode && this.lastStatus?.workMode !== status.workMode) {
      this.fanService.updateCharacteristic(this.hap.Characteristic.RotationSpeed, this.getSpeedByMode(status.workMode));
    }

    this.lastStatus = status;
  }

  getServices() {
    return [
      this.informationService,
      this.batteryService,
      this.fanService,
      this.switchService,
      this.occupancyService,
    ].filter((service) => service !== undefined) as Service[];
  }

  getSpeedByMode(workMode: WorkMode) {
    switch(workMode) {
      case WorkMode.Silent:
        return 17;
      case WorkMode.Standard:
        return 50;
      case WorkMode.Intensive:
        return 82;
      default:
        return 0;
    }
  }

  /* --- Information Service --- */

  /* Get the firmwate revision of the robot */
  getFirmwareRevision(): CharacteristicValue {
    return this.cleanmateService.status.version ?? '1.0';
  }

  /* --- Battery Service --- */

  /* Get low battery status of the robot */
  getLowBatteryHandler(): CharacteristicValue {
    const low = this.cleanmateService.status.batteryLevel ?
      this.cleanmateService.status.batteryLevel < this.config.lowBatteryPercentage :
      false;
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

  /* Set speed level of the fan */
  getSpeedHandler(): CharacteristicValue {
    if(this.cleanmateService.status.workState !== WorkState.Cleaning || !this.cleanmateService.status.workMode){
      return 0;
    }
    return this.getSpeedByMode(this.cleanmateService.status.workMode);
  }

  /* Get speed level of the fan */
  setSpeedHandler(value: CharacteristicValue) {
    if(value === 0) {
      this.cleanmateService.pause();
      // Pause
    } else if(value < 33) {
      this.cleanmateService.start(WorkMode.Silent);
    } else if (value < 66) {
      this.cleanmateService.start(WorkMode.Standard);
    } else {
      this.cleanmateService.start(WorkMode.Intensive);
    }
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

  /* --- Occupancy Service --- */

  /* Get dock state of robot */
  getOccupancyHandler(): CharacteristicValue {
    let docked = this.cleanmateService.status.workState === WorkState.Charging;
    if(this.config.occupancySensor.inverted){
      docked = !docked;
    }
    return docked ?
      this.hap.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED :
      this.hap.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED;
  }

}

export default CleanmatePlugin;