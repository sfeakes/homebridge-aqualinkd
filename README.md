# homebridge-aqualinkd

## Homebridge platform plugin for AqualinkD

Designed to be used with AqualinkD https://github.com/sfeakes/AqualinkD

#Details to follow

Example config
```
// Example ~/.homebridge/config.json content:

 {
  "bridge": {
         "name": "Homebridge",
         "username": "CC:21:3E:E4:DE:33", // << Randomize this...
         "port": 51826,
         "pin": "031-45-154", // << Change pin
      },

  "platforms": [{
         "platform": "aqualinkd",
         "name": "aqualinkd",
         "server": "127.0.0.1", // servername/ip running aqualinkd
         "port": "80",
         "mqtt": {
               "host": "mqtt-server.name",  // servername/ip running MQTT
               "port": 1883,
               "topic": "aqualinkd"
         }
    }],
  "accessories":[]
 }

```

