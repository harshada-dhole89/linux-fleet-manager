const express = require("express");
const router = express.Router();

const { isCommandAllowed } = require("../utils/commandAllowlist.js");
const Node = require("../models/nodeModel.js");
const { executeCommand } = require("../services/sshService");
const { createLog } = require("../utils/commandLogs.js");
const CommandLog = require("../models/commandLogModel.js");


router.post("/api/nodes/:id/command", async (req, res) => {

    const command = req.body.command;
    const nodeId = req.params.id;

    // Find node from MongoDB
    const node = await Node.findById(nodeId);

    if (!node) {
        return res.status(404).send("Node not found");
    }

    // Check command allowlist
    if (!isCommandAllowed(command)) {
        return res.status(403).send("Command not allowed");
    }

    // Node must be online
    if (node.status !== "online") {
        return res.status(503).send("Node is not available");
    }

    try {

        // Execute command through SSH
        const output = await executeCommand(node, command);

        // Save successful command in MongoDB
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

        // Save failed command in MongoDB
        const log = await createLog(
            node.id,
            command,
            "failed",
            error.message,
            "admin"
        );

        console.log("Command log:", log);

        res.status(500).send(error.message);
    }
});


router.get("/api/nodes/:id/commands", async (req, res) => {

    const nodeId = Number(req.params.id);

    const logs = await CommandLog.find({
        nodeId: nodeId
    });

    res.json(logs);
});


module.exports = router;