import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';

dotenv.config();

const dropSkuIndex = async () => {
    try {
        await connectDB();

        const collection = mongoose.connection.collection('users');

        // Check if index exists
        const indexes = await collection.indexes();
        const skuIndex = indexes.find(index => index.name === 'sku_1');

        if (skuIndex) {
            console.log('Found sku_1 index. Dropping...');
            await collection.dropIndex('sku_1');
            console.log('Successfully dropped sku_1 index.');
        } else {
            console.log('sku_1 index not found.');
        }

        process.exit();
    } catch (error) {
        // If error code 27 (IndexNotFound), ignore it
        if (error.code === 27) {
            console.log('Index not found (Error 27).');
        } else {
            console.error(`Error: ${error.message}`);
        }
        process.exit(1);
    }
};

dropSkuIndex();
