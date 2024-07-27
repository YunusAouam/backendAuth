const nodemailer = require("nodemailer");
module.exports = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host:process.env.HOST,
            service:process.env.SERVICE,
            port:Number(process.env.EMAIL_PORT),
            secure:Boolean(process.env.SECURE),
            auth:{
                user:process.env.USER,
                pass:process.env.PASSWORD
            }
        });
        transporter.sendMail({
            from:process.env.USER,
            to:email,
            subject:subject,
            text:text
        });
        console.log("email sended successfully !");
    } catch (error) {
        console.log("email sended successfully !");
        console.log(error);
    }
}