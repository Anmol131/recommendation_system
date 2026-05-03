# Admin Panel Setup Guide

## Overview
This admin panel has been integrated into your MERN stack recommendation platform. It provides complete management capabilities for content, search logs, and user analytics.

## Features

### 1. Admin Authentication
- JWT-based admin login
- Role-based access control (user vs admin)
- Secure token storage
- Admin logout functionality

### 2. Admin Dashboard
- Real-time statistics and metrics
- Total counts for: Movies, Books, Music, Games, Users, Content Items, Search Logs
- Quick action links to management features

### 3. Content Management
- View all content with filters and search
- Add new content items
- Edit existing content
- Delete content
- Support for all content types: movies, books, music, games

### 4. Search Logs Analytics
- View user search history
- Filter by type, date range
- Export search logs to CSV
- User engagement metrics

## Environment Variables Setup

### Backend (.env file)

Add these variables to your backend `.env` file:

```env
# Existing variables (keep these)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/recommendation_platform
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# NEW: Admin credentials (set to create default admin account)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

**Important:** 
- Change `ADMIN_PASSWORD` to a strong password in production
- Keep `JWT_SECRET` secure and long
- Never commit sensitive `.env` values to version control

## Creating the Default Admin Account

### Option 1: Automatic (on startup)
The system expects an admin user to exist. You need to create one manually using the database or API.

### Option 2: Via MongoDB (Recommended for setup)

```javascript
// Run this in MongoDB shell or MongoDB Compass
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to your database first
// Then in MongoDB:
db.users.insertOne({
  name: "Admin",
  email: "admin@example.com",
  password: bcrypt.hashSync("admin123", 10),
  role: "admin",
  isVerified: true,
  preferences: {},
  avatar: "avatar-1",
  bio: "",
  history: [],
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Option 3: Via Node Script

Create `backend/scripts/createAdmin.js`:

```javascript
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const createAdmin = async () => {
  try {
    await connectDB();
    
    const admin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (admin) {
      console.log('Admin already exists');
      process.exit(0);
    }
    
    const newAdmin = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
      isVerified: true,
    });
    
    console.log('Admin created:', newAdmin.email);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
```

Run with: `node backend/scripts/createAdmin.js`

## Accessing the Admin Panel

### Login
1. Go to: `http://localhost:5173/admin/login`
2. Enter admin email: `admin@example.com`
3. Enter admin password: `admin123`
4. Click "Login as Admin"

### Dashboard
After login, you'll see:
- Dashboard: `/admin/dashboard`
- Manage Content: `/admin/content`
- Add Content: `/admin/content/add`
- Edit Content: `/admin/content/edit/:id`
- Search Logs: `/admin/search-logs`

## Database Models Reference

### User Model (Updated)
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "user" | "admin", // NEW
  isVerified: Boolean,
  otp: String,
  otpExpiry: Date,
  preferences: Object,
  avatar: String,
  bio: String,
  history: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Content Model (New)
```javascript
{
  title: String (required),
  type: "movie" | "book" | "music" | "game" (required),
  genre: String,
  description: String,
  year: Number,
  language: String (default: "English"),
  imageUrl: String,
  tags: [String],
  rating: Number (0-10),
  externalApiId: String,
  metadata: Map,
  createdAt: Date,
  updatedAt: Date
}
```

### SearchLog Model (New)
```javascript
{
  query: String (required),
  detectedType: "movie" | "book" | "music" | "game" | "unknown",
  detectedIntent: String,
  resultsCount: Number,
  userId: ObjectId (reference to User),
  userAgent: String,
  ipAddress: String,
  createdAt: Date
}
```

## API Endpoints

### Admin Authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Get dashboard statistics

### Content Management
- `GET /api/admin/content` - List all content with pagination
- `POST /api/admin/content` - Create new content
- `GET /api/admin/content/:id` - Get single content
- `PUT /api/admin/content/:id` - Update content
- `DELETE /api/admin/content/:id` - Delete content

### Search Logs
- `GET /api/admin/search-logs` - Get search logs with filtering
- `POST /api/admin/search-logs` - Log a search (can be called from AI service)

All admin routes except `/api/admin/login` require:
- Valid JWT token in `Authorization: Bearer <token>` header
- User must have `role: "admin"`

## Logging Searches from AI Service

To log searches from your Python AI service:

```javascript
// From backend
const axios = require('axios');

const logSearch = async (query, detectedType, detectedIntent, resultsCount, userId) => {
  try {
    await axios.post('http://localhost:5000/api/admin/search-logs', {
      query,
      detectedType,
      detectedIntent,
      resultsCount,
      userId
    });
  } catch (error) {
    console.error('Failed to log search:', error);
  }
};
```

Or directly from the recommendation pipeline to the AI service endpoint.

## Frontend API Client

The frontend API endpoints are in `frontend/src/api/endpoints.js`:

```javascript
// Admin endpoints
adminLogin(email, password)
getAdminDashboard()
getAdminContent(params)
getAdminContentById(id)
createAdminContent(payload)
updateAdminContent(id, payload)
deleteAdminContent(id)
getAdminSearchLogs(params)
logSearch(payload)
```

## Security Best Practices

1. **Change Default Credentials**: Always change the default admin email and password in production
2. **Use HTTPS**: Ensure all admin routes are only accessible over HTTPS in production
3. **Rate Limiting**: Consider adding rate limiting to `/api/admin/login`
4. **Audit Logs**: Log all admin actions for compliance
5. **Strong JWT Secret**: Use a strong, randomly generated JWT_SECRET
6. **Token Expiry**: Admin tokens expire as per JWT_EXPIRE setting (default: 7 days)

## Running the Application

### 1. Backend Setup
```bash
cd backend
npm install
node server.js
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Python AI Service (Separate)
```bash
cd ai
python app.py
```

The three services run independently:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Python AI: `http://localhost:8000` (or configured port)

## File Structure

### Backend Files Created/Modified
```
backend/
├── models/
│   ├── User.js (MODIFIED - added role field)
│   ├── Content.js (NEW)
│   └── SearchLog.js (NEW)
├── middleware/
│   └── adminAuthMiddleware.js (NEW)
├── controllers/
│   └── adminController.js (NEW)
├── routes/
│   └── adminRoutes.js (NEW)
└── server.js (MODIFIED - added admin routes)
```

### Frontend Files Created/Modified
```
frontend/src/
├── pages/admin/
│   ├── AdminLoginPage.jsx (NEW)
│   ├── AdminDashboardPage.jsx (NEW)
│   ├── AdminContentListPage.jsx (NEW)
│   ├── AdminContentFormPage.jsx (NEW)
│   └── AdminSearchLogsPage.jsx (NEW)
├── components/admin/
│   ├── AdminProtectedRoute.jsx (NEW)
│   └── AdminSidebar.jsx (NEW)
├── layouts/
│   └── AdminLayout.jsx (NEW)
├── api/
│   └── endpoints.js (MODIFIED - added admin endpoints)
└── App.jsx (MODIFIED - added admin routes)
```

## Troubleshooting

### Admin Login Not Working
1. Check that admin user exists in MongoDB with role: "admin"
2. Verify JWT_SECRET matches between frontend and backend
3. Ensure email and password are correct

### Content Not Appearing
1. Check Content model exists in MongoDB
2. Verify admin is logged in and token is valid
3. Check browser console for API errors

### Search Logs Empty
1. Search logging happens via the `/api/admin/search-logs` POST endpoint
2. Searches from users don't automatically log unless you implement it
3. Use the provided endpoint in your AI service to log searches

### Token Expiry Issues
1. Tokens expire after JWT_EXPIRE duration (default: 7 days)
2. Login again to get a new token
3. Clear localStorage if having persistent issues

## Next Steps

1. **Customize Admin Credentials**: Change default admin email/password
2. **Add Search Logging**: Integrate search logging into your recommendation pipeline
3. **Expand Content Fields**: Modify Content model to store additional metadata
4. **Add User Management**: Create admin pages to manage user accounts
5. **Analytics Dashboard**: Add charts and detailed analytics
6. **Bulk Actions**: Implement bulk import/export for content
7. **Role Permissions**: Add more granular permission levels

## Support

If you encounter issues:
1. Check the browser console (Frontend errors)
2. Check the backend terminal (Server errors)
3. Verify environment variables are set correctly
4. Ensure MongoDB is running and accessible
5. Check JWT token is being sent in requests

## License & Notes

- Admin panel is part of the Recommendation Platform
- Do not expose admin routes publicly without proper authentication
- Always use HTTPS in production
- Regular backups recommended for admin actions and logs
