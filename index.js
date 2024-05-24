// WOL Server, slashedCodes 2024 //

// Imports
import { wake } from "wol";
import JSON5 from "json5";
import * as fs from "fs";
import * as http from "http";
import * as url from "url";
import * as os from "os";

// Variables //

const configPath = "./config.json5"; // Only change this if you moved the config.json5 file.
const config = loadConfig(configPath);

// Functions //

function log(msg) {
    console.log(`[Info] ${msg}`);
}

function warning(msg, func) {
    console.warn(`[Warning] ${func}(): ${msg}`);
} 

function error(msg, func, quit) {
    console.error(`[Error] ${func}(): ${msg}`);
    if(quit) process.exit();
}

// Load the config file from a specified path.
function loadConfig(path) {
    if(fs.existsSync(path)) {
        const file = fs.readFileSync(path);
        const config = JSON5.parse(file);

        if (config) {
            log("Config file loaded successfully.");
            return config;
        } else { error("Config file empty or null.", "loadConfig", true); }
    } else {
        error("Config file doesn't exist.", "loadConfig", true);
    }
} 

function wakeID(id) {
    return new Promise((resolve) => {
        const computer = config["computers"][id]
        if (computer) {
            const name = computer["name"]
            const mac = computer["mac"]
            const ip = computer["ip"]
            const port = computer["port"]

            log(`Attempting to wake computer ${name} with ID ${id}.`);
            wake(mac, { address: ip, port: port }, (err, res) => {
                if (err) {
                    error(err, "wakeID", false);
                    resolve(500); // 500 Internal Server Error
                } else {
                    log(`Sent magic packet to computer ${name} with ID ${id}!`);
                    resolve(200); // 200 OK
                }
            });
        } else {
            warning("ID is invalid.", "wakeID");
            resolve(400); // 400 Bad request
        }
    })
}

// Web Server Code //

async function getBody(req) {
    return new Promise((resolve, reject) => {
        let body = [];
        
        req.on("data", chunk => {
            body.push(chunk);
        }).on("end", () => {
            body = Buffer.concat(body).toString();

            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        }).on("error", (error) => {
            reject(error);
        });
    });
}

function getIP() {
    let interfaces = os.networkInterfaces();
    for (let devName in interfaces) {
        let iface = interfaces[devName];

        for (let i = 0; i < iface.length; i++) {
            let alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
                return alias.address;
        }
    }
    return '0.0.0.0';
}

const server = http.createServer(async (req, res) => {
    const urlPath = url.parse(req.url).pathname;

    if (req.method === "POST" && urlPath === "/wake") {
        const data = await getBody(req);
        if(data["pin"] != config["pin"]) {
            res.statusCode = 403; // 403 Forbidden
            res.end("Invalid Pin.");
            return;
        }

        res.statusCode = await wakeID(data["id"]);
        switch (res.statusCode) {
            case 200:
                res.end("Success! Sent magic packet.");
                break;
            case 400:
                res.end("Invalid ID.");
                break;
            case 500:
                res.end("Internal server error. Check logs!");
                break;
            default:
                res.end("Other status code. Check logs!");
                break;
        }
    } else {
        res.statusCode = 404; // 404 Not Found
        res.end("This is a WOL Web server. Send a POST request to /wake instead.");
    }
});

server.listen(config["port"], () => { 
    log(`Server started running on port ${config["port"]}!`);
    log(`You can access it at http://${getIP()}:${config["port"]}`);
    log(`Or at http://127.0.0.1:${config["port"]} or at http://localhost:${config["port"]}`)
});