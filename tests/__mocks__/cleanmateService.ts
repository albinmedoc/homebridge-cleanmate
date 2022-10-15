import { EventEmitter } from 'events';
import CleanmateService from '../../src/cleanmateService';

export default (ipAddress: string, authCode: string, pollInterval?: number) => {
  const events = new EventEmitter();
  class CleanmateServiceMock extends CleanmateService {}
  CleanmateService.prototype['events'] = events;
  CleanmateService.prototype['sendRequest'] = jest.fn().mockResolvedValue(null as never);
  return (new CleanmateServiceMock(ipAddress, authCode, pollInterval)) as unknown as jest.Mocked<CleanmateService>;
};