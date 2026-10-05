const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema({
    hostname: {
        type: String,
        required: true
    },

    ip_address: {
        type: String,
        required: true
    },

    port: {
        type: Number,
        required: true
    },

    ssh_user: {
        type: String,
        required: true
    },

    ssh_key_ref: {
        type: String,
        required: true
    },

    monitoringType: {
        type: String,
        enum: ["heartbeat", "node_exporter"],
        default: "heartbeat"
    },

    status: {
        type: String,
        enum: ["online", "offline", "unreachable", "onboarding"],
        default: "onboarding"
    },

    last_heartbeat_at: {
        type: Date
    },

    onboarded_at: {
        type: Date
    },

    missedHeartbeats: {
        type: Number,
        default: 0
    },

    unreachableSince: {
        type: Date
    }
});

const Node = mongoose.model("Node", nodeSchema);

module.exports = Node;