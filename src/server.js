const express= require("express"); //Express library ko project me import kiya
const app=express();  //Express application create ki
const healthRoutes=require("./routes/healthRoutes.js");
const checknode=require("./services/heartbeatService.js");
const commandRoutes = require("./routes/commandRoutes.js");
app.use(express.json());

const port=4000;



app.use("/",healthRoutes);
app.use("/", commandRoutes);

app.listen(port,()=>{
    console.log(`linux fleet manager is listening on port ${port}`);
})


