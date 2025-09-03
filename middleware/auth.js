const jwt= require('jsonwebtoken');
const config = process.env
const Blacklist =require('../models/blacklist');
const blacklist = require('../models/blacklist');
const verifyToken= async(req,res, next)=>{

const token = req.body?.token || req.query?.token || req.headers['authorization'];

   if(!token){
   return res.status(403).json({
      success: false,
      msg: 'a token is required for authentication'
   })
}    


try {   
const bearer = token.split(' ');
const bearerToken = bearer[1];

const blacklistedtoken = await blacklist.findOne({token:bearerToken});

if(blacklistedtoken){
   return res.status(400).json({
      success: false,
      msg: 'this session has been expired, please try again!'
   })
}

const decodedData = jwt.verify(bearerToken, config.ACCESS_TOKEN_SECRET)
req.user = decodedData;

}
catch (error) {
    return res.status(401).json({
      success: false,
      msg: 'Invalid token'
   })
}
 return next();
}

module.exports= verifyToken;