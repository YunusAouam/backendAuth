const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser:true });
const db = mongoose.connection;
db.once('open',()=>{console.log("auth mongodb connected...")});
db.on('error',(error)=>console.log("auth mongodb is not connected!"+error));

module.exports = db;