import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import CleanmatePlugin from './cleanmatePlugin';

export = (api: API) => {
  api.registerAccessory(PLATFORM_NAME, CleanmatePlugin);
};
