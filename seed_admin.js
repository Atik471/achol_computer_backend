import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import connectDB from './src/config/db.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@gmail.com';
        const adminPassword = 'password123';

        const userExists = await User.findOne({ email: adminEmail });

        if (userExists) {
            // Update role if exists but not admin
            if (userExists.role !== 'admin') {
                userExists.role = 'admin';
                await userExists.save();
                console.log('User exists. Updated role to admin.');
            } else {
                console.log('Admin user already exists.');
            }
        } else {
            const user = await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            });
            console.log(`Admin created successfully!`);
            console.log(`Email: ${user.email}`);
            console.log(`Password: ${adminPassword}`);
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
