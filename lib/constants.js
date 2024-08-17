global.Service;
global.Characteristic;
global.Types;
global.UUID;

module.exports = {
  adDeviceSwitch : "switch",
  adDeviceTemperature : "temperature", // need to lowercase this
  adDeviceHeater : "setpoint_thermo",
  adDeviceSWGp : "setpoint_swg",
  adDeviceValue : "value",  // need to lowercase this
  adDeviceFrzProtect : "setpoint_freeze",
  adDevicePrgSwitch : "switch_program",
  adDeviceDimmer : "switch_dimmer",  // Not working yet. Uncomment Line index.js:123 to work again.

  adActionThermoTargetState: 1, 
  adActionThermoSetpoint: 2,

  adTempMax : 100,
  adTempMin : -18, // -18 is 0
  adHeaterTargetMax : 40.8, // 40 is 104
  adHeaterTargetMin : 2,
  adPercentTargetMax : 38, // 38 os 100
  adPercentTargetMin : -18,
  adFrzProtectTargetMax : 6,
  adFrzProtectTargetMin : 1,
  adValueMax : 4500,
  adValueMin : -18,
  adDimmerMax : 100,
  adDimmerMin : 0,

  adNone: 256
}
