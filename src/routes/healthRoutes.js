const express=require("express");
const router= express.Router();

router.get('/',(req,res)=>{
    res.send("linux fleet manager is running");
});

module.exports=router;