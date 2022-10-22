import { Logging } from 'homebridge';

export default () => {
  const log: Logging = console as unknown as Logging;
  jest.spyOn(console, 'error').mockImplementation();
  jest.spyOn(console, 'warn').mockImplementation();
  jest.spyOn(console, 'info').mockImplementation();
  jest.spyOn(console, 'debug').mockImplementation();
  return log as jest.Mocked<Logging>;
};