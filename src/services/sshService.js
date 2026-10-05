const { Client } = require("ssh2");
const fs = require("fs");
require("dotenv").config();

function executeCommand(node, command) {

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
            host: node.ip_address,
            username: node.ssh_user,
            privateKey: fs.readFileSync(process.env.SSH_KEY_PATH)
        });
    });
}

module.exports = { executeCommand };