const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URL;
console.log('Connecting to:', uri);

mongoose.connect(uri)
    .then(() => {
        console.log('Connected!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
