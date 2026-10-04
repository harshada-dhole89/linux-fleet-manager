const { Client } = require("ssh2");
const fs = require("fs");
require("dotenv").config();

function executeCommand(command) {

    return new Promise((resolve, reject) => {

        const conn = new Client();

        conn.on("ready", () => {
            console.log("SSH connection successful");

            conn.exec(command, (error, stream) => {

                if (error) {
                    conn.end();
                    reject(error);
                    return;
                }

                let output = "";
                let errorOutput = "";

                stream.on("data", (data) => {
                    output += data.toString();
                });

                stream.stderr.on("data", (data) => {
                    errorOutput += data.toString();
                });

                stream.on("close", () => {
                    conn.end();

                    if (errorOutput) {
                        reject(new Error(errorOutput));
                    } else {
                        resolve(output);
                    }
                });
            });
        });

        conn.on("error", (error) => {
            reject(error);
        });

        conn.connect({
            host: process.env.SSH_HOST,
            username: process.env.SSH_USER,
            privateKey: fs.readFileSync(process.env.SSH_KEY_PATH)
        });
    });
}

module.exports = { executeCommand };