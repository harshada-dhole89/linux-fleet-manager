const express= require("express"); //Express library ko project me import kiya
const app=express();  //Express application create ki
const healthRoutes=require("./routes/healthRoutes.js");
const checknode=require("./services/heartbeatService.js");

const port=3000;



app.use("/",healthRoutes);

app.listen(port,()=>{
    console.log(`linux fleet manager is listening on port ${port}`);
})


