var request = require("request");
var Constants = require('./constants.js');
var Utils = require('./utils.js').Utils;

// Need to cheang requests to node-fetch
// const fetch = require('node-fetch');


module.exports = {
  Aqualink : Aqualink
}

var baseHttpRequest = false;

function Aqualink() {}

Aqualink.initialize = function(useSSL, requestHeaders) {
  var defaultRequestOptions = {headers : requestHeaders, json : true};

  if (useSSL) {
    defaultRequestOptions.agentOptions = {rejectUnauthorized : false};
  }

  baseHttpRequest = request.defaults(defaultRequestOptions);
};

Aqualink.devices = function(baseURL, completion, error) {
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

// This is not used, just here incase we go back to using HTTP with MQTT
/*
Aqualink.deviceStatus = function(accessory, completion, statustype, error) {
  if (baseHttpRequest === false) {
    return;
  }

  //var url = accessory.platform.apiBaseURL + "type=homebridge";
  var url = accessory.platform.apiBaseURL + "/api/homebridge";

  baseHttpRequest.get({url : url}, function(err, response, json) {

    if (!err && response.statusCode == 200 && json !== undefined) {
      if (json.devices === undefined) {
        // Handle error
        return;
      }
      for (var i = 0; i < json.devices.length; i++) {
        var device = json.devices[i];
        if (device.id == accessory.id) {
          if (statustype === Constants.statusDuration)
            completion(device.duration);
          else 
            completion(device.state == "on" ? 1 : 0);
        }
      }
    } else {
      Utils.LogConnectionError(this.platform, response, err);
      if (typeof error !== 'undefined' && error !== false) {
        error();
      }
    }
  }.bind(accessory));
};
*/
Aqualink.updateDeviceStatus = function(accessory, value, completion, statustype = Constants.statusStatus) {
  if (accessory.platform.mqtt) {
    if (accessory.type == Constants.adDeviceSwitch || accessory.type == Constants.adDevicePrgSwitch) {
      accessory.platform.mqtt.send(accessory.id + "/set", value ? "1" : "0");
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
/*
  NSF leave this here, incase we need to update via HTTP and not MQTT
  var url = accessory.platform.apiBaseURL + "type=option&option=" + this.id + "&state=" + value ? "on" : "off";
  if (accessory.type == Constants.adDeviceZone && this.id != Constants.idCycleAllZones)
    url = accessory.platform.apiBaseURL + "type=zone&zone=" + this.zonenumber + "&state=" + value ? "on" : "off";

  for (var key in parameters) {
    url += "&" + encodeURI(key) + "=" + encodeURI(parameters[key]);
  }

  Aqualink.updateWithURL(accessory, url, completion);
*/
};

Aqualink.updateWithURL = function(accessory, url, completion) {
  if (baseHttpRequest === false) {
    return;
  }

  baseHttpRequest.put({url : url, header : this.requestHeaders, json : true}, function(err, response) {
    var success = (typeof err === 'undefined' || !err);

    if (success) {
      this.platform.log(this.name + " sent command succesfully.");
    } else {
      Utils.LogConnectionError(this.platform, response, err);
    }

    if (typeof completion !== 'undefined' && completion !== false) {
      completion(success);
    }
  }.bind(accessory));
};
