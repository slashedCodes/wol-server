# WOL-Server
Basic Wake-On-Lan server with basic authentication.

# Installation
For Raspberry Pi's or other linux devices, follow [RPI.md](RPI.md)

```
git clone https://github.com/slashedCodes/wol-server.git
cd wol-server
npm i # Install dependencies
sudo npm i -g nodemon # Install nodemon

# Rename config.json5.example to config.json5
mv config.json5.example config.json5
nano config.json5 # Edit config file and adjust to your needs.

# Run using package.json scripts
npm run start

# Run manually using nodemon
nodemon index.js
```

# Usage
I made this primarily for IOS shortcuts, but it's a simple POST request: <br>
To wake a computer, make a post request to /wake and include these parameters in a JSON body:
```
{
    "pin": "1234abc", // Pin for authentication. Make sure it's a string.
    "id": "my-computer" // Computer ID in config.json5
}
```
