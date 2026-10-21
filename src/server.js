require("dotenv").config();
//libraries import
const express= require("express"); //Express library 
const cors = require("cors");
const app=express();  //Express application 
//project modules
const healthRoutes=require("./routes/healthRoutes.js");
const checknode=require("./services/heartbeatService.js");
const commandRoutes = require("./routes/commandRoutes.js");
const { connectDB } = require("./config/db.js");
const nodeRoutes = require("./routes/nodeRoutes.js");
const authRoutes = require("./routes/authRoutes.js");
//middleware setup
app.use(express.json()); //json body parse ex->req.body.email
app.use(cors({
    origin: "http://localhost:5173"   //cross origin policy to allow frontend logic
}));

const port=4000;
connectDB();

//register routes
app.use("/",healthRoutes);
app.use("/", commandRoutes);
app.use("/", nodeRoutes);
app.use("/", authRoutes);


app.listen(port,()=>{
    console.log(`linux fleet manager is listening on port ${port}`);
})


