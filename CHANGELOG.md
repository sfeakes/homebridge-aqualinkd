# Change Log

## v0.3.5 (2024-10-12)
### Featured Changes
* Must use AqualinkD 2.5.0 for the below to work.
* Added option to use Fan for Variable Speed Pump (use config to enable : "VSP_as_Fan": true).
* Added Light Dimmer for Dimmable Lights. (use aqualinkd.conf to enable : buton_??_light_type=11)

## v0.3.4 (2024-08-18)
### Featured Changes
* Housekeeping for Homebridge V2.

## v0.3.3 (2024-08-17)
### Featured Changes
* Changed for Homebridge V2.
* Use version 3.2 or below for versions of homebridge < 2.0.

## v0.3.1 (2023-07-07)
### Featured Changes
* Few changes to check values that are outside the limits of homekit.
* Added config param `no_delete_on_sync`. This will only allow add & modify (no delete), when syncing accessories with AqualinkD

## v0.2.8 (2023-06-27)
### Featured Changes
* Fixed node.js v18 issue where ipv6 address would get resolved from localhost rather than ipv4 address. (Only an issue if AqualinkD service is running on the same machine as Homebridge.)

## v0.2.7 (2023-06-21)
### Featured Changes
* Cleaned up status messages.
* Notifications on AqualinkD going off line or panel put in service mode

## v0.2.5 (2023-06-19)
### Featured Changes
* Fixed issue with case on platform name that caused plugin not to be found.
* Suppressed the `This plugin generated a warning from the characteristic` homebridge messages 

## Upgrading from 2.4 to any later version.
Please make sure the platform name is `"name": "AqualinkD"` (case sensitive) in your homebridge `config.json`
If you upgrade to this version you will most lightly have to manually change this, this is a limitation on how homebridge-ui auto-generated the platform name
You can either manually edit, or use homebridge-ui config editor.
Example
```
        {
            "name": "AqualinkD",
            "server": "pool.local",
            "port": "80",
            "mqtt": {
                "host": "mqtt.local",
                "port": "1883",
                "topic": "aqualinkd"
            },
            "excludedDevices": [
                "SWG/Percent_f"
            ],
            "platform": "AqualinkD"
        }
```
