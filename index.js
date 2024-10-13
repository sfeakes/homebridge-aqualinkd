// Example ~/.homebridge/config.json content:
//
// {
//  "bridge": {
//         "name": "Homebridge",
//         "username": "CC:21:3E:E4:DE:33", // << Randomize this...
//         "port": 51826,
//         "pin": "031-45-154", // << Change pin
//      },
//
//  "platforms": [{
//         "platform": "aqualinkd",
//         "name": "aqualinkd",
//         "server": "127.0.0.1", // servername/ip running aqualinkd
//         "port": "80",
//         "mqtt": {
//              "host": "mqtt-server.name",  // servername/ip running MQTT
//               "port": 1883,
//               "topic": "aqualinkd",
//               "excludedDevices": []
//         }
//    }],
//  "accessories":[]
// }
//

var pluginName = "homebridge-aqualinkd";
var platformName = "AqualinkD";

var Aqualink = require('./lib/aqualink.js').Aqualink;
var Mqtt = require('./lib/mqtt.js').Mqtt;
var Utils = require('./lib/utils.js').Utils;
var Constants = require('./lib/constants.js');

const packageInfo = require('./package.json');
//const packageVersion = packageInfo.version;

var AqualinkdAccessory = require('./lib/aqualinkd_accessory.js');

const util = require('util');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  //Characteristic = homebridge.api.hap.Characteristic;
  Types = homebridge.hapLegacyTypes;
  UUID = homebridge.hap.uuid;
  packageVersion = packageInfo.version;

  homebridge.registerPlatform(pluginName, "AqualinkD", AqualinkdPlatform, true);
};

function AqualinkdPlatform(log, config, api) {
  this.isSynchronizingAccessories = false;
  this.accessories = [];
  this.forceLog = log;
  this.log = function () {
    if (typeof process.env.DEBUG !== 'undefined') {
      log(util.format.apply(this, arguments));
    }
  };

  log.info(packageInfo.name+" v"+packageInfo.version);

  this.config = config;
  try {
    this.server = config.server;
  } catch (e) {
    return;
  }
  this.authorizationToken = false;
  if (this.server.indexOf(":") > -1 && this.server.indexOf("@") > -1) {
    var tmparr = this.server.split("@");
    this.authorizationToken = Helper.Base64.encode(tmparr[0]);
    this.server = tmparr[1];
  }
  this.port = config.port;
  this.api = api;
  this.apiBaseURL = "http://" + this.server + ":" + this.port + "";
  this.mqtt = false;
  this.ssl = false;

  this.firstrun=true;

  this.isVSPasFanEnabled=false;
  this.isDimmerEnabled=false;



  var requestHeaders = {};
  if (this.authorizationToken) {
    requestHeaders['Authorization'] = 'Basic ' + this.authorizationToken;
  }
  Aqualink.initialize(this, this.ssl, requestHeaders);

  if (this.api) {
    this.api.once("didFinishLaunching", function () {
      var syncDevices = function () {
        this.synchronizeAccessories();
        if (this.firstrun) {
          this.firstrun = false;
          setTimeout(syncDevices.bind(this), 60000); // Sync 1 min after initial load.
        } else
          setTimeout(syncDevices.bind(this), 600000); // Sync devices every 10 minutes
      }.bind(this);
      syncDevices();

      if (config.mqtt) {
        setupMqttConnection(this);
      }
    }.bind(this));
  }
}

AqualinkdPlatform.prototype = {
  synchronizeAccessories: function () {

    if (this.isSynchronizingAccessories) {
      return;
    }

    this.log("Synchronizing Accessories from AqualinkD");

    this.isSynchronizingAccessories = true;
    var excludedDevices = (typeof this.config.excludedDevices !== 'undefined') ? this.config.excludedDevices : [];

    Aqualink.devices(this.apiBaseURL,
      function (devices, aqVersion = "0.0.0") {
        var removedAccessories = [],
            exclude = !1;
        
        var version = Utils.VersionString2Int(aqVersion);  
        this.log("AqualinkD version " + aqVersion + " int "+version);

        for (var i = 0; i < devices.length; i++) {
          var device = devices[i];

        
          /* Change vps pump to fan */
          // Check version > 2.5.0 
          if ( (version >= 20500) && (typeof this.config.VSP_as_Fan !== 'undefined') && (this.config.VSP_as_Fan == true) ) {
            if (device.type == Constants.adDeviceSwitch && device.hasOwnProperty("type_ext") && device.type_ext == Constants.adDeviceSwitchVSP) {
              device.type = Constants.adDeviceVSPfan;
              this.log("Device " + device.name + " changing to Fan");
              this.isVSPasFanEnabled=true;
            }
          }
          
          /* Change colorlight (dimmer) to dimmer light */
          // No need to check version, sine type_ext=light_dimmer was only introduced in aqualinkd versions that support dimmer
          if ( device.type == Constants.adDeviceSwitch && device.hasOwnProperty("type_ext") && device.type_ext == Constants.adDeviceDimmer){
            device.type = Constants.adDeviceDimmer;
            this.log("Device " + device.name + " changing to Dimmer");
            this.isDimmerEnabled=true;
          }

          var existingAccessory = this.accessories.find(function (existingAccessory) {
            return existingAccessory.id == device.id;
          });

          if (existingAccessory) {
            this.log("Device " + device.name + " is "+device.type+" existing is "+existingAccessory.type);
          } else {
            this.log("Device " + device.name + " is "+device.type+" NO existing device ");
          }

          // if device.id is in our ignore list, set the name to NONE.
          // Delete it if it's existing and use else below not if
          //console.log("Exclude "+excludedDevices);
          if ( (excludedDevices.indexOf(device.id) > -1)) {
            // If it's cached accessory now on ignore
            if (existingAccessory) {
              this.log("Device " + existingAccessory.name + " removed due to exclude list");
              removedAccessories.push(existingAccessory);
              try {
                this.api.unregisterPlatformAccessories(pluginName, platformName, [existingAccessory.platformAccessory]);
              } catch (e) {
                this.forceLog("Could not unregister platform accessory! (" + existingAccessory.name + ")" + e);
              }
            } else {
              this.log("Device " + device.name + " ignored due to exclude list");
            }
            continue;
          }
          if (existingAccessory) {
            if (device.type != existingAccessory.type) {
              this.forceLog("Device " + existingAccessory.name + " has changed it's type. Recreating...");
              removedAccessories.push(existingAccessory);
              try {
                this.api.unregisterPlatformAccessories(pluginName, platformName, [existingAccessory.platformAccessory]);

                this.api.updatePlatformAccessories([existingAccessory.platformAccessory]);
              } catch (e) {
                this.forceLog("Could not unregister platform accessory! (" + existingAccessory.name + ")" + e);
              }
            } else {
              // Since we have everything (http device list and accessory list), could update accesories from http-device if needed.
              continue;
            }
          }
          // Generate a new accessory
          var uuid = UUID.generate(device.id);

          var accessory = new AqualinkdAccessory(this, false, device.id, device, uuid);
          this.accessories.push(accessory);
          this.forceLog("Registering new platform accessory! (" + accessory.name + " | " + device.type + " | " + uuid + ")");

          try {
            this.api.registerPlatformAccessories(pluginName, platformName, [accessory.platformAccessory]);
          } catch (e) {
            this.forceLog("Could not register platform accessory! (" + accessory.name + ")" + e);
          }
          // accessory.platformAccessory.context = {device: device, uuid: uuid, eve: this.eve};
          accessory.platformAccessory.context = {
            device: device,
            uuid: uuid
          };
        }
        // delete any accessories that are not in the http device list.  (Default to deleting unless config is set)
        if ( (typeof this.config.no_delete_on_sync === 'undefined') || (this.config.no_delete_on_sync == false) ) {
          for (var i = 0; i < this.accessories.length; i++) {
            var removedAccessory = this.accessories[i];
            var existingDevice = devices.find(function (existingDevice) {
              return existingDevice.id == removedAccessory.id;
            });

            if (!existingDevice) {
              var name = removedAccessory.name;
              removedAccessories.push(removedAccessory);
              this.forceLog("Un-registering platform accessory! (" + name + ")");
              try {
                this.api.unregisterPlatformAccessories(pluginName, platformName, [removedAccessory.platformAccessory]);
              } catch (e) {
                this.forceLog("Could not unregister platform accessory! (" + name + ")" + e);
              }
            }
          }
        }

        for (var i = 0; i < removedAccessories.length; i++) {
          var removedAccessory = removedAccessories[i];
          var index = this.accessories.indexOf(removedAccessory);
          this.accessories.splice(index, 1);
        }

        this.isSynchronizingAccessories = false;
      }.bind(this),
      function (response, err) {
        Utils.LogConnectionError(this, response, err);
        this.isSynchronizingAccessories = false;
      }.bind(this));
  },
  configureAccessory: function (platformAccessory) {
    if (!platformAccessory.context || !platformAccessory.context.device) {
      // Remove this invalid device from the cache.
      try {
        this.api.unregisterPlatformAccessories(pluginName, platformName, [platformAccessory]);
      } catch (e) {
        this.forceLog("Could not unregister cached platform accessory!" + e);
      }
      return;
    }

    var device = platformAccessory.context.device;
    var uuid = platformAccessory.context.uuid;

    //platform.forceLog("Loading platform accessory! (" + device.name + " | " + uuid + ")");
    this.forceLog("Loading platform accessory [" + device.name + "]");

    // Generate the already cached accessory again
    var accessory = new AqualinkdAccessory(this, platformAccessory, device.id, device, uuid);
    this.accessories.push(accessory);
  }
};

function setupMqttConnection(platform) {
  var connectionInformation = {
    host: (typeof platform.config.mqtt.host !== 'undefined' ? platform.config.mqtt.host : '127.0.0.1'),
    port: (typeof platform.config.mqtt.port !== 'undefined' ? platform.config.mqtt.port : 1883),
    topic: (typeof platform.config.mqtt.topic !== 'undefined' ? platform.config.mqtt.topic : 'aqualinkd'),
    username: (typeof platform.config.mqtt.username !== 'undefined' ? platform.config.mqtt.username : ''),
    password: (typeof platform.config.mqtt.password !== 'undefined' ? platform.config.mqtt.password : ''),
  };

  //platform.forceLog("MQTT Connect info : " + platform.config.mqtt.host + ":" + platform.config.mqtt.port + " | topic : " + platform.config.mqtt.topic);

  var mqttError = function () {
    platform.forceLog(
      "There was an error while getting the MQTT Hardware Device from aqualinkd.\nPlease verify that you have started aqualinkd enabeled MQTT and configured zones.");
  };

  platform.mqtt = new Mqtt(platform, connectionInformation.host, connectionInformation.port, connectionInformation.topic, {
    username: connectionInformation.username,
    password: connectionInformation.password
  });
}
