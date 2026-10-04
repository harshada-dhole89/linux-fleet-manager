const { isCommandAllowed } = require("./commandAllowlist");
console.log(isCommandAllowed("uptime"))
console.log(isCommandAllowed("rm -rf /"))