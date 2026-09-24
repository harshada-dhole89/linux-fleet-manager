
const node1 = {
    id: 1,
    url: "http://localhost:3001",
    missedHeartbeats: 0,
    status: "online"
};
const node2 = {
    id: 2,
    url: "http://localhost:3002",
    missedHeartbeats: 0,
    status: "online"
};
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
            const response = await fetch(node.url+"/heartbeat", { signal: controller.signal });
            clearTimeout(timeout);
            node.missedHeartbeats = 0;
            node.status = "online";
            const data = await response.text();

            console.log("Node response:", data);
            console.log("Node status:", node.status);
            success = true;
            break;
        } catch (error) {
            console.log("Node error:", node.id, error.message);
            if(attempt<3){
            await new Promise(resolve => setTimeout(resolve, delay));
            delay=delay*2;}
            

        }
    }
    if (!success) {
        node.missedHeartbeats++;
    }
    console.log("Missed heartbeats:", node.missedHeartbeats);
    if (node.missedHeartbeats >= 3) {
        node.status = "unreachable";
        console.log("Node status: unreachable");

    }
}
setInterval(() => {
    checkNode(node1);
    checkNode(node2);
    
}, 10000);
module.exports = checkNode;