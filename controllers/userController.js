const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const mailer = require("../helpers/mailer");
const mongoose = require("mongoose");
const Randomstring = require("randomstring");
const jwt = require('jsonwebtoken')

const PasswordReset = require("../models/passwordReset");
const { name } = require("ejs");

const userRegister = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation Errors",
        errors: errors.array(),
      });
    }

    const { name, email, mobile, password } = req.body;

    const isExists = await User.findOne({ email });
    if (isExists) {
      return res.status(400).json({
        success: false,
        msg: "Email Already Exists!",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const imagePath = req.file ? "images/" + req.file.filename : "";

    const user = new User({
      name,
      email,
      mobile,
      password: hashPassword,
      image: imagePath,
    });

    const userData = await user.save();

  
  const msg = `<p>Hello, ${name}, please <a href="http://localhost:3000/mail-verification?id=${userData._id}">Verify</a> your mail.</p>`;

    mailer.sendMail(email, "Mail Verification", msg);

    return res.status(200).json({
      success: true,
      msg: "Registered Successfully! Check your email for verification.",
      user: userData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const mailVerification = async (req, res) => {
  try {
    const userId = req.query.id;

    if (!userId) {
      return res.render("404");
    }


    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.render("mail-verification", {
        message: "Invalid verification link!",
      });
    }

    const userData = await User.findOne({ _id: userId });

    if (!userData) {
      return res.render("mail-verification", { message: "User not Found!" });
    }

    if (userData.is_verified === 1) {
      return res.render("mail-verification", {
        message: "Email already verified!",
      });
    }

    await User.updateOne({ _id: userId }, { $set: { is_verified: 1 } });

    return res.render("mail-verification", {
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.log(error.message);
    return res.render("mail-verification", {
      message: "Error: " + error.message,
    });
  }
};

const sendMailVerification = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }
    const { email } = req.body;

    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "Email doesn't exists!",
      });
    }

    if (userData.is_verified == 1)
      return res.status(400).json({
        success: false,
        msg: userData.email + " Email is already exists!",
      });
    const msg = `<p>Hello, ${userData.name}, please <a href="http://localhost:3000/mail-verification?id=${userData._id}">Verify</a> your mail.</p>`;

    mailer.sendMail(userData.email, "Mail Verification", msg);

    return res.status(200).json({
      success: true,
      msg: "Verification Link sent to your mail, please check.",
    });
  } catch (error) {
    return res.render("404").json({
      success: false,
      msg: "error.message",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }
    const { email } = req.body;

    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "Email doesn't exists!",
      });
    }

    const randomString = Randomstring.generate();
    const msg =
      "<p>Hii " +
      userData.name +
      ', please click <a href="http://localhost:3000/reset-password?token=' +
      randomString +
      '">here</a> to Reset your Password </p>';

    await PasswordReset.deleteMany({ user_id: userData._id });
    const passwordReset = new PasswordReset({
      user_id: userData._id,
      token: randomString,
    });
    await passwordReset.save();

    mailer.sendMail(userData.email, "Reset Password ", msg);

    return res.status(201).json({
      success: true,
      msg: "reset Password Link send to your mail, please check!",
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      msg: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    if (req.query.token == undefined) {
      return res.render("404");
    }

    const resetData = await PasswordReset.findOne({ token: req.query.token });

    if (!resetData) {
      return res.render("404");
    }
    return res.render("reset-password", { resetData });
  } catch (error) {
    return res.render("404");
  }
};


const updatePassword=async(req,res)=>{
 try {


  const{ user_id,password,c_password }= req.body;

  const resetData = await PasswordReset.findOne({user_id})
  
  if(password != c_password){
    return res.render('reset-password', {resetData, error: 'confirm Password not matching'})
  }
   const hashedpassword = await bcrypt.hash(c_password,10);

   await User.findByIdAndUpdate({_id: user_id},{
    $set:{
      password:hashedpassword
    }
   });

   await PasswordReset.deleteMany({ user_id });
   return res.redirect('/reset-success')
} catch (error) {
    return res.render("404");
}
}

const resetSuccess = (req, res) => {
  try {
    return res.render('reset-success'); 
  } catch (error) {
    console.error("Error rendering reset success page:", error);
    return res.status(500).send("Internal Server Error");
  }
};


const generateAccessToken = (user) => {
  // const payload = {
  //   id: user._id,
  //   email: user.email,
  // };
  // const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
  //   expiresIn: "1h", 
  // });

  // return token;

  const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"2h"})
  return token;
};



const loginUser= async(req,res)=>{
  try {
    const errors= validationResult(req);

if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation Errors",
        errors: errors.array(),
      });
    }

    const {email,password}= req.body;

    const userData= await User.findOne({email})

    if(!userData){
       return res.status(400).json({
        success: false,
        msg: "Email and Password is Incorrect",
      });
    }

    const passwordMatch= await bcrypt.compare(password,userData.password);

    if(!passwordMatch){
      return res.status(400).json({
        success: false,
        msg: "Email and Password is Incorrect",
      });
    }

    if(userData.is_verified == 0){
      return res.status(400).json({
        success: false,
        msg: "Please verify ur Email",
      });
    }

    const accessToken = await generateAccessToken({user:userData});

     return res.status(200).json({
        success: true,
        msg: "Login Successfully!",
        user:userData,
        accessToken: accessToken,
        tokenType:'bearer'
      });



  } catch (error) {
     return res.status(400).json({
        success: false,
        msg: "!",
      });
  }
}

const userProfile=async(req,res)=>{

try {

   const userData = req.user.user;

  return res.status(200).json({
    success: true,
    msg: 'user profile data!',
    data: userData
  })
  
} catch (error) {
   return res.status(400).json({
        success: false,
        msg: error.message
      });
}
}

const updateProfile = async (req,res)=>{

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }
  
    const{name,mobile}= req.body;

    const data={
      name,
      mobile
    }

    if(req.file !== undefined){
      data.image ='image/' + req.file.filename;
    }

   const userData= await User.findByIdAndUpdate({_id:req.user.user._id},{
    $set: data
   },{new:true})
    
   return res.status(200).json({
        success: true,
        msg: 'User updated successfully',
        user:userData
      });
  } catch (error) {
     return res.status(400).json({
        success: false,
        msg: error.message
      });
  }

}

module.exports = {
  userRegister,
  mailVerification,
  sendMailVerification,
  forgotPassword,
  resetPassword,
  updatePassword,
  resetSuccess,
  loginUser,
  userProfile,
  updateProfile
};