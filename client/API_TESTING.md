# eBay Clone - API Testing Guide

## Test API bằng Postman hoặc cURL

### 1. AUTHENTICATION

#### Register
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "fullName": "Test User"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "storeId": null
  }
}
```

#### Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

#### Get Current User
```bash
GET http://localhost:5000/api/auth/me
Authorization: Bearer {token}
```

---

### 2. SHOPS

#### Create Shop (Become a Seller)
```bash
POST http://localhost:5000/api/shops/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "shopName": "My Awesome Shop",
  "description": "Welcome to my online store!"
}
```

#### Get My Shop
```bash
GET http://localhost:5000/api/shops/my-shop
Authorization: Bearer {token}
```

#### Get All Shops
```bash
GET http://localhost:5000/api/shops/all
```

#### Get Shop by ID
```bash
GET http://localhost:5000/api/shops/{shopId}
```

#### Update Shop
```bash
PUT http://localhost:5000/api/shops/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Updated shop description",
  "logo": "https://example.com/logo.png",
  "banner": "https://example.com/banner.png"
}
```

---

### 3. PRODUCTS

#### Create Product
```bash
POST http://localhost:5000/api/products/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "iPhone 13",
  "description": "Latest Apple iPhone with excellent features",
  "price": 999,
  "originalPrice": 1199,
  "discount": 15,
  "category": "Electronics",
  "stock": 50,
  "images": [
    "https://example.com/iphone1.jpg",
    "https://example.com/iphone2.jpg"
  ]
}
```

#### Get All Products
```bash
GET http://localhost:5000/api/products/all?page=1&limit=12&category=Electronics&search=iPhone
```

#### Get Product by ID
```bash
GET http://localhost:5000/api/products/{productId}
```

#### Get My Products
```bash
GET http://localhost:5000/api/products/my-products
Authorization: Bearer {token}
```

#### Get Shop Products
```bash
GET http://localhost:5000/api/products/shop/{shopId}
```

#### Update Product
```bash
PUT http://localhost:5000/api/products/{productId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated iPhone 13",
  "price": 899,
  "stock": 40
}
```

#### Delete Product
```bash
DELETE http://localhost:5000/api/products/{productId}
Authorization: Bearer {token}
```

---

## Sample Test Data

### User 1 - Regular User
```json
{
  "username": "buyer1",
  "email": "buyer1@example.com",
  "password": "password123",
  "fullName": "John Buyer"
}
```

### User 2 - Seller
```json
{
  "username": "seller1",
  "email": "seller1@example.com",
  "password": "password123",
  "fullName": "Jane Seller"
}
```

### Sample Shop
```json
{
  "shopName": "Electronics Paradise",
  "description": "We sell premium electronics at affordable prices"
}
```

### Sample Products

#### Product 1
```json
{
  "title": "Sony WH-1000XM4 Headphones",
  "description": "Premium noise-canceling wireless headphones",
  "price": 299.99,
  "originalPrice": 349.99,
  "discount": 15,
  "category": "Electronics",
  "stock": 25
}
```

#### Product 2
```json
{
  "title": "Blue Light Glasses",
  "description": "Protect your eyes from blue light",
  "price": 49.99,
  "originalPrice": 79.99,
  "discount": 37,
  "category": "Fashion",
  "stock": 100
}
```

---

## Notes

- Token hết hạn sau 7 ngày
- Tất cả requests cần gửi token trong header: `Authorization: Bearer {token}`
- Danh mục sản phẩm: Electronics, Fashion, Home & Garden, Sports, Books, Toys, Other
- Discount là phần trăm (0-100)
- Stock không được âm
