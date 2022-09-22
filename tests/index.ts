import CleanmateService from '../src/cleanmateService';

const cleanmateService = new CleanmateService('192.168.86.248', '3592407072');

setInterval(() => {
  cleanmateService.updateStatus().then(() => {
    console.log(cleanmateService.status);
  });
}, 2000);


/* cleanmateService.start();

setTimeout(() => {
  cleanmateService.end();
}, 1000 * 15); */