const express=require("express");
const router= express.Router();

router.get('/health',(req,res)=>{
    res.send("linux fleet manager is running");
});

module.exports=router;