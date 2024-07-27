// const User = require('../models/User');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const Token = require('../models/Token');
const sendMail = require('../utils/sendEmail');
const crypto = require('crypto');
const User = require('../Models/User');

const signUpValidate = (request) => {
    const schema = Joi.object({
        fullname:Joi.string().min(3).max(255).required(),
        email:Joi.string().min(3).max(255).required().email(),
        password: Joi.alternatives().conditional('isGoogleAccount', {
            is: true,
            then: Joi.optional(),
            otherwise: Joi.string().min(8).required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$')).messages({
                'string.pattern.base': '"password" must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character.'
            })
        }),
        isGoogleAccount: Joi.boolean().required(),
        avatarGoogle: Joi.optional()
    });
    return schema.validate(request);
};

const loginValidate = (request) => {
    const schema = Joi.object({
        email:Joi.string().min(3).max(255).required().email(),
        password:Joi.string().min(8).required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$')).message('"{#label}" must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character.')
    });
    return schema.validate(request);
};

const resetPasswordValidate = (request) => {
    const schema = Joi.object({
        password:Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$')).message('"{#label}" must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character.'),
        confirmPassword:Joi.string().required().message('{#label} not allowed to be empty')
    });
    return schema.validate(request);
}
const EmailValidate = (request) => {
    const schema = Joi.object({
        email:Joi.string().required().email().message('{#label} incorrect or invalid!')
    });
    return schema.validate(request);
}

exports.signin = async (req, res) => {
    const {email, password, isGoogleAccount } = req.body;
    const { error } = EmailValidate({email});
    if(error){
        return res.status(400).json({message: error.details[0].message.replaceAll("\"",'')});
    }
    try {
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({message: 'Invalid email or password'});
        const isValid = await bcrypt.compare(password, user.password);
        if(!isValid && !isGoogleAccount) return res.status(400).json({message: 'Invalid email or password'});
        if(!user.verified){
            let tok = await Token.findOne({userId: user._id});
            if(!tok){
                tok = await new Token({
                    userId:user._id,
                    token:crypto.randomBytes(32).toString("hex")
                }).save();
            }
            const url = `${process.env.BASE_URL}/users/${user._id}/verify/${tok.token}`;
            await sendMail(user.email, "Email verification", url);
            return res.status(400).json({message:"Please verify your email before sign in !"});
        }else{
            const payload = {_id: user._id,avatar:user.avatar, email: user.email, role: user.role, fullname:user.fullname};
            const token = jwt.sign(payload, process.env.JWT_SECRET,{
                expiresIn:86400
            });
            return res.status(200).json({token});
        }
    } catch (error) {
        return res.status(400).json({message: error.message});
    }
}

exports.signup =  async (req, res) => {
    const {fullname, email, password, isGoogleAccount, avatarGoogle } = req.body;
    const { error } = signUpValidate(req.body);
    if(error){
        return res.status(400).json({message: error.details[0].message.replaceAll("\"",'')});
    }
    try {
        const hashed = await bcrypt.hash(password, 10);
        let user = await User.findOne({email});
        if(user && !isGoogleAccount) return res.status(400).json({message:"Email already existe !"});
        else if (user && isGoogleAccount) return res.status(200).json({message:"ok"});
        user = await User.create({fullname, email, avatar: avatarGoogle ? avatarGoogle : '', password:hashed, verified:isGoogleAccount ? true : false});
        const token = await new Token({
            userId:user._id,
            token:crypto.randomBytes(32).toString("hex")
        }).save();

        if(!isGoogleAccount){
            const url = `${process.env.BASE_URL}/users/${user._id}/verify/${token.token}`;
            await sendMail(user.email, "Email verification", url);
            res.status(200).json({message:"An email sent to your account please verify !"});
        }else{
            res.status(200).json({message:"You're signed up"});
        }
    } catch (error) {
        res.status(400).json({message: error.message});
    }
}

exports.verify = async (req, res) => {
    try {
        const user = await User.findOne({_id:req.params.id});
        if(!user) return res.status(400).json({message: 'Invalid link'});
        const token = await Token.findOne({token:req.params.token, userId:user._id});
        if(!token) return res.status(400).json({message: 'Invalid link'});
        user.verified = true;
        await user.save();
        setTimeout( async () => {
            await Token.deleteOne({token:token.token, userId:token.userId});
        }, 500);
        res.status(200).json({message:token});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

exports.resetPassword = async (req, res) => {
    const { email } = req.body;
    const { error } = EmailValidate(req.body);
    if(error){
        return res.status(400).json({message: error.details[0].message});
    }
    try {
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({message: 'User not found'});
        if(!user.verified) {
            const token = await new Token({
                userId:user._id,
                token:crypto.randomBytes(32).toString("hex")
            }).save();
            const url = `${process.env.BASE_URL}/users/${user._id}/verify/${token.token}`;
            await sendMail(user.email, "Email verification", url);
            return res.status(400).json({message: 'that account not verified !'});
        } 
        const token = await new Token({
            userId:user._id,
            token:crypto.randomBytes(32).toString("hex")
        }).save();
        const url = `${process.env.BASE_URL}/users/${user._id}/reset/${token.token}`;
        await sendMail(user.email, "Reset password", url);
        res.status(200).json({message:"An email sent to your account please verify !"});
    }catch(error){
        res.status(500).json({message:error.message});
    }    
}

exports.reset_password_verify =  async (req, res)=> {
    const {token, userId} = req.params;
    try {
        const tokenDoc = await Token.findOne({token, userId});
        if(!tokenDoc) return res.status(400).json({message: 'Invalid link'});
        const user = await User.findOne({_id:tokenDoc.userId});
        if(!user) return res.status(400).json({message: 'Invalid User Id'});
        res.status(200).json({message:"Password changed successfully"});
    }catch(error){
        res.status(500).json({message:error.message});
    }
}

exports.changePassword = async (req, res) => {
    const { newPassword, userId , token} = req.body;
    try {
        // const { error } = resetPasswordValidate(req.body);
        // if(error){
        //     return res.status(400).json({error: error.details[0].message});
        // }
        const tokenDoc = await Token.findOne({token, userId});
        if(!tokenDoc) return res.status(400).json({message: 'Invalid link'});
        const user = await User.findOne({_id:tokenDoc.userId});
        if(!user) return res.status(400).json({message: 'Invalid User Id'});
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        setTimeout( async () => {
            await Token.deleteOne({token:tokenDoc.token});
        }, 500);
        res.status(200).json({message:"Your Password has been changed successfully"});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}