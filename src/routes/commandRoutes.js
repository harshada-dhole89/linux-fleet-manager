const express = require("express");
const router = express.Router();
const { isCommandAllowed } = require("../utils/commandAllowlist.js");
const { node1, node2} = require("../services/heartbeatService.js");
const { executeCommand } = require("../services/sshService");

router.post("/api/nodes/:id/command", async(req, res) => {
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
        res.send(output);
    } catch (error) {
        console.log("SSH command error:", error);
        res.status(500).send(error.message);
    }
    
});
module.exports = router;
