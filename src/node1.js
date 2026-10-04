const express=require("express");
const app=express();

const port=3001;
app.use("/heartbeat",(req,res)=>{
    res.send("alive");
})
app.listen(port,()=>{
    console.log(`node1 is rumming on ${port}`);
})