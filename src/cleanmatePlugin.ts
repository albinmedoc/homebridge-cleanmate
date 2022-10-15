import { AccessoryPlugin, Logging, API, Service, AccessoryConfig } from 'homebridge';
import CleanmateService from './cleanmateService';
import {
  BatteryService,
  DockSensor,
  FindSwitch,
  InformationService,
  MainService,
  PauseSwitch,
  ProblemSensor,
  VolumeService,
  RoomService,
} from './services';
import { ServiceBase } from './services/serviceBase';
import { Config, MopMode, PluginConfig } from './types';

class CleanmatePlugin implements AccessoryPlugin {

  cleanmateService: CleanmateService;
  services: ServiceBase[];
  private config: PluginConfig;

  constructor(logger: Logging, config: AccessoryConfig, api: API) {
    this.config = {
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
      volume: {
        enable: config.volume?.enable ?? false,
        name: config.volume?.name ?? 'Volume',
      },
      findSwitch: {
        enable: config.findSwitch?.enable ?? false,
        name: config.findSwitch?.name ?? 'Find',
      },
      roomTimeout: config.roomTimeout ?? 30,
      rooms: config.rooms ?? [],
    };
    this.cleanmateService = new CleanmateService(this.config.ipAddress, this.config.authCode, this.config.pollInterval);

    this.services = [
      new MainService(api.hap, logger, this.config, this.cleanmateService),
      new InformationService(api.hap, logger, this.config, this.cleanmateService),
      new BatteryService(api.hap, logger, this.config, this.cleanmateService),
      ...(this.config.pauseSwitch.enable ? [new PauseSwitch(api.hap, logger, this.config, this.cleanmateService)] : []),
      ...(this.config.occupancySensor.enable ? [new DockSensor(api.hap, logger, this.config, this.cleanmateService)] : []),
      ...(this.config.motionSensor.enable ? [new ProblemSensor(api.hap, logger, this.config, this.cleanmateService)] : []),
      ...(this.config.volume.enable ? [new VolumeService(api.hap, logger, this.config, this.cleanmateService)] : []),
      ...(this.config.findSwitch.enable ? [new FindSwitch(api.hap, logger, this.config, this.cleanmateService)] : []),
      ...(this.config.rooms.length ? [new RoomService(api.hap, logger, this.config, this.cleanmateService)] : []),
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