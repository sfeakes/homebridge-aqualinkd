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

  adActionThermoTargetState: 1, 
  adActionThermoSetpoint: 2,

  adNone: 256
}
