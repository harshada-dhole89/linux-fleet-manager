const { executeCommand } = require("./services/sshService");

async function test() {
    try {
        const output = await executeCommand("uptime");
        console.log("Command output:", output);
    } catch (error) {
        console.log("Command failed:", error.message);
    }
}

test();