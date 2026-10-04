const express = require("express");
const router = express.Router();
const { isCommandAllowed } = require("../utils/commandAllowlist.js");
const { node1, node2, checkNode } = require("../services/heartbeatService.js");
const { exec } = require("child_process");

router.post("/api/nodes/:id/command", (req, res) => {
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
    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send("Command execution failed");
        }

        if (stderr) {
            return res.status(500).send(stderr);
        }

        res.send(stdout);
    });
});
module.exports = router;
