import { CharacteristicValue, HAP, Logging, Service } from 'homebridge';
import CleanmateService from '../cleanmateService';
import { PluginConfig } from '../types';
import { ServiceBase } from './serviceBase';

interface Room {
    id: number;
    name: string;
}

export default class RoomService extends ServiceBase {
  private readonly rooms: Record<number, Service> = {};
  private readonly roomsToClean = new Set<number>();
  private roomTimeout?: NodeJS.Timeout;

  constructor(hap: HAP, log: Logging, config: PluginConfig, cleanmateService: CleanmateService){
    super(hap, log, config, cleanmateService);
    this.config.rooms.forEach((room) => {
      this.createRoom(room);
    });
  }

  private createRoom(room: Room){
    const service = new this.hap.Service.Switch(`${this.config.name} - ${room.name}`);
    service.getCharacteristic(this.hap.Characteristic.On)
      .onGet(() => this.getRoomActiveState(room))
      .onSet((value) => this.setRoomActiveState(value, room));
  }

  private getRoomActiveState(room: Room): CharacteristicValue {
    return this.roomsToClean.has(room.id);
  }

  private setRoomActiveState(value: CharacteristicValue, room: Room) {
    if(value) {
      this.roomsToClean.delete(room.id);
      this.roomsToClean.add(room.id);
      this.resetTimeout();
    }else {
      this.roomsToClean.delete(room.id);
      this.resetTimeout();
    }
  }

  private resetTimeout() {
    if (this.config.roomTimeout > 0) {
      clearTimeout(this.roomTimeout);
      if (this.roomsToClean.size > 0) {
        this.roomTimeout = setTimeout(
          () => this.cleanmateService.cleanRooms([...this.roomsToClean]),
          this.config.roomTimeout * 1000,
        );
      }
    }
  }

  public get services(): Service[] {
    return [...Object.values(this.rooms)];
  }

}