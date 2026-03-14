const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL)
    .then(async () => {
        console.log('Connected!');
        const admin = mongoose.connection.db.admin();
        const { databases } = await admin.listDatabases();
        console.log('\nDatabases:');
        databases.forEach(db => console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024).toFixed(2)} KB)`));
        
        console.log('\nCollections in current database:');
        const collections = await mongoose.connection.db.listCollections().toArray();
        collections.forEach(col => console.log(`  - ${col.name}`));
        
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
