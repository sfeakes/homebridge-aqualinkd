
// We do not need node-fetch, if you remove this it will default to NodeJS internal fetch.
// BUT node-fetch Gives way more meaningful errors than moment, so leaving it in.
var fetch = require("node-fetch"); 

// We need to set ipv4 first, latest node is ipv6 first. 
// can to this be resetting dns or custom http.agent
//const dns = require('node:dns');
// Use http ageng over above.
const http = require('node:http');


var Constants = require('./constants.js');
var Utils = require('./utils.js').Utils;



module.exports = {
  Aqualink : Aqualink
}


var httpAgent = false;

function Aqualink() {}


Aqualink.initialize = function(useSSL, requestHeaders) {
  
  // We can force ipv4 first with below.
  //dns.setDefaultResultOrder('ipv4first');
  // Or we can use a custo, http.user agent.

  httpAgent = new http.Agent({
    family: 4
  });
};

Aqualink.devices = async function(baseURL, completion, error) {
  
  if (httpAgent === false) {
    return;
  }
  
  var url = baseURL + "/api/homebridge";
  var res;

  try {
    res = await fetch(url, {agent: httpAgent} );
  } catch (err) {
    if (typeof error !== 'undefined' && error !== false) {
      error("Error connecting to AqualinkD service", err);
    } else {
      console.log("Error connecting to AqualinkD service : "+ err);
    }
    return;
  }

  if (!res.ok) {
    if (typeof error !== 'undefined' && error !== false) {
      error("Error returned from AqualinkD service", res);
    } else {
      console.log(`Error returned from AqualinkD service: ${res.statusText}`);
    }
    return;
  } else {
    try {
      const json = await res.json();
      var devices = [];

      if (json.devices === undefined) {
        if (typeof completion !== 'undefined' && completion !== false) {
          completion(devices);
        }
        return;
      }

      for (var i = 0; i < json.devices.length; i++) {
        var device = json.devices[i];
        //console.log("Loading aqualink device "+device.id);
        if (device.name != "NONE" && device.id != "") {
          if (device.type == Constants.adDeviceSwitch ||
            device.type == Constants.adDeviceTemperature ||
            device.type == Constants.adDeviceValue ||
            device.type == Constants.adDeviceHeater ||
            device.type == Constants.adDeviceSWGp ||
            device.type == Constants.adDevicePrgSwitch ||
            device.type == Constants.adDeviceFrzProtect
          ) {
            devices.push(device);
            //console.log("Found aqualink device "+device.id);
          } else {
            //console.log("Ignored aqualink device "+device.id);
          }
        }
      }

      if (typeof completion !== 'undefined' && completion !== false) {
        completion(devices);
      }
    } catch (err) {
      if (typeof error !== 'undefined' && error !== false) {
        error("Error understanding result from AqualinkD service", err);
        console.error(err);
      } else {
        console.log("Error understanding result from AqualinkD service : "+ err);
      }
      return;
    }
  }
}


Aqualink.devicesOLD = function(baseURL, completion, error) {
  if (baseHttpRequest === false) {
    return;
  }

  var url = baseURL + "/api/homebridge";

  baseHttpRequest.get({url : url}, function(err, response, json) {
    if (!err && response.statusCode == 200) {
      var devices = [];

      if (json.devices === undefined) {
        if (typeof completion !== 'undefined' && completion !== false) {
          completion(devices);
        }
        return;
      }

      for (var i = 0; i < json.devices.length; i++) {
        var device = json.devices[i];

        if (device.name != "NONE" && device.id != "") {
          if (device.type == Constants.adDeviceSwitch ||
              device.type == Constants.adDeviceTemperature ||
              device.type == Constants.adDeviceValue ||
              device.type == Constants.adDeviceHeater ||
              device.type == Constants.adDeviceSWGp ||
              device.type == Constants.adDevicePrgSwitch ||
              device.type == Constants.adDeviceFrzProtect
              ) {
             devices.push(device);
             //console.log("Found aqualink device "+device.id);
          } else {
            //console.log("Ignored aqualink device "+device.id);
          }
        }
      }

      if (typeof completion !== 'undefined' && completion !== false) {
        completion(devices);
      }
    } else {
      if (typeof error !== 'undefined' && error !== false) {
        error(response, err);
      }
    }
  });
};


Aqualink.updateDeviceStatus = function(accessory, value, completion, statustype = Constants.statusStatus) {
  if (accessory.platform.mqtt) {
    if (accessory.type == Constants.adDeviceSwitch || accessory.type == Constants.adDevicePrgSwitch) {
      accessory.platform.mqtt.send(accessory.id + "/set", value ? "1" : "0");
    } else if (accessory.type == Constants.adDeviceDimmer) {
      accessory.platform.mqtt.send(accessory.id + "/set", value.toString());
    } else if (accessory.type == Constants.adDeviceHeater || accessory.type == Constants.adDeviceSWGp || accessory.type == Constants.adDeviceFrzProtect) {
      if (statustype === Constants.adActionThermoTargetState) {
        accessory.platform.mqtt.send(accessory.id + "/set", (value > 0) ? "1" : "0");
      } else if (statustype === Constants.adActionThermoSetpoint) {
        accessory.platform.mqtt.send(accessory.id + "/setpoint/set", value.toString());
      } else {
        //console.log("Aqualink.updateDeviceStatus thermo action for '"+accessory.id+"' ");
      }
    } else {
      //console.log("Aqualink.updateDeviceStatus unknown update for '"+accessory.id+"' ");
    }

    if (typeof completion !== 'undefined' && completion !== false) {
      completion(true);
    }
    return;
  }

};

