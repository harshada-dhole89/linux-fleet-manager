const express = require("express");
const router = express.Router();

const { isCommandAllowed } = require("../utils/commandAllowlist.js");
const Node = require("../models/nodeModel.js");
const { executeCommand } = require("../services/sshService");
const { createLog } = require("../utils/commandLogs.js");
const CommandLog = require("../models/commandLogModel.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const adminMiddleware = require("../middleware/adminMiddleware.js");
const mongoose = require("mongoose");


router.post(
    "/api/nodes/:id/command",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        const command = req.body.command;
        const nodeId = req.params.id;


        if (
            typeof command !== "string" ||
            command.trim().length === 0
        ) {
            return res.status(400).json({
                message: "Command is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(nodeId)) {
            return res.status(400).json({
                message: "Invalid node ID"
            });
        }
        // Find node from MongoDB
        const node = await Node.findById(nodeId);

        if (!node) {
            return res.status(404).send("Node not found");
        }

        // Check command allowlist
        if (!isCommandAllowed(command)) {
            await createLog(
                node._id,
                command,
                "rejected",
                "Command not allowed",
                String(req.user.userId)
            );

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
                String(req.user.userId)
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
                String(req.user.userId)
            );

            console.log("Command log:", log);

            res.status(500).send(error.message);
        }
    });


router.get(
    "/api/nodes/:id/commands",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const nodeId = req.params.id;

            const node = await Node.findById(nodeId);

            if (!node) {
                return res.status(404).send("Node not found");
            }

            const logs = await CommandLog.find({
                nodeId: node._id
            }).sort({ executedAt: -1 });

            return res.json(logs);

        } catch (error) {
            console.error("Command history error:", error.message);
            return res.status(500).send("Internal server error");
        }
    }
);


module.exports = router;