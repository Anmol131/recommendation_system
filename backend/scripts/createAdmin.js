#!/usr/bin/env node

/**
 * Admin Account Creation Script
 * Usage:
 *   node backend/scripts/createAdmin.js
 *
 * Required backend/.env values:
 *   ADMIN_EMAIL=your_admin_email@example.com
 *   ADMIN_PASSWORD=your_secure_password
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const createAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env');
    }

    if (adminPassword.length < 8) {
      throw new Error('ADMIN_PASSWORD must be at least 8 characters long');
    }

    await connectDB();

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log(`Admin account already exists: ${existingAdmin.email}`);
      } else {
        existingAdmin.role = 'admin';
        existingAdmin.isVerified = true;
        await existingAdmin.save();

        console.log(`Existing user converted to admin: ${existingAdmin.email}`);
      }
    } else {
      const newAdmin = await User.create({
        name: 'Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isVerified: true,
        avatar: 'avatar-1',
        bio: 'System Administrator',
        preferences: {},
        history: []
      });

      console.log('Admin account created successfully.');
      console.log(`Email: ${newAdmin.email}`);
      console.log(`Role: ${newAdmin.role}`);
    }

    console.log(`Admin login page: ${frontendUrl}/admin/login`);
  } catch (error) {
    console.error('Failed to create admin account.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

createAdmin();