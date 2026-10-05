const express = require("express");
const router = express.Router();
const Node = require("../models/nodeModel.js");


router.post("/api/nodes/onboard", async (req, res) => {
    try {
        const {
            hostname,
            ip_address,
            port,
            ssh_user,
            ssh_key_ref,
            monitoringType
        } = req.body;

        if (!hostname || !ip_address || !port || !ssh_user || !ssh_key_ref) {
            return res.status(400).send("All fields are required");
        }

        const node = await Node.create({
            hostname,
            ip_address,
            port,
            ssh_user,
            ssh_key_ref,
            monitoringType
        });

        res.status(201).json(node);

    } catch (error) {
        res.status(500).send("Server error");
    }
});

router.get("/api/nodes", async (req, res) => {
    const nodes = await Node.find();
    res.json(nodes);
});

router.get("/api/nodes/:id", async (req, res) => {
    try {
        const nodeId = req.params.id;

        const node = await Node.findById(nodeId);

        if (!node) {
            return res.status(404).send("Node not found");
        }

        res.json(node);

    } catch (error) {
        res.status(500).send("Server error");
    }
});

router.delete("/api/nodes/:id", async (req, res) => {
    const nodeId = req.params.id;
    const node = await Node.findById(nodeId);
    if (!node) {
        return res.status(404).send("Node not found");
    }
    await Node.findByIdAndDelete(nodeId);
    res.send("Node deleted successfully");
});
module.exports = router;