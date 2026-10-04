const { createLog } = require("./utils/commandLogs");

const log = createLog(
    1,
    "uptime",
    "success",
    "09:45:54 up 1:35",
    "admin"
);

console.log(log);