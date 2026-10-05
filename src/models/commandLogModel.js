const mongoose = require("mongoose");

const commandLogSchema = new mongoose.Schema({
    nodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Node",
        required: true
    },

    command: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        required: true
    },

    output: {
        type: String
    },

    executedBy: {
        type: String,
        required: true
    },

    executedAt: {
        type: Date,
        default: Date.now
    }
});

const CommandLog = mongoose.model("CommandLog", commandLogSchema);

module.exports = CommandLog;