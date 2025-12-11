    module.exports=async(req,res,next)=>{

    if(!req.user ) return res.status(401).json({"message":"Unauthorized"});

    if(req.user.role!='owner'){
        return res.status(403).json({"message":"Forbidden: Owner access only"});
    }
    next();
}