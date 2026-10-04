const allowedCommands = [
    "uptime",
    "df -h",
    "free -m"
];


function isCommandAllowed(command) {
    // yahan check karna hai ki command allowedCommands mein hai ya nahi
    if(allowedCommands.includes(command)){
        return true;
    }
    else{
        return false;
    }
}
module.exports ={isCommandAllowed};