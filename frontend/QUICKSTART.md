# eBay Clone - Quick Start Guide

## 🚀 Bắt Đầu Nhanh

### Yêu Cầu
- Node.js v14+ đã cài đặt
- MongoDB (cục bộ hoặc Atlas)
- Git

### Bước 1: Cài Đặt Dependencies

#### Trên Windows, chạy:
```bash
setup.bat
```

#### Trên Mac/Linux, chạy:
```bash
bash setup.sh
```

#### Hoặc cài đặt thủ công:
```bash
# Backend
cd backend
npm install

# Frontend (từ root)
cd ..
npm install
```

### Bước 2: Cấu Hình MongoDB

**Option A: MongoDB Local**
```bash
# Windows
mongod

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Tạo account tại https://www.mongodb.com/cloud/atlas
2. Tạo cluster
3. Lấy connection string
4. Thêm vào `backend/.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ebay_clone
```

### Bước 3: Khởi Động Ứng Dụng

```bash
npm run start:dev
```

Nó sẽ tự động:
- Khởi động Backend API trên http://localhost:5000
- Khởi động Frontend App trên http://localhost:3000

### Bước 4: Kiểm Tra

Truy cập browser:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 📝 Tài Khoản Test

### Người Dùng Thường
- Email: `buyer@example.com`
- Password: `password123`

### Người Bán
- Email: `seller@example.com`
- Password: `password123`

---

## 🔍 Các Features Chính

### Home Page
- ✅ Hiển thị danh sách sản phẩm
- ✅ Tìm kiếm sản phẩm
- ✅ Lọc theo danh mục
- ✅ Xem chi tiết sản phẩm

### Authentication
- ✅ Đăng ký tài khoản mới
- ✅ Đăng nhập
- ✅ Đăng xuất
- ✅ Session management (JWT)

### Seller Features
- ✅ Trở thành người bán (Become a Seller)
- ✅ Tạo shop cá nhân
- ✅ Quản lý sản phẩm (thêm, sửa, xóa)
- ✅ Xem thống kê shop
- ✅ Quản lý kho hàng

### Shop Features
- ✅ Xem thông tin shop
- ✅ Xem tất cả sản phẩm của shop
- ✅ Follow shop
- ✅ Liên hệ người bán

---

## 📁 Cấu Trúc Dự Án

```
ebay_clone/
├── backend/              # Backend API (Express + MongoDB)
│   ├── models/          # Database schemas
│   ├── controllers/      # Business logic
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth middleware
│   ├── config/          # DB configuration
│   └── server.js        # Main server file
├── src/                 # Frontend React
│   ├── pages/          # Page components
│   ├── components/      # Reusable components
│   ├── context/        # React Context (Auth)
│   ├── api/            # API client
│   └── App.js          # Main app
├── public/             # Static files
├── package.json        # Frontend dependencies
└── README.md
```

---

## 🛠️ Lệnh Hữu Ích

```bash
# Chạy cả backend và frontend
npm run start:dev

# Chỉ backend
cd backend && npm start

# Chỉ frontend
npm start

# Build frontend
npm run build

# Test backend (nếu có)
cd backend && npm test

# Xóa node_modules và cài lại
npm install
cd backend && npm install
```

---

## 🐛 Troubleshooting

### Port 3000 đã được sử dụng
```bash
# Thay đổi port
PORT=3001 npm start
```

### Port 5000 đã được sử dụng
```bash
# Thay đổi port trong backend/.env
PORT=5001
```

### MongoDB Connection Error
```bash
# Kiểm tra MongoDB đang chạy
mongod --version

# Hoặc kiểm tra connection string
# Đảm bảo MONGODB_URI đúng trong backend/.env
```

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
- Đảm bảo backend đang chạy
- Đảm bảo URL trong `src/api/client.js` đúng

---

## 📚 Tài Liệu Thêm

- [API Testing Guide](./API_TESTING.md)
- [Full Setup Guide](./SETUP.md)
- [Original README](./README.md)

---

## 💡 Tips

1. **Lần đầu chạy**: Backend sẽ tạo database tự động
2. **JWT Token**: Lưu trong localStorage, auto gửi với mọi request
3. **CORS**: Đã cấu hình để frontend và backend giao tiếp
4. **Environment Variables**: Copy từ `.env.example` nếu chưa có `.env`

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra console (F12) xem error gì
2. Kiểm tra terminal backend xem có error không
3. Đảm bảo MongoDB đang chạy
4. Xóa node_modules và npm install lại

---

**Happy Coding! 🚀**
