const Node = require("../models/nodeModel.js");


async function checkDatabaseNodes() {

    const nodes = await Node.find();

    for (const node of nodes) {

        const endpoint =
            node.monitoringType === "node_exporter"
                ? "/metrics"
                : "/heartbeat";

        const url = `http://${node.ip_address}:${node.port}${endpoint}`;

        const heartbeatNode = {
            id: node._id,
            url: url,
            missedHeartbeats: node.missedHeartbeats,
            status: node.status,
            unreachableSince: node.unreachableSince
        };

        const success = await checkNode(heartbeatNode);

        if (success) {

            await Node.findByIdAndUpdate(
                node._id,
                {
                    status: "online",
                    missedHeartbeats: 0,
                    unreachableSince: null,
                    last_heartbeat_at: new Date()
                }
            );

            console.log("MongoDB status updated:", node.hostname);

        } else {

            await Node.findByIdAndUpdate(
                node._id,
                {
                    status: heartbeatNode.status,
                    missedHeartbeats: heartbeatNode.missedHeartbeats,
                    unreachableSince: heartbeatNode.unreachableSince
                }
            );

            console.log(
                "MongoDB failure state updated:",
                heartbeatNode.status,
                heartbeatNode.missedHeartbeats
            );
        }
    }
}


async function checkNode(node) {

    console.log("Checking node:", node.id, node.url);

    let success = false;
    let delay = 1000;

    for (let attempt = 1; attempt <= 3; attempt++) {

        try {

            const controller = new AbortController();

            const timeout = setTimeout(() => {
                controller.abort();
            }, 5000);

            const response = await fetch(node.url, {
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            node.missedHeartbeats = 0;
            node.status = "online";

            console.log("Node status:", node.status);

            success = true;
            break;

        } catch (error) {

            console.log(
                "Node error:",
                node.id,
                error.message
            );

            if (attempt < 3) {

                await new Promise(resolve =>
                    setTimeout(resolve, delay)
                );

                delay = delay * 2;
            }
        }
    }


    if (!success) {
        node.missedHeartbeats++;
    }


    console.log(
        "Missed heartbeats:",
        node.missedHeartbeats
    );


    if (node.missedHeartbeats >= 3) {

        node.status = "unreachable";

        if (!node.unreachableSince) {
            node.unreachableSince = new Date();
        }

        console.log("Node status: unreachable");

        const elapsedTime =
            new Date() - node.unreachableSince;

        if (elapsedTime >= 300000) {
            node.status = "offline";

            console.log("Node status: offline");
        }
    }

    return success;
}


async function startMonitoring() {

    while (true) {

        await checkDatabaseNodes();

        await new Promise(resolve =>
            setTimeout(resolve, 10000)
        );
    }
}


startMonitoring();


module.exports = {
    checkNode
};