global.Service;
global.Characteristic;
global.Types;
global.UUID;
global.packageVersion;

module.exports = {
  adDeviceSwitch : "switch",
  adDeviceTemperature : "temperature", // need to lowercase this
  adDeviceHeater : "setpoint_thermo",
  adDeviceSWGp : "setpoint_swg",
  adDeviceValue : "value",  // need to lowercase this
  adDeviceFrzProtect : "setpoint_freeze",
  adDeviceSwitchPrg : "switch_program",
  adDeviceSwitchVSP : "switch_vsp", 
  // Above are in json devices, below are for homekit.
  adDeviceDimmer : "light_dimmer",  // Not fully implimented.  aqualinkd_accessories.js line
  //adDeviceDimmer2 : "light_dimmer2",  // Not fully implimented.  aqualinkd_accessories.js line
  adDeviceVSPfan : "vsp_fan",  

  //aqLightTypeDimmerID: 10,      // From color_lights.h (in aqualinkd)
  //aqLightTypeDimmer2ID: 11,  // From color_lights.h (in aqualinkd)

  statusStatus: 0,
  adActionThermoTargetState: 1, 
  adActionThermoSetpoint: 2,
  adActionVSPpercent: 3,
  adActionDimmerPercent: 4,

  adTempMax : 100,
  adTempMin : -18, // -18 is 0
  adHeaterTargetMax : 40.8, // 40 is 104
  adHeaterTargetMin : 2,
  adPercentTargetMax : 38, // 38 is 100
  adPercentTargetMin : -18,
  adFrzProtectTargetMax : 6,
  adFrzProtectTargetMin : 1,
  adValueMax : 4500,
  adValueMin : -18,
  adPercentMax : 100,
  adPercentMin : 0,
  adNone: 256
}
