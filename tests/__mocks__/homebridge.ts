import { API } from 'homebridge';
import { Characteristic } from 'hap-nodejs';

const createGetCharacteristicMock = () =>
  jest.fn().mockImplementation(() =>
    Object.assign({}, createChainableServiceMethodsMock(), {
      setProps: jest.fn(),
      on: createGetCharacteristicMock(),
      onGet: createGetCharacteristicMock(),
      onSet: createGetCharacteristicMock(),
    }),
  );

const createChainableServiceMethodsMock = () => ({
  addLinkedService: jest.fn(),
  setPrimaryService: jest.fn(),
  getCharacteristic: createGetCharacteristicMock(),
  setCharacteristic: jest
    .fn()
    .mockImplementation(createChainableServiceMethodsMock),
  updateCharacteristic: jest
    .fn()
    .mockImplementation(createChainableServiceMethodsMock),
});

const createServiceMock = () =>
  jest
    .fn()
    .mockImplementation((name, type) =>
      Object.assign({ name, type }, createChainableServiceMethodsMock()),
    );

const Service = Object.assign(createServiceMock(), {
  Battery: createServiceMock(),
  OccupancySensor: createServiceMock(),
  Switch: createServiceMock(),
  AccessoryInformation: createServiceMock(),
  Fanv2: createServiceMock(),
  MotionSensor: createServiceMock(),
  Lightbulb: createServiceMock(),
});

export const createHomebridgeMock = () =>
  ({
    registerAccessory: jest.fn(),
    hap: { Characteristic, Service },
  } as unknown as jest.Mocked<API>);