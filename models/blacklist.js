const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema(

   {
      token:{
         type:String,
         require: true
      }
   },
   { timestamps: true },

)

module.exports= mongoose.model("Blacklist", blacklistSchema)