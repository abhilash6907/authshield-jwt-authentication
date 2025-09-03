const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
{
   user_id:{
   type:mongoose.Schema.Types.ObjectId,
   require:true,
   ref:'User',
   },
   otp:{
   type:Number,
   require:true
},

timestamp:{
   type:Date,
   default:Date.now,
   require:true,
   get: (timestamp)=> timestamp.getTime(),
   set:(timestamp)=> new Date(timestamp),
},

})
module.exports= mongoose.model("Otp", otpSchema)