#!/bin/bash

# eBay Clone - Quick Setup Script

echo "==========================================="
echo "eBay Clone - Full Stack Setup"
echo "==========================================="

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

echo ""
echo "✅ Backend dependencies installed"

# Go back to root
cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
npm install

echo ""
echo "✅ Frontend dependencies installed"

# Create backend .env if not exists
if [ ! -f backend/.env ]; then
    echo ""
    echo "📝 Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
fi

echo ""
echo "==========================================="
echo "Setup Complete! ✅"
echo "==========================================="
echo ""
echo "Next steps:"
echo "1. Make sure MongoDB is running"
echo "2. Run: npm run start:dev"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo ""
