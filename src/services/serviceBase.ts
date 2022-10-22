import type { Logging, HAP, Service } from 'homebridge';
import type Cleanmate from 'cleanmate';
import type { PluginConfig } from '../types';

export abstract class ServiceBase {
  protected readonly hap: HAP;
  protected readonly log: Logging;
  protected readonly config: PluginConfig;
  protected readonly cleanmate: Cleanmate;

  protected constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmate: Cleanmate) {
    this.hap = hap;
    this.log = log;
    this.config = config;
    this.cleanmate = cleanmate;
  }

  public abstract get services(): Service[];
}