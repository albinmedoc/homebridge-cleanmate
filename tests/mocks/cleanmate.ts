import { EventEmitter } from 'events';
import Cleanmate from 'cleanmate';

export default (ipAddress: string, authCode: string, pollInterval?: number) => {
  const events = new EventEmitter();
  class CleanmateMock extends Cleanmate {}
  Cleanmate.prototype['events'] = events;
  Cleanmate.prototype['sendRequest'] = jest.fn().mockResolvedValue(null as never);
  return (new CleanmateMock(ipAddress, authCode, pollInterval)) as unknown as jest.Mocked<Cleanmate>;
};