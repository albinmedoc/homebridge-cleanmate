# Homebridge Cleanmate
Cleanmate is a popular robot vacuum cleaner in Sweden. This plugin allows you to control it from HomeKit.

Note: This plugin has only been tested for the Cleanmate S995

## Requirements

- [Homebridge](https://github.com/nfarina/homebridge) HomeKit support for the impatient
- [Cleanmate robot](https://www.cleanmate.se/) The vacuumm cleaner

## Example config

```json
{
  "bridge": {
    "name": "Homebridge",
    "username": "CC:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "012-34-567"
  },
  "accessories": [
    {
      "accessory": "Cleanmate",
      "name": "Cleanmate robot",
      "ipAddress": "192.168.86.22",
      "authCode": "0123456789",
      "pollInterval": 30
    }
  ]
}
```
