
const allowedCommands = [
    "uptime",
    "df -h",
    "free -m"
];

function isCommandAllowed(command) {
    if (typeof command !== "string") {
        return false;
    }

    return allowedCommands.includes(command.trim());
}

module.exports = { isCommandAllowed };
