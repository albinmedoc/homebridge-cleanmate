import { AccessoryPlugin, Logging, API, Service, AccessoryConfig } from 'homebridge';
import CleanmateService from './cleanmateService';
import {
  BatteryServide,
  DockSensor,
  InformationService,
  MainService,
  PauseSwitch,
  ProblemSensor,
} from './services';
import { ServiceBase } from './services/serviceBase';
import { Config, MopMode, PluginConfig } from './types';

class CleanmatePlugin implements AccessoryPlugin {

  cleanmateService: CleanmateService;
  services: ServiceBase[];

  constructor(logger: Logging, config: AccessoryConfig, api: API) {

    const conf: PluginConfig = {
      ...config as Config,
      pollInterval: config.pollInterval ?? 30,
      lowBatteryPercentage: config.lowBatteryPercentage ?? 15,
      clockwiseMode: config.clockwiseMode ?? MopMode.High,
      counterClockwiseMode: config.counterClockwiseMode ?? MopMode.Low,
      pauseSwitch: {
        enable: config.pauseSwitch?.enable ?? true,
        name: config.pauseSwitch?.name ?? 'Pause',
        inverted: config.pauseSwitch?.inverted ?? false,
      },
      motionSensor: {
        enable: config.motionSensor?.enable ?? false,
        name: config.motionSensor?.name ?? 'Problem',
        inverted: config.motionSensor?.inverted ?? false,
      },
      occupancySensor: {
        enable: config.occupancySensor?.enable ?? false,
        name: config.occupancySensor?.name ?? 'Docked',
        inverted: config.occupancySensor?.inverted ?? false,
      },
    };
    this.cleanmateService = new CleanmateService(conf.ipAddress, conf.authCode, conf.pollInterval);

    this.services = [
      new MainService(api.hap, logger, conf, this.cleanmateService),
      new InformationService(api.hap, logger, conf, this.cleanmateService),
      new BatteryServide(api.hap, logger, conf, this.cleanmateService),
      ...(conf.pauseSwitch.enable ? [new PauseSwitch(api.hap, logger, conf, this.cleanmateService)] : []),
      ...(conf.occupancySensor.enable ? [new DockSensor(api.hap, logger, conf, this.cleanmateService)] : []),
      ...(conf.motionSensor.enable ? [new ProblemSensor(api.hap, logger, conf, this.cleanmateService)] : []),
    ];
  }

  /* Get the active services */
  getServices() {
    const services: Service[] = [];
    this.services.forEach((service) => {
      services.push(...service.services);
    });
    return services;
  }
}

export default CleanmatePlugin;