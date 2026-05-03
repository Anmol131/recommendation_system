#!/usr/bin/env node
/**
 * Admin Account Creation Script
 * Usage: node backend/scripts/createAdmin.js
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const createAdmin = async () => {
  try {
    console.log('🔐 Admin Account Creation Script');
    console.log('================================\n');
    
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    
    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log(`ℹ️  Admin account already exists: ${adminEmail}`);
        console.log(`   Email: ${existingAdmin.email}`);
        console.log(`   Role: ${existingAdmin.role}`);
        console.log(`   Verified: ${existingAdmin.isVerified}`);
      } else {
        console.log(`⚠️  User exists but is not an admin: ${adminEmail}`);
        console.log('   Converting to admin...');
        existingAdmin.role = 'admin';
        existingAdmin.isVerified = true;
        await existingAdmin.save();
        console.log('✅ User converted to admin successfully\n');
      }
    } else {
      console.log(`Creating admin account...`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}\n`);

      const newAdmin = await User.create({
        name: 'Administrator',
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        role: 'admin',
        isVerified: true,
        avatar: 'avatar-1',
        bio: 'System Administrator',
        preferences: {},
        history: []
      });

      console.log('✅ Admin account created successfully!\n');
      console.log('Admin Details:');
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Role: ${newAdmin.role}`);
      console.log(`   ID: ${newAdmin._id}\n`);
    }

    console.log('📝 Next steps:');
    console.log(`   1. Go to http://localhost:3000/admin/login`);
    console.log(`   2. Use email: ${adminEmail}`);
    console.log(`   3. Use password: ${adminPassword}`);
    console.log(`   4. Change password after first login\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin account:');
    console.error(error.message);
    process.exit(1);
  }
};

createAdmin();
