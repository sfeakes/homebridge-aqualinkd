
var Constants = require('./constants.js');
var Mqtt = require('./mqtt.js').Mqtt;
var Utils = require('./utils.js').Utils;
var Aqualink = require('./aqualink.js').Aqualink;

module.exports = AqualinkdAccessory;

function AqualinkdAccessory(platform, platformAccessory, id, device, uuid) {
  this.services = [];
  this.platform = platform;

  this.state = Utils.toBool(device.state);
  this.id = device.id;
  this.name = device.name;
  this.type = device.type;
 
  this.flash = false;
  //this.value = device.value;
  this.value;
  this.setTemperatureValue(device.value);

  //this.status = device.status;
  if (typeof device.status !== 'undefined')
    this.status = Utils.toBool(device.status);

  if (typeof device.spvalue !== 'undefined')
    this.spvalue = device.spvalue;
  //this.setSetpoint(device.spvalue)
  //this.spvalue = device.spvalue;

  this.uuid = uuid;

  var voidCallback = function() {};

  this.platformAccessory = platformAccessory;
  if (!this.platformAccessory) {
    this.platformAccessory = new platform.api.platformAccessory(this.name, uuid);
  }
  this.platformAccessory.reachable = true;
  this.publishServices();
}

AqualinkdAccessory.prototype = {
  identify : function(callback) { callback(); },
  publishServices : function() {
    var services = this.getServices();
    for (var i = 0; i < services.length; i++) {
      var service = services[i];

      var existingService = this.platformAccessory.services.find(function(eService) { return eService.UUID == service.UUID; });

      if (!existingService) {
        this.platformAccessory.addService(service, this.name);
      }
    }
  },
  getService : function(name) {
    var service = false;
    try {
      service = this.platformAccessory.getService(name);
    } catch (e) {
      service = false;
    }

    if (!service) {
      var targetService = new name();
      service = this.platformAccessory.services.find(function(existingService) { return existingService.UUID == targetService.UUID; });
    }

    return service;
  },
  getCharacteristic : function(service, name) {
    var characteristic = false;
    try {
      characteristic = service.getCharacteristic(name);
    } catch (e) {
      this.platform.forceLog("getCharacteristic failed For: " + this.name + " " + name.AccessoryInformation);
      characteristic = false;
    }

    if (!characteristic) {
      try {
        var targetCharacteristic = new name();
        characteristic = service.characteristics.find(function(existingCharacteristic) { return existingCharacteristic.UUID == targetCharacteristic.UUID; });
      } catch (e) {
        this.platform.forceLog("getCharacteristic failed For: " + this.name + " " + name.AccessoryInformation);
        characteristic = false;
      }
    }

    return characteristic;
  },
  gracefullyAddCharacteristic : function(service, characteristicType) {
    var characteristic = this.getCharacteristic(service, characteristicType);
    if (characteristic) {
      return characteristic;
    }

    return service.addCharacteristic(new characteristicType());
  },
  setState : function(state, callback, context) {
    this.platform.log("Aqualinkd_accessory.setState '"+this.id+"' "+state+" '"+context+"'");

    // State can be 2 for cooling, reset it to one. since there is no heat & cool on any device.
    if (state > 0 && (this.type === Constants.adDeviceSWGp || this.type === Constants.adDeviceFrzProtect) )
      this.state = 1;
    else
      this.state = state;

    if (context && context == "Aqualinkd-MQTT") {
      callback();
      return;
    }

    Aqualink.updateDeviceStatus(this, this.state, function(success) { callback(); }.bind(this));
  },
  getState : function(callback) {
    this.platform.log("Aqualinkd_accessory.getState '"+this.id+"' "+this.state);
    
    if (this.state > 0 && (this.type === Constants.adDeviceSWGp || this.type === Constants.adDeviceFrzProtect) )
      callback(null, 2); // on is cooling for SWG to get blue icon
    else
      callback(null, this.state);

  },
  getTargetState : function(callback) {
    this.platform.log("Aqualinkd_accessory.getTargetState '"+this.id+"' "+this.status);

    if (this.status > 0 && (this.type === Constants.adDeviceSWGp || this.type === Constants.adDeviceFrzProtect) ) // SWG is 0 or 2 (no 1)
      callback(null, 2);
    else
      callback(null, this.status);

  },
  setTargetState : function(value, callback, context) {

    this.platform.log("Aqualinkd_accessory.setTargetState '"+this.id+"' "+value);

    if (value > 0 && (this.type === Constants.adDeviceHeater || this.type === Constants.adDeviceSWGp || this.type === Constants.adDeviceFrzProtect) )
      this.status = 1;
    else
      this.status = value;

    if (context && context == "Aqualinkd-MQTT") {
      callback();
      return;
    }

    // this.platform.mqtt.send(this.id+"/duration/set", value.toString());
    Aqualink.updateDeviceStatus(this, value, function(success) { callback(); }.bind(this), Constants.adActionThermoTargetState);
  },
  setTemperatureValue : function(temp) {
    //if (this.type === Constants.adDeviceValue && this.id != "SWG/Percent_f") {
    if (this.type === Constants.adDeviceValue && this.id.slice(-2) != "_f") {
      this.value = Utils.degFtoC(temp);
    } else {
      this.value = temp;
    }
    // -999 F or -572.78 C means not set, so use 0. (homekit can only take -18)
    if (this.value < -500)
      this.value = 0;
  },

  setTemperature : function(value, callback, context) {
    this.platform.log("Aqualinkd_accessory.setTemperature '"+this.id+"' "+value);

    //this.value = value;
    this.setTemperatureValue(value);

    if (context && context == "Aqualinkd-MQTT") {
      //if (typeof callback === "function") {callback();}
      callback();
      return;
    }

    //if (typeof callback === "function") {callback();}
    callback();

  },
  getTemperature : function(callback) {
    this.platform.log("Aqualinkd_accessory.getTemperature '"+this.id+"' "+this.value);
    //callback(null, this.value);
    // NSF come back and check this, we should not need the if test, but no harm leaving it.
    if (typeof callback === "function") {
      callback(null, this.value);
    }
    return;
  },
  setTargetTemperature : function(value, callback, context) {
    this.platform.log("Aqualinkd_accessory.setTargetTemperature '"+this.id+"' "+value);

    this.spvalue = value;
    //this.setSetpoint(value);
 
    if (context && context == "Aqualinkd-MQTT") {
      callback();
      return;
    }

    Aqualink.updateDeviceStatus(this, value, function(success) { callback(); }.bind(this), Constants.adActionThermoSetpoint);
    
  },
  getTargetTemperature : function(callback) {
    this.platform.log("Aqualinkd_accessory.getTemperature '"+this.id+"' "+this.spvalue);
    callback(null, this.spvalue);
    return;
  },
  getServices : function() {
    this.services = [];
    var informationService = this.getService(Service.AccessoryInformation);
    if (!informationService) {
      informationService = new Service.AccessoryInformation();
    }
    informationService.setCharacteristic(Characteristic.Manufacturer, "Aqualinkd")
        .setCharacteristic(Characteristic.Model, this.type)
        .setCharacteristic(Characteristic.SerialNumber, "Aqualinkd " + this.name);
    this.services.push(informationService);

    if (this.type === Constants.adDeviceSwitch || this.type === Constants.adDevicePrgSwitch) {
      service = this.getService(Service.Switch);
      if (!service) {
        service = new Service.Switch(this.name);
      }
      this.getCharacteristic(service, Characteristic.On).on('set', this.setState.bind(this)).on('get', this.getState.bind(this));
    } else if (this.type === Constants.adDeviceTemperature || this.type === Constants.adDeviceValue) {
      var service = this.getService(Service.TemperatureSensor);

      if (!service) {
        service = new Service.TemperatureSensor(this.name);

        if (this.type === Constants.adDeviceValue /* NSF Add check for PPM*/) {
          this.getCharacteristic(service, Characteristic.CurrentTemperature).setProps({
            minValue: -18,
            maxValue: 4500 // 4500 in t to c
          });
        } else /*if (this.type === Constants.adDeviceValue NSF Add check for Percent )*/ {
          this.getCharacteristic(service, Characteristic.CurrentTemperature).setProps({
            minValue: -18, // 0 in f to c
            maxValue: 100
          });
        } 

      }

      this.getCharacteristic(service, Characteristic.CurrentTemperature).on('get', this.getTemperature.bind(this)).on('set', this.setTemperature.bind(this));
      //this.getCharacteristic(service, Characteristic.CurrentTemperature).updateValue(this.value);

    } else if (this.type === Constants.adDeviceHeater || this.type === Constants.adDeviceSWGp || this.type === Constants.adDeviceFrzProtect) {
      service = this.getService(Service.Thermostat);
      if (!service) {
        service = new Service.Thermostat(this.name);
      }

      //unit: 'percent', // Characteristic.Units.CELSIUS // Try 'percentage'
      var format = Characteristic.Formats.FLOAT;
      var minValue = 5; // 42 in f to c
      var maxValue = 40; // 104 in f to c
      var validValues = [0, 1];

      if (this.type === Constants.adDeviceSWGp) {
        var minValue = -18; // 0 in f to c
        var maxValue = 40; // 104
        var validValues = [0,2]; // Don't allow SWG to be turned on or off
      } else if (this.type === Constants.adDeviceFrzProtect) {
        // Below 2 floats are correct, but is causes the devive to not reply in homebridge.
        //var minValue = 1.11; // 42 in f to c
        //var maxValue = 5.56;
        var minValue = 1; // 34 in f to c
        var maxValue = 6; // 42 in f to c
        var validValues = [0,2];
      }

      this.getCharacteristic(service, Characteristic.TargetTemperature).setProps({
        format: format,
        minValue: minValue, // 42 in f to c
        maxValue: maxValue
      });
      this.getCharacteristic(service, Characteristic.TargetHeatingCoolingState).setProps({
        validValues: validValues
      });

      this.getCharacteristic(service, Characteristic.CurrentTemperature).setProps({
        //format: 'float',
        format: Characteristic.Formats.FLOAT,
        minValue: -18, // 0 in f to c
        maxValue: 72 // 160 in f to c
      });

      this.getCharacteristic(service, Characteristic.CurrentHeatingCoolingState).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
      this.getCharacteristic(service, Characteristic.TargetHeatingCoolingState).on('get', this.getTargetState.bind(this)).on('set', this.setTargetState.bind(this));
      this.getCharacteristic(service, Characteristic.CurrentTemperature).on('get', this.getTemperature.bind(this)).on('set', this.setTemperature.bind(this));
      this.getCharacteristic(service, Characteristic.TargetTemperature).on('get', this.getTargetTemperature.bind(this)).on('set', this.setTargetTemperature.bind(this));
      //this.getCharacteristic(service, Characteristic.CurrentTemperature).updateValue(this.value);

    } else {
      // Unknown accessory
    }

    this.services.push(service);

    return this.services;
  },

  handleMQTTMessage : function(topic, message, callback) {
    //this.platform.log("MQTT received for '%s'. Topic:'%s' Message:'%s'", this.id, topic, message);

    //var value = parseInt(message) == 1 ? 1 : 0;
    var value = parseInt(message);
    var service = false;
    var characteristic;

    // Handle all the perfect matches.
    if (this.id == topic) {
      //this.platform.log("ACC match '%s'. Topic:'%s'", this.id, topic);
      if (this.type === Constants.adDeviceSwitch || this.type === Constants.adDevicePrgSwitch) {
        service = this.getService(Service.Switch);
        characteristic = this.getCharacteristic(service, Characteristic.On);
      } else if (this.type === Constants.adDeviceTemperature) {
        //this.setTemperature(parseInt(message), false, "Aqualinkd-MQTT");
        value = parseFloat(message);
        service = this.getService(Service.TemperatureSensor);
        characteristic = this.getCharacteristic(service, Characteristic.CurrentTemperature);
      } else if (this.type === Constants.adDeviceValue) {
        value = parseFloat(message);
        service = this.getService(Service.TemperatureSensor);
        characteristic = this.getCharacteristic(service, Characteristic.CurrentTemperature);
      } else if (this.type === Constants.adDeviceHeater || this.type === Constants.adDeviceSWGp || this.type === Constants.adDeviceFrzProtect) {
        //this.setState(value, false, "Aqualinkd-MQTT");
        //this.platform.log("Device '%s'. CurrentHeatingCoolingState '%d'", this.id, value);
        service = this.getService(Service.Thermostat);
        characteristic = this.getCharacteristic(service, Characteristic.CurrentHeatingCoolingState);
      }
    } else {
      //this.platform.log("ACC NO match '%s'. Topic:'%s'", this.id, topic);
    }

    var pos = topic.lastIndexOf("/");
    if (pos != -1 && topic.substring(pos+1) == "enabled") {
      if (this.id == topic.substring(0, pos)) {
        //this.setTargetState(value, false, "Aqualinkd-MQTT");
        //this.platform.log("Device '%s'. TargetHeatingCoolingState '%d'", this.id, value);
        service = this.getService(Service.Thermostat);
        characteristic = this.getCharacteristic(service, Characteristic.TargetHeatingCoolingState);
      }
    } else if (pos != -1 && topic.substring(pos+1) == "setpoint") {
      if (this.id == topic.substring(0, pos)) {
        //this.setTargetTemperature(parseInt(message), false, "Aqualinkd-MQTT")
        //this.platform.log("Device '%s'. TargetTemperature '%d'", this.id, value);
        value = parseFloat(message);
        service = this.getService(Service.Thermostat);
        characteristic = this.getCharacteristic(service, Characteristic.TargetTemperature);
      }
    } else if (pos != -1 && topic.substring(pos+1) == "delay") {
      if (this.id == topic.substring(0, pos)) {
        if (value == 1)
          this.flash = true;
        else
          this.flash = false;
        this.platform.log("GOT DELAY FOR '%s'. Topic:'%s'", this.id, topic);
      }
    } else if (topic == "Temperature/Pool" && this.id == "Pool_Heater") {
      //this.setTargetTemperature(parseInt(message), false, "Aqualinkd-MQTT")
      //this.platform.log("Device '%s'. CurrentTemperature '%d'", this.id, value);
      service = this.getService(Service.Thermostat);
      value = parseFloat(message);
      characteristic = this.getCharacteristic(service, Characteristic.CurrentTemperature);
    } else if (topic == "Temperature/Spa" && this.id == "Spa_Heater") {
      //this.platform.log("Device '%s'. CurrentTemperature '%d'", this.id, value);
      service = this.getService(Service.Thermostat);
      value = parseFloat(message);
      characteristic = this.getCharacteristic(service, Characteristic.CurrentTemperature);
    } else if (topic == "Temperature/Air" && this.id == "Freeze_Protect") {
      //this.platform.log("Device '%s'. CurrentTemperature '%d'", this.id, value);
      service = this.getService(Service.Thermostat);
      value = parseFloat(message);
      characteristic = this.getCharacteristic(service, Characteristic.CurrentTemperature);
    } else if (topic == "SWG/Percent_f" && this.id == "SWG") {
      //this.platform.log("Device '%s'. CurrentTemperature '%d'", this.id, value);
      service = this.getService(Service.Thermostat);
      value = parseFloat(message);
      characteristic = this.getCharacteristic(service, Characteristic.CurrentTemperature);
    }
    // Now handle multiple devices using same MQTT message

    if (service != false && characteristic != false) {
      this.platform.log("MQTT acting on message for ID:'%s'. Topic:'%s' Message:'%s' Value used:'%d'", this.id, topic, message, value);
      callback(characteristic, value);
    }

    return;
  }
}
