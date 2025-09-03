const express = require("express");
const router = express.Router(); 

router.use(express.json());

const Path = require("path");
const multer = require("multer");

const auth = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
   if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
            cb(null, Path.join(__dirname, "../public/images"));
 
   }
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const fileFilter = (req,file,cb)=>{
   if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
         cb(null,true); 
   }
   else{
      cb(null,false)
   }
}

const upload = multer({
   storage: storage,
   fileFilter:fileFilter });

const userController = require("../controllers/userController");
const {registerValidator, sendMailVerificationValidator, passwordResetValidator,loginValidator,updateProfileValidator,OtpMailValidation} =require('../helpers/validation');

router.post("/register", upload.single("image"), registerValidator, userController.userRegister); 

router.post('/send-mail-verification', sendMailVerificationValidator, userController.sendMailVerification);

router.post('/forgot-password',passwordResetValidator ,userController.forgotPassword )

router.post('/login',loginValidator,userController.loginUser);

//authenticated  
router.get('/profile',auth,userController.userProfile);
router.post('/update-profile',auth,upload.single("image"),updateProfileValidator ,userController.updateProfile);
router.get('/refresh-token', auth, userController.refreshToken)
router.get('/logout', auth, userController.logout)


// otp  verification routes
router.post('/send-otp',OtpMailValidation,userController.sendOtp);






module.exports = router;
   