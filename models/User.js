
const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    fullname:{
        required:true,
        type:String,
        trim:true
    },
    email:{
        required:true,
        type:String,
        trim:true,
        maxLength:255
    },
    password:{
        required:true,
        type:String,
        trim:true,
        minLength:8
    },
    mobile:{
        type:String,
        trim:true,
        default:''
    },
    avatar:{
        type:String,
        trim:true,
        default:''
    },
    role:{
        type:Array,
        default:['user']
    },
    verified:{
        type:Boolean,
        default:false
    }

}, { timestamps : true });

const User = mongoose.model('User', userSchema);

module.exports = User;