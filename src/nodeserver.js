const express = require("express");
const nodes = express();

const port = 3001;

nodes.get("/heartbeat", (req, res) => {
    res.send("alive");
});

nodes.listen(port, () => {
    console.log(`Node server running on port ${port}`);
});

const nodeServer2 = express();
const port2 = 3002;

nodeServer2.get("/heartbeat", (req, res) => {
    res.send("alive");
});

nodeServer2.listen(port2, () => {
    console.log(`Node 2 server running on port ${port2}`);
});