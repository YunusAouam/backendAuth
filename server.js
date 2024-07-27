require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const db = require("./database/connect");
const cors = require('cors');
// const axios = require('axios');
const app = express();
app.use(express.json());
app.use(
    cors({
        origin:"*",
        credentials: true,
        allowedHeaders: '*'
    })
);

app.use(helmet());
const port = process.env.PORT || 4001;


app.use('/auth', require('./routes/auth'));

app.listen(port, console.log(`server auth is running on http://localhost:${port}`));