const express= require("express"); //Express library ko project me import kiya
const app=express();  //Express application create ki
const healthRoutes=require("./routes/healthRoutes.js");
const checknode=require("./services/heartbeatService.js");
const commandRoutes = require("./routes/commandRoutes.js");
const { connectDB } = require("./config/db.js");
const nodeRoutes = require("./routes/nodeRoutes.js");
app.use(express.json());

const port=4000;
connectDB();


app.use("/",healthRoutes);
app.use("/", commandRoutes);
app.use("/", nodeRoutes);


app.listen(port,()=>{
    console.log(`linux fleet manager is listening on port ${port}`);
})


