var inherits = require('util').inherits;
var Constants = require('./constants.js');

module.exports = {
    Utils: Utils
}

function Utils() {}

Utils.LogConnectionError = function(platform, message, err)
{
  var errorMessage = "There was a problem connecting to AqualinkD.";

  if (message) {
    errorMessage = message;
  }

  
  if (err && err.statusCode) {
    errorMessage += " (HTTP Status code " + err.statusCode + ")\n" + err.body;
  } else if (err && err.statusText) {
    errorMessage += " : `" + err.statusText + "`";
  } else if (err && err.message) {
    errorMessage += " : `" + err.message+ "`";
  } else if (err) {
    errorMessage += "\n - " + err;
  }

  platform.forceLog.error(errorMessage);
}

Utils.degFtoC = function(value) {
  //console.log("degFtoC '"+value+"' = '"+(value - 32) * 5 / 9+"'");
  return (value - 32) * 5 / 9;
}
Utils.degCtoF = function(value) {
  return value * 9 / 5 + 32;
}
/*
Utils.TemperatureLimits = function(value)  {
  if (value <= -18)
    return -18;
  else if (value > 4500.89)
    return 4500.89;
  
  return value;
}

Utils.parseFloatTemp = function(value)  {
  return Utils.TemperatureLimits(parseFloat(value));
}
*/
Utils.parseAccessoryTargetValue = function(type, value)  {
  var val = parseFloat(value);
  switch(type) {
    case Constants.adDeviceSWGp:
      if (val > Constants.adPercentTargetMax)
        val = Constants.adPercentTargetMax;
      else if (val < Constants.adPercentTargetMin)
        val = Constants.adPercentTargetMin;
    break;
    
    case Constants.adDeviceFrzProtect:
      if (val > Constants.adFrzProtectTargetMax)
        val = Constants.adFrzProtectTargetMax;
      else if (val < Constants.adFrzProtectTargetMin)
        val = Constants.adFrzProtectTargetMin;
    break;

    case Constants.adDeviceVSPfan:
    case Constants.adDeviceDimmer:
      if (val > Constants.adPercentMax)
        val = Constants.adPercentMax;
      else if (val < Constants.adPercentMin)
        val = Constants.adPercentMin;
    break;

    case Constants.adDeviceDimmer:
      if (val > Constants.adDimmerMax)
        val = Constants.adDimmerMax;
      else if (val < Constants.adDimmerMin)
        val = Constants.adDimmerMin;
    break;

    case Constants.adDeviceTemperature:
    default:
      if (val > Constants.adHeaterTargetMax)
        val = Constants.adHeaterTargetMax;
      else if (val < Constants.adHeaterTargetMin)
        val = Constants.adHeaterTargetMin;
    break;
  }
  return val;

}

Utils.parseAccessoryValue = function(type, value)  {
  var val = parseFloat(value);
  switch(type) {
    case Constants.adDeviceSWGp:
      if (val > Constants.adPercentTargetMax)
        val = Constants.adPercentTargetMax;
      else if (val < Constants.adPercentTargetMin)
        val = Constants.adPercentTargetMin;
    break;
    
    case Constants.adDeviceValue:
      if (val > Constants.adValueMax)
        val = Constants.adValueMax;
      else if (val < Constants.adValueMin)
        val = Constants.adValueMin;
    break;
    
    case Constants.adDeviceDimmer:
      if (val > Constants.adDimmerMax)
        val = Constants.adDimmerMax;
      else if (val < Constants.adDimmerMin)
        val = Constants.adDimmerMin;
    break;

    case Constants.adDeviceVSPfan:
    case Constants.adDeviceDimmer:
      if (val > Constants.adPercentMax)
        val = Constants.adPercentMax;
      else if (val < Constants.adPercentMin)
        val = Constants.adPercentMin;
    break;

    case Constants.adDeviceTemperature:
    case Constants.adDeviceHeater:
    case Constants.adDeviceChiller:
    default:
      if (val > Constants.adTempMax)
        val = Constants.adTempMax;
      else if (val < Constants.adTempMin)
        val = Constants.adTempMin;
    break;
  }

  return val;
}

//var TRUTHY_VALUES = 'y yes true'.split(/\s/);
var TRUTHY_VALUES = 'y yes true on enabled'.split(/\s/);
Utils.toBool =  function(value) {
    value = value.toString();
    value = value.trim();
    value = value.toLowerCase();

    // Empty string is considered a falsy value
    if(!value.length) {
      return false;

    // Any number above zero is considered a truthy value
    } else if(!isNaN(Number(value))) {
      return value > 0;

    // Any value not marked as a truthy value is automatically falsy
    } else {
      return TRUTHY_VALUES.indexOf(value) >= 0;
    }
}


// Convert version string eg "2.5.0 (Dev 0.1)" to int 20500
// Magor . Minor . Patch 
// one-or-two digits . one-or-two digits . one-or-two digits <ignore>
Utils.VersionString2Int = function(ver) {
  vstr = ver.split('.', 3).map(function (n) { 
    var x = parseInt(n, 10); 
    if (x < 10 && x > 0) { 
      return "0" + x; 
    } else if (x==0) { 
      return "00"; 
    } else { return +x; } 
  });
  return parseInt(vstr.join(""), 10);
}
