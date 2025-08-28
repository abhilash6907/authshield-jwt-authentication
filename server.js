require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const port = process.env.SERVER_PORT || 3000;


mongoose.connect(
  "mongodb+srv://abhilashtalwar77:gyTvhwzlVailuqM9@nodejwtauth.kyp1cqo.mongodb.net/?retryWrites=true&w=majority&appName=NodeJWTAuth"
)
.then(() => {
  console.log("connected");
})
.catch((err) => {
  console.error("connection failed!", err);
});

app.set('view engine', 'ejs');
app.set('views', './views')

const userRoute=require('./routes/userRoute');
const authRoute=require('./routes/authRoute');

app.use('/', authRoute)
app.use('/api', userRoute);

app.get("/",function(req,res){
  res.send('this is abhilash');
})

app.listen(port, function() {
  console.log('server Listen on port ' + port);
});

