const { check } = require("express-validator");

exports.registerValidator = [
  check('name', 'Name is required').not().isEmpty(),

  check('email', 'Please include a valid email')
    .isEmail()
    .normalizeEmail({
      gmail_remove_dots: true
    }),

  check('mobile', 'Mobile No. should contain exactly 10 digits')
    .isLength({ min: 10, max: 10 })
    .isNumeric(),

  check('password','Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, and one number').isStrongPassword({
   minLength:6,
   minUppercase:1,
   minLowercase:1,
   minNumbers:1,
   minSymbols:1
  }),
   
  check('image').custom((value,{req})=>{
   if(req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/png'){
         return true;
   }
   else{
      return false;
   }
  }).withMessage("please upload an image Jpeg, PNG")

];


exports.sendMailVerificationValidator=[
  check('email', 'Please include a valid email')
    .isEmail()
    .normalizeEmail({
      gmail_remove_dots: true
    }),

]


exports.passwordResetValidator=[
  check('email', 'Please include a valid email')
    .isEmail()
    .normalizeEmail({
      gmail_remove_dots: true
    }),

]


exports.loginValidator=[
  check('email', 'Please include a valid email')
    .isEmail()
    .normalizeEmail({
      gmail_remove_dots: true
    }),
    check('password','password is required').not().isEmpty(),

]

exports.updateProfileValidator=[
  check('name', 'Name is required').not().isEmpty(),
  check('mobile', 'Mobile No. should contain exactly 10 digits')
    .isLength({ min: 10, max: 10 })
    .isNumeric(),

]


