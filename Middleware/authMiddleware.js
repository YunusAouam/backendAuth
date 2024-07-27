const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../Models/User");

const protect = asyncHandler(async (req, res, next) => {
  let token = "aazzzz";
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      try {
          token  = req.headers.authorization.split(" ")[1];
          //decodes token id
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.token = token;
          next();
      } catch (error) {
          res.status(400).send({message:error.message});
      }
  }

});

module.exports = { protect };
