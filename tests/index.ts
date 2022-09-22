import CleanmateService from '../src/cleanmateService';
import { MopMode, WorkMode } from '../src/types';

const cleanmateService = new CleanmateService('192.168.86.248', '3592407072');

/* setInterval(() => {
  cleanmateService.updateStatus().then(() => {
    console.log(cleanmateService.latestStatusResponse);
  });
}, 2000); */


/* cleanmateService.start(WorkMode.Silent);

setTimeout(() => {
  cleanmateService.pause();
}, 1000 * 6); */

cleanmateService.setMopMode(MopMode.Low);
setTimeout(() => {
  cleanmateService.setMopMode(MopMode.Medium);
  setTimeout(() => {
    cleanmateService.setMopMode(MopMode.High);
  }, 1000 * 6);
}, 1000 * 6);