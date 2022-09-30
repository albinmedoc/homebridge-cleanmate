import type { Logging, HAP, Service } from 'homebridge';
import CleanmateService from '../cleanmateService';
import { PluginConfig } from '../types';

export abstract class ServiceBase {
  protected readonly hap: HAP;
  protected readonly log: Logging;
  protected readonly config: PluginConfig;
  protected readonly cleanmateService: CleanmateService;

  protected constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmateService: CleanmateService) {
    this.hap = hap;
    this.log = log;
    this.config = config;
    this.cleanmateService = cleanmateService;
  }

  public abstract get services(): Service[];
}