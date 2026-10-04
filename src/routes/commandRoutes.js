const express = require("express");
const router = express.Router();
const { isCommandAllowed } = require("../utils/commandAllowlist.js");
const { node1, node2 } = require("../services/heartbeatService.js");
const { executeCommand } = require("../services/sshService");
const { createLog } = require("../utils/commandLogs.js");
const CommandLog = require("../models/commandLogModel.js");

router.post("/api/nodes/:id/command", async (req, res) => {
    const command = req.body.command;

    const nodeId = req.params.id;

    let node;

    if (nodeId == 1) {
        node = node1;
    } else if (nodeId == 2) {
        node = node2;
    } else {
        return res.status(404).send("Node not found");
    }

    if (!isCommandAllowed(command)) {
        return res.status(403).send("Command not allowed");
    }
    if (node.status !== "online") {
        return res.status(503).send("Node is not available");
    }
    try {
        const output = await executeCommand(command);

        const log = await createLog(
            node.id,
            command,
            "success",
            output,
            "admin"
        );

        console.log("Command log:", log);

        res.send(output);
    } catch (error) {
         const log = createLog(
            node.id,
            command,
            "failed",
            error.message,
            "admin"
        );
        console.log(" command log:", log);
        res.status(500).send(error.message);
    }

});
router.get("/api/nodes/:id/commands", async (req, res) => {

    const nodeId = Number(req.params.id);

    const logs = await CommandLog.find({ nodeId: nodeId });

    res.json(logs);
});
module.exports = router;
