# authshield-jwt-authentication

A secure Node.js and Express authentication system using JWT for login, logout, and protected routes.

## Features
- **User Registration** with:
  - Password strength validation (must contain uppercase, lowercase, number, and min length)
  - Duplicate email prevention
  - Image upload validation (profile picture)
- **Secure Login** using JWT
- **Protected Routes** accessible only with a valid token
- **Password Hashing** using bcrypt
- **Express Validator** for backend validation

## Tech Stack
- **Node.js**
- **Express.js**
- **MongoDB & Mongoose**
- **JWT (JSON Web Token)**
- **bcrypt** for password hashing
- **Multer** for image uploads
- **express-validator** for input validation

## Installation
```bash
git clone https://github.com/abhilash6907/authshield-jwt-authentication.git
cd authshield-jwt-authentication
npm 