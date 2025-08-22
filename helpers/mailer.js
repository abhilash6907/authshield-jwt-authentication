
const nodemailer= require('nodemailer');

const Transporter =nodemailer.createTransport({
   host:process.env.SMTP_HOST,
   port:process.env.SMTP_PORT,
   secure:false,
   requireTLS:true,
   auth:{
      user:process.env.SMTP_MAIL,
      pass:process.env.SMTP_PASSWORD

   }
});

const sendMail = async(email, subject,content)=>{
try{

   var mailOption= {
      from:process.env.SMTP_MAIL,
      to:email,
      subject:subject,
      html:content
   }
   Transporter.sendMail(mailOption, (error, info) => {
   if (error) {
      console.log("Mail error:", error);
      return; 
   }
   console.log("Mail sent:", info.messageId);
});

}
catch(error){
console.log(error.message)
}
}

module.exports={
   sendMail
}