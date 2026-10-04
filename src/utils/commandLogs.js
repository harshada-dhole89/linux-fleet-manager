const CommandLog = require("../models/commandLogModel.js");

async function createLog(nodeId, command, status, output, executedBy) {

    const log = await CommandLog.create({
        nodeId: nodeId,
        command: command,
        status: status,
        output: output,
        executedBy: executedBy
    });

    return log;
}

module.exports = { createLog };