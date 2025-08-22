const express = require("express");
const router = express.Router(); // ✅ Use Router instead of express()

router.use(express.json());

const Path = require("path");
const multer = require("multer");

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
const {registerValidator, sendMailVerificationvalidator} =require('../helpers/validation');

router.post("/register", upload.single("image"), registerValidator, userController.userRegister); 

// router.post('/send-mail-verifiction',sendMailVerificationvalidator)

module.exports = router;
  