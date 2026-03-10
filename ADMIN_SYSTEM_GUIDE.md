# Charstine Admin System - Complete Setup Guide

## Overview

The Charstine Hotel Resort now has a **secure, admin-only system** for managing inventory and tracking rentals. This system is completely separate from the public website and requires authentication to access.

## Features

### Admin Authentication
- **Single Admin Account**: Only one admin can access the system
- **Secure Login**: Server-side authentication with bcrypt password hashing
- **Session Management**: Secure session-based authentication
- **Rate Limiting**: Maximum 5 login attempts per 15 minutes to prevent brute-force attacks
- **Auto-Logout**: Sessions expire after 8 hours of inactivity

### Inventory Management
- **View All Items**: See all hotel items (tents, utensils, beds, catering equipment, etc.)
- **Add New Items**: Create new inventory items with name, category, quantity, and description
- **Edit Items**: Update existing item details and stock quantities
- **Delete Items**: Remove items from inventory
- **Stock Tracking**: Real-time inventory availability

### Rental Logging
- **Log Rentals**: Record when items are rented out
- **Track Details**: Capture item name, quantity hired, renter name, hire date, return date, and price
- **Stock Deduction**: Automatically reduces available inventory when items are rented
- **Rental History**: View all past rentals with complete details

### Reports & Analytics
- **Daily Reports**: View daily rental counts and revenue
- **Weekly Reports**: Analyze weekly rental trends and income
- **Real-time Data**: All reports update automatically as rentals are logged

## Admin Credentials

```
Email: charstinehotelresort@gmail.com
Password: Resort254/
```

**Important**: Keep these credentials secure. Do not share them with anyone else.

## System Architecture

### Database Tables

#### `admin_users`
Stores the admin account with hashed password.
```sql
id | email | password_hash
```

#### `items`
Inventory of all hotel items.
```sql
id | name | category | quantity | description
```

#### `rentals`
Log of all item rentals.
```sql
id | item_id | quantity | renter_name | hire_date | return_date | price | created_at
```

#### `admin_sessions`
Session management for authenticated admins.
```sql
id | admin_id | created_at | expires_at
```

### Backend API Endpoints

All endpoints require admin authentication (protected by `requireAdmin` middleware).

#### Authentication
- `POST /login` - Authenticate with email and password
- `GET /logout` - Destroy session and logout
- `GET /admin-session` - Check current session status

#### Inventory Management
- `GET /inventory` - Fetch all items
- `POST /inventory` - Create new item
- `PUT /inventory/:id` - Update item
- `DELETE /inventory/:id` - Delete item

#### Rental Management
- `GET /rentals` - Fetch all rentals
- `POST /rentals` - Log new rental (with transaction support)

#### Reports
- `GET /reports` - Get daily and weekly rental reports

### Frontend Pages

#### `/admin-access.html`
Login page for admin authentication. Features:
- Email and password input fields
- Server-side credential verification
- Error messages for invalid credentials
- Rate limiting feedback
- Redirect to dashboard on successful login

#### `/admin-dashboard.html`
Main admin dashboard with:
- Inventory table with edit/delete actions
- Add/Edit item form
- Rental logging form
- Recent rentals table
- Daily and weekly reports

## Deployment Instructions

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud-hosted)
- npm or yarn package manager

### Step 1: Install Dependencies

```bash
cd /path/to/Charstine
npm install
```

This installs:
- `express` - Web framework
- `bcrypt` - Password hashing
- `express-session` - Session management
- `connect-pg-simple` - PostgreSQL session store
- `pg` - PostgreSQL driver
- `express-rate-limit` - Rate limiting

### Step 2: Set Up PostgreSQL Database

Create a new PostgreSQL database:

```bash
createdb charstine
```

Or if using a cloud database (e.g., Supabase, AWS RDS), note the connection string.

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Database connection string
DATABASE_URL=postgresql://username:password@localhost:5432/charstine

# Session secret (generate a random string)
SESSION_SECRET=your-random-session-secret-here

# Admin credentials (optional - defaults to the ones in schema.sql)
ADMIN_EMAIL=charstinehotelresort@gmail.com
ADMIN_PASSWORD=Resort254/

# Node environment
NODE_ENV=production
PORT=3000
```

**For Production**: Use strong, random values for `SESSION_SECRET`.

### Step 4: Initialize Database Schema

The database schema is automatically created when the server starts. The `ensureSchemaAndSeed()` function in `server.js` will:
1. Create all required tables if they don't exist
2. Seed the admin user with your credentials
3. Populate initial inventory items

### Step 5: Start the Server

```bash
npm start
```

The server will:
1. Initialize the database schema
2. Start listening on the configured port (default: 3000)
3. Display: `Server running on http://localhost:3000`

### Step 6: Access the Admin System

1. Visit the main website: `http://localhost:3000/index.html`
2. Click the **"Admin"** link in the navigation menu
3. Enter credentials:
   - Email: `charstinehotelresort@gmail.com`
   - Password: `Resort254/`
4. Click **"Log In"**
5. You'll be redirected to the admin dashboard

## Security Features

### Password Security
- Passwords are hashed using **bcrypt** with a salt round of 12
- Passwords are never stored in plain text
- Password verification happens server-side

### Session Security
- Sessions are stored in PostgreSQL (not in memory)
- Session cookies are:
  - `httpOnly` - Cannot be accessed by JavaScript
  - `secure` - Only sent over HTTPS in production
  - `sameSite: lax` - CSRF protection
  - `maxAge: 28800` - 8-hour expiration

### Rate Limiting
- Login endpoint limited to **5 attempts per 15 minutes**
- Prevents brute-force password attacks
- Returns error message when limit exceeded

### Admin-Only Routes
- All admin endpoints require `requireAdmin` middleware
- Unauthenticated requests receive 401 Unauthorized
- Normal users cannot access admin pages

### Transaction Support
- Rental logging uses database transactions
- Ensures inventory is correctly decremented
- Prevents race conditions

## Troubleshooting

### "Cannot connect to database"
- Verify PostgreSQL is running
- Check DATABASE_URL is correct
- Ensure database exists: `psql -l`

### "Login failed"
- Verify email and password are correct
- Check rate limiting (wait 15 minutes if exceeded)
- Check server logs for errors

### "Inventory not loading"
- Ensure database schema is initialized
- Check database connection
- Verify admin session is valid

### "Rate limit exceeded"
- Wait 15 minutes before attempting login again
- Or clear rate limit data in production

## Customization

### Changing Admin Credentials

To change the admin email or password:

1. Update `.env` file:
   ```bash
   ADMIN_EMAIL=newemail@example.com
   ADMIN_PASSWORD=NewPassword123!
   ```

2. Restart the server:
   ```bash
   npm start
   ```

The new credentials will be automatically synced to the database.

### Adding More Inventory Items

Edit `schema.sql` or use the admin dashboard to add items:

1. Login to admin dashboard
2. Fill in the "Add Item" form:
   - Item Name
   - Category
   - Quantity
   - Description
3. Click "Save Item"

### Modifying Session Duration

Edit `server.js` line 40:
```javascript
maxAge: 1000 * 60 * 60 * 8, // 8 hours - change this value
```

## Deployment to Production

### Vercel Deployment

The project includes `vercel.json` configuration for Vercel deployment.

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` - Your production database URL
   - `SESSION_SECRET` - Strong random secret
   - `NODE_ENV` - Set to `production`
4. Deploy

### Other Hosting Options

- **Heroku**: Use `Procfile` and set environment variables
- **AWS**: Use Elastic Beanstalk or EC2
- **DigitalOcean**: Use App Platform or Droplets
- **Railway**: Simple deployment from GitHub

### HTTPS in Production

Always use HTTPS in production. Update `server.js` line 38:
```javascript
secure: process.env.NODE_ENV === 'production', // Automatically uses HTTPS in production
```

## Maintenance

### Regular Backups

Backup your PostgreSQL database regularly:

```bash
pg_dump charstine > backup_$(date +%Y%m%d).sql
```

### Monitoring

Monitor these metrics:
- Login attempts and failures
- Inventory changes
- Rental trends
- Database size

### Updates

Keep dependencies updated:

```bash
npm update
npm audit
```

## Support & Documentation

For issues or questions:
1. Check server logs: `npm start` output
2. Review error messages in admin dashboard
3. Verify database connection
4. Check environment variables

## Summary

Your Charstine Resort now has a complete admin system for:
✅ Secure admin authentication
✅ Inventory management
✅ Rental tracking
✅ Revenue reporting
✅ Rate-limited login protection
✅ Session-based security
✅ Database transaction support

The system is production-ready and can be deployed to any Node.js hosting platform.
