const User = require("../models/userModel");
const Blacklist = require("../models/blacklist");
const Otp = require("../models/otp")
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const mailer = require("../helpers/mailer");
const mongoose = require("mongoose");
const Randomstring = require("randomstring");
const jwt = require("jsonwebtoken");

const path = require("path");
const { deleteFile } = require("../helpers/deleteFile");

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

const updatePassword = async (req, res) => {
  try {
    const { user_id, password, c_password } = req.body;

    const resetData = await PasswordReset.findOne({ user_id });

    if (password != c_password) {
      return res.render("reset-password", {
        resetData,
        error: "confirm Password not matching",
      });
    }
    const hashedpassword = await bcrypt.hash(c_password, 10);

    await User.findByIdAndUpdate(
      { _id: user_id },
      {
        $set: {
          password: hashedpassword,
        },
      }
    );

    await PasswordReset.deleteMany({ user_id });
    return res.redirect("/reset-success");
  } catch (error) {
    return res.render("404");
  }
};

const resetSuccess = (req, res) => {
  try {
    return res.render("reset-success");
  } catch (error) {
    console.error("Error rendering reset success page:", error);
    return res.status(500).send("Internal Server Error");
  }
};

const generateAccessToken = (user) => {
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "2h",
  });
  return token;
};

const generateRefreshToken = (user) => {
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "4h",
  });
  return token;
};

const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation Errors",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "Email and Password is Incorrect",
      });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        msg: "Email and Password is Incorrect",
      });
    }

    if (userData.is_verified == 0) {
      return res.status(400).json({
        success: false,
        msg: "Please verify ur Email",
      });
    }

    const accessToken = await generateAccessToken({ user: userData });
    const reFreshToken = await generateRefreshToken({ user: userData });
    return res.status(200).json({
      success: true,
      msg: "Login Successfully!",
      user: userData,
      accessToken: accessToken,
      reFreshToken: reFreshToken,
      tokenType: "bearer",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "!",
    });
  }
};

const userProfile = async (req, res) => {
  try {
    const userData = req.user.user;

    return res.status(200).json({
      success: true,
      msg: "user profile data!",
      data: userData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { name, mobile } = req.body;

    const data = {
      name,
      mobile,
    };

    const user_id = req.user.user._id;

    if (req.file !== undefined) {
      data.image = "images/" + req.file.filename;

      const oldUser = await User.findOne({ _id: user_id });

      const oldFilePath = path.join(__dirname, "../public/" + oldUser.image);

      deleteFile(oldFilePath);
    }

    const userData = await User.findByIdAndUpdate(
      { _id: user_id },
      {
        $set: data,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      msg: "User updated successfully",
      user: userData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const userId = req.user.user._id;

    const userData = await User.findOne({ _id: userId });

    const accessToken = await generateAccessToken({ user: userData });
    const refreshToken = await generateRefreshToken({ user: userData });

    return res.status(200).json({
      success: true,
      msg: "Token Refreshed",
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Invalid token",
    });
  }
};

const logout = async (req, res) => {
  try {
const token = req.body?.token || req.query?.token || req.headers['authorization'];
const bearer = token.split(' ');
const bearerToken = bearer[1];

const newBlacklist = new Blacklist({
  token: bearerToken
})

await newBlacklist.save();

res.setHeader('Clear-Site-Data', '"cookies","storage"');
 return res.status(200).json({
      success: true,
      msg: "You Are logged out!",
    });


  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Invalid token",
    });
  }
};

const generateRandom4digit = () => {
  return Math.floor(1000 + Math.random() * 9000);
};



const sendOtp = async (req, res) => {
  try {
    // validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    // check if user exists
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "Email doesn't exist!",
      });
    }

    // check if already verified
    if (userData.is_verified === 1) {
      return res.status(400).json({
        success: false,
        msg: `${userData.email} is already verified.`,
      });
    }

    // generate and save otp
    const g_otp = generateRandom4digit();

    // clear previous OTPs for the same user (optional but better)
    await Otp.deleteMany({ user_id: userData._id });

    const enter_otp = new Otp({
      user_id: userData._id,
      otp: g_otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // expires in 5 mins
    });

    await enter_otp.save();

    // prepare email
    const msg = `
      <p>Hi <b>${userData.name}</b>,</p>
      <p>Your OTP for verification is:</p>
      <h2>${g_otp}</h2>
      <p>This OTP is valid for 5 minutes.</p>
    `;

    // send email
    await mailer.sendMail(userData.email, "OTP Verification", msg);

    return res.status(200).json({
      success: true,
      msg: "OTP has been sent to your mail, please check.",
    });
  } catch (error) {
    console.error("sendOtp Error:", error); // <-- this shows real problem
    return res.status(500).json({
      success: false,
      msg: "Something went wrong. Please try again later.",
    });
  }
};

// const sendOtp= async(req,res)=>{
//   try {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         msg: "Errors",
//         errors: errors.array(),
//       });
//     }
//     const { email } = req.body;

//     const userData = await User.findOne({ email });

//     if (!userData) {
//       return res.status(400).json({
//         success: false,
//         msg: "Email doesn't exists!",
//       });
//     }

//     if (userData.is_verified == 1)
//       return res.status(400).json({
//         success: false,
//         msg: userData.email + " Email is already exists!",
//       });

//     const g_otp= await generateRandom4digit();

//     const enter_otp = new Otp({
//       user_id:userData._id,
//       otp:g_otp
//     })

//     await enter_otp.save();

//     const msg = '<p> Hii <b>'+ userData.name+' </br> <h4>'+g_otp+'</h4> </p>';

//     mailer.sendMail(userData.email, "Otp Verification", msg);

//     return res.status(200).json({
//       success: true,
//       msg: "Otp has been  sent to your mail, please check.",
//     });


//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       msg: "Invalid token",
//     });
// }
// }

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
  updateProfile,
  refreshToken,
  logout,
  sendOtp
};
