# Change Log

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

## v0.2.7 (2023-06-21)
### Featured Changes
* Cleaned up status messages.
* Notifications on AqualinkD going off line or panel put in service mode


## v0.2.5 (2023-06-19)
### Featured Changes
* Fixed issue with case on platform name that caused plugin not to be found.
* Suppressed the `This plugin generated a warning from the characteristic` homebridge messages 

