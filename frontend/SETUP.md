# eBay Clone - Full Stack Application

Một ứng dụng web clone eBay hoàn chỉnh với tính năng đầy đủ cho người dùng và người bán.

## Tính Năng Chính

### Người Dùng
- ✅ Đăng ký, đăng nhập, đăng xuất
- ✅ Xem trang chủ với danh sách sản phẩm
- ✅ Tìm kiếm sản phẩm theo tên
- ✅ Lọc sản phẩm theo danh mục
- ✅ Xem chi tiết sản phẩm
- ✅ Xem thông tin shop
- ✅ Xem đánh giá sản phẩm

### Người Bán
- ✅ Đăng ký thành người bán (Become a Seller)
- ✅ Quản lý shop cá nhân
- ✅ Thêm sản phẩm mới
- ✅ Chỉnh sửa sản phẩm
- ✅ Xóa sản phẩm
- ✅ Xem thống kê shop

## Công Nghệ Sử Dụng

### Frontend
- React 19
- React Router v6
- Axios
- CSS3 (Responsive Design)

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)
- bcryptjs (Password hashing)

## Hướng Dẫn Cài Đặt

### Yêu Cầu
- Node.js v14+
- npm hoặc yarn
- MongoDB (cài đặt cục bộ hoặc Atlas)

### 1. Clone Repository

```bash
git clone <repo-url>
cd ebay_clone
```

### 2. Cài Đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env`:

```bash
MONGODB_URI=mongodb://localhost:27017/ebay_clone
JWT_SECRET=ebay_clone_secret_key_2024
PORT=5000
```

### 3. Cài Đặt Frontend

```bash
npm install
```

### 4. Khởi Động MongoDB

Nếu bạn có MongoDB cài đặt cục bộ:

```bash
mongod
```

Hoặc sử dụng MongoDB Atlas (cloud):
- Tạo account tại https://www.mongodb.com/cloud/atlas
- Lấy connection string và cập nhật vào `.env`

### 5. Chạy Ứng Dụng

Từ thư mục gốc (`ebay_clone`), chạy lệnh:

```bash
npm run start:dev
```

Điều này sẽ chạy:
- Backend server trên `http://localhost:5000`
- Frontend app trên `http://localhost:3000`

### Hoặc chạy riêng lẻ:

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user (Protected)
- `PUT /api/auth/profile` - Cập nhật profile (Protected)

### Shops
- `POST /api/shops/create` - Tạo shop (Protected)
- `GET /api/shops/my-shop` - Lấy shop của bản thân (Protected)
- `GET /api/shops/:shopId` - Lấy thông tin shop
- `GET /api/shops/all` - Lấy tất cả shops
- `PUT /api/shops/update` - Cập nhật shop (Protected)

### Products
- `POST /api/products/create` - Tạo sản phẩm (Protected)
- `GET /api/products/all` - Lấy tất cả sản phẩm (có phân trang)
- `GET /api/products/:productId` - Lấy chi tiết sản phẩm
- `GET /api/products/my-products` - Lấy sản phẩm của bản thân (Protected)
- `GET /api/products/shop/:shopId` - Lấy sản phẩm của shop
- `PUT /api/products/:productId` - Cập nhật sản phẩm (Protected)
- `DELETE /api/products/:productId` - Xóa sản phẩm (Protected)

## Cấu Trúc Thư Mục

```
ebay_clone/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Shop.js
│   │   └── Product.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── shopController.js
│   │   └── productController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── shopRoutes.js
│   │   └── productRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── src/
│   ├── api/
│   │   └── client.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── components/
│   │   ├── Navbar.js
│   │   ├── Navbar.css
│   │   ├── ProductCard.js
│   │   ├── ProductCard.css
│   │   └── ProtectedRoute.js
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Home.css
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Auth.css
│   │   ├── BecomeSeller.js
│   │   ├── BecomeSeller.css
│   │   ├── AdminShop.js
│   │   ├── AdminShop.css
│   │   ├── ShopDetail.js
│   │   ├── ShopDetail.css
│   │   ├── ProductDetail.js
│   │   └── ProductDetail.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── public/
├── package.json
└── README.md
```

## Hướng Dẫn Sử Dụng

### Đăng Ký Tài Khoản Mới

1. Click vào nút "Register" trong navigation bar
2. Điền thông tin: Username, Email, Password, Full Name
3. Click "Register"

### Đăng Nhập

1. Click vào nút "Login"
2. Nhập Email và Password
3. Click "Login"

### Trở Thành Người Bán

1. Đăng nhập vào tài khoản
2. Click "Become a Seller"
3. Nhập tên shop và mô tả
4. Click "Create Shop"

### Thêm Sản Phẩm

1. Vào "Admin" dashboard
2. Click "+ Add Product"
3. Điền thông tin sản phẩm:
   - Tên sản phẩm
   - Danh mục
   - Giá
   - Số lượng
   - Mô tả
   - Discount (tuỳ chọn)
4. Click "Add Product"

### Tìm Kiếm Sản Phẩm

1. Từ trang Home
2. Nhập từ khóa tìm kiếm
3. Chọn danh mục (tuỳ chọn)
4. Click "Search"

## Lưu Ý

- Mật khẩu được mã hóa bằng bcryptjs
- JWT token được lưu trong localStorage
- Tất cả yêu cầu API được bảo vệ bằng token JWT
- CORS được cấu hình để cho phép frontend và backend giao tiếp

## Phát Triển Tiếp Theo

- [ ] Thêm tính năng giỏ hàng
- [ ] Thêm tính năng thanh toán
- [ ] Thêm đánh giá và bình luận sản phẩm
- [ ] Thêm upload hình ảnh
- [ ] Thêm hệ thống thông báo
- [ ] Thêm quản lý đơn hàng
- [ ] Thêm hệ thống tin nhắn giữa người dùng
- [ ] Deploy lên production

## Troubleshooting

### Lỗi "Cannot GET /"
- Chắc chắn backend server đang chạy trên port 5000
- Chắc chắn frontend được serve trên port 3000

### Lỗi kết nối MongoDB
- Kiểm tra MongoDB service có chạy không
- Kiểm tra MONGODB_URI trong file `.env`

### Lỗi CORS
- Kiểm tra CORS được cấu hình trong backend
- Kiểm tra API_BASE_URL trong `src/api/client.js`

## Liên Hệ & Hỗ Trợ

Nếu có bất kỳ vấn đề gì, vui lòng tạo issue hoặc liên hệ qua email.

---

**Happy Coding!** 🚀
