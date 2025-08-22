const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const mailer = require("../helpers/mailer");
const mongoose = require("mongoose");

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

    //  Corrected verification link
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

    //  1. Check if ID exists
    if (!userId) {
      return res.render("404");
    }

    //  2. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.render("mail-verification", { message: "Invalid verification link!" });
    }

    //  3. Find user
    const userData = await User.findOne({ _id: userId });

    if (!userData) {
      return res.render("mail-verification", { message: "User not Found!" });
    }

    if (userData.is_verified === 1) {
      return res.render("mail-verification", { message: "Email already verified!" });
    }

    await User.updateOne({ _id: userId }, { $set: { is_verified: 1 } });

    return res.render("mail-verification", { message: "Email verified successfully!" });
  } catch (error) {
    console.log(error.message);
    return res.render("mail-verification", { message: "Error: " + error.message });
  }
};

module.exports = {
  userRegister,
  mailVerification,
};






