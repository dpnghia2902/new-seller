const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Shop = require('./models/Shop');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Coupon = require('./models/Coupon');
const Review = require('./models/Review'); // ✅ THÊM: model Review
const Complaint = require('./models/Complaint');

// Helper function to set isActive based on stock
const setProductActiveStatus = (product) => {
  return {
    ...product,
    isActive: product.stock > 0
  };
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Shop.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Coupon.deleteMany({});
    await Review.deleteMany({}); // ✅ THÊM: clear Review

    await Complaint.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Users
    const users = await User.create([
      {
        username: 'buyer1',
        email: 'buyer1@example.com',
        password: 'password123',
        fullName: 'John Buyer',
      },
      {
        username: 'seller1',
        email: 'seller1@example.com',
        password: 'password123',
        fullName: 'Jane Seller',
      },
      {
        username: 'seller2',
        email: 'seller2@example.com',
        password: 'password123',
        fullName: 'Mike Johnson',
      },
    ]);
    console.log('✅ Created 3 users');

    // Log passwords for testing
    console.log('\n🔓 Test Accounts Credentials:');
    users.forEach((user) => {
      console.log(`  Email: ${user.email}, Password: ${user.password}`);
    });

    // Create Shops
    const shops = await Shop.create([
      {
        shopName: 'Electronics Paradise',
        owner: users[1]._id,
        description: 'Best prices on electronics and gadgets',
        rating: 4.8,
        isActive: true,
      },
      {
        shopName: 'Fashion World',
        owner: users[2]._id,
        description: 'Latest fashion trends and clothing',
        rating: 4.5,
        isActive: true,
      },
    ]);
    console.log('✅ Created 2 shops');

    // Update users with shop IDs
    await User.findByIdAndUpdate(users[1]._id, { storeId: shops[0]._id });
    await User.findByIdAndUpdate(users[2]._id, { storeId: shops[1]._id });

    // Create Products for Shop 1
    const productsData1 = [
      {
        title: 'Sony WH-1000XM4 Headphones',
        description:
          'Premium noise-canceling wireless headphones with 30-hour battery life, touch controls, and premium sound quality.',
        price: 299.99,
        originalPrice: 349.99,
        discount: 15,
        category: 'Electronics',
        stock: 25,
        shop: shops[0]._id,
        images: ['https://www.bhphotovideo.com/images/images2500x2500/sony_wh1000xm4_b_wh_1000xm4_wireless_noise_canceling_over_ear_1582549.jpg'],
        rating: 4.7,
      },
      {
        title: 'iPhone 14 Pro Max',
        description:
          'Latest Apple iPhone with A16 Bionic chip, 48MP camera, and ProMotion display.',
        price: 999.99,
        originalPrice: 1199.99,
        discount: 17,
        category: 'Electronics',
        stock: 15,
        shop: shops[0]._id,
        images: ['https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6487/6487259_sd.jpg'],
        rating: 4.9,
      },
      {
        title: 'Samsung 4K Smart TV 55"',
        description:
          'Ultra HD 4K resolution with HDR10+, Smart TV features, and gaming mode.',
        price: 599.99,
        originalPrice: 799.99,
        discount: 25,
        category: 'Electronics',
        stock: 0,
        shop: shops[0]._id,
        images: ['https://i5.walmartimages.com/seo/SAMSUNG-55-Class-DU7200B-Crystal-UHD-4K-Smart-TV-UN55DU7200BXZA-2024_891102a4-7ead-43bb-b972-cf8e6f8acbc2.7a23d9f97bf2e3859ce90ec27e06f838.jpeg'],
        rating: 4.6,
      },
      {
        title: 'MacBook Pro 14"',
        description:
          'Powerful laptop with M2 chip, 16GB RAM, 512GB SSD for professionals.',
        price: 1299.99,
        originalPrice: 1499.99,
        discount: 13,
        category: 'Electronics',
        stock: 8,
        shop: shops[0]._id,
        images: ['https://macfinder.co.uk/wp-content/uploads/2022/12/img-MacBook-Pro-Retina-14-Inch-23934.jpg'],
        rating: 4.8,
      },
      {
        title: 'iPad Air',
        description:
          'Versatile tablet with M1 chip, 10.9-inch Liquid Retina display, perfect for work and entertainment.',
        price: 599.99,
        originalPrice: 699.99,
        discount: 14,
        category: 'Electronics',
        stock: 20,
        shop: shops[0]._id,
        images: ['https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/122241-122242-ipad-air-11inch-13inch-m3.png'],
        rating: 4.7,
      },
    ];

    // Apply isActive logic based on stock
    const products1 = await Product.create(productsData1.map(setProductActiveStatus));
    console.log('✅ Created 5 products for Electronics shop');

    // Create Products for Shop 2
    const productsData2 = [
      {
        title: 'Premium Cotton T-Shirt',
        description:
          '100% organic cotton t-shirt, comfortable and durable for everyday wear.',
        price: 29.99,
        originalPrice: 49.99,
        discount: 40,
        category: 'Fashion',
        stock: 50,
        shop: shops[1]._id,
        images: ['https://tse3.mm.bing.net/th/id/OIP.i9_wrNmrL88XT38hHAZ51gHaJQ?cb=ucfimgc2&rs=1&pid=ImgDetMain&o=7&rm=3'],
        rating: 4.4,
      },
      {
        title: 'Classic Blue Jeans',
        description:
          'Timeless blue jeans with perfect fit and comfortable stretch fabric.',
        price: 59.99,
        originalPrice: 89.99,
        discount: 33,
        category: 'Fashion',
        stock: 0,
        shop: shops[1]._id,
        images: ['https://bonobos-prod-s3.imgix.net/products/137083/original/Denim_Blue-Jean_19511-BMC90_40_outfitter.jpg?1559247942=&auto=format%2Ccompress&fit=clip&ixlib=react-8.6.1&h=1&w=1'],
        rating: 4.6,
      },
      {
        title: 'Designer Sunglasses',
        description:
          'Stylish designer sunglasses with UV protection and premium frames.',
        price: 89.99,
        originalPrice: 149.99,
        discount: 40,
        category: 'Fashion',
        stock: 45,
        shop: shops[1]._id,
        images: ['https://tse3.mm.bing.net/th/id/OIP.kSVorjhFLySAk1WF4y4xQgHaHa?cb=ucfimgc2&rs=1&pid=ImgDetMain&o=7&rm=3'],
        rating: 4.5,
      },
      {
        title: 'Winter Jacket',
        description:
          'Warm and stylish winter jacket with waterproof material and insulation.',
        price: 129.99,
        originalPrice: 199.99,
        discount: 35,
        category: 'Fashion',
        stock: 25,
        shop: shops[1]._id,
        images: ['https://i5.walmartimages.com/asr/2eee434f-89cc-4c7e-9324-849dd8cfa45c.92c508323e1e751c4e5b7ef5080640bd.jpeg'],
        rating: 4.7,
      },
    ];

    // Apply isActive logic based on stock
    const products2 = await Product.create(productsData2.map(setProductActiveStatus));
    console.log('✅ Created 4 products for Fashion shop');

    // Update shop product counts
    await Shop.findByIdAndUpdate(shops[0]._id, { totalProducts: products1.length });
    await Shop.findByIdAndUpdate(shops[1]._id, { totalProducts: products2.length });

    // Create Coupons
    const coupons = await Coupon.create([
      {
        code: 'WELCOME10',
        description: 'Welcome discount - 10% off your first purchase',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 0,
        maxDiscount: 100,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        usageLimit: 100,
        shop: shops[0]._id,
        applicableProducts: [], // Apply to ALL products in shop
        isActive: true,
      },
      {
        code: 'SAVE50',
        description: 'Save $50 on electronics',
        discountType: 'fixed',
        discountValue: 50,
        minPurchase: 500,
        maxDiscount: null,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        usageLimit: 50,
        shop: shops[0]._id,
        applicableProducts: [products1[1]._id, products1[3]._id],
        isActive: true,
      },
      {
        code: 'FASHION20',
        description: '20% off all fashion items',
        discountType: 'percentage',
        discountValue: 20,
        minPurchase: 50,
        maxDiscount: 50,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        usageLimit: 200,
        shop: shops[1]._id,
        applicableProducts: [], // Apply to ALL products in shop
        isActive: true,
      },
      {
        code: 'TECH15',
        description: '15% discount on tech gadgets',
        discountType: 'percentage',
        discountValue: 15,
        minPurchase: 100,
        maxDiscount: 200,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        usageLimit: null,
        shop: shops[0]._id,
        applicableProducts: [products1[0]._id, products1[4]._id],
        isActive: true,
      },
    ]);
    console.log('✅ Created 4 coupons');

    // Create Orders
    const orders = await Order.create([
      {
        buyer: users[0]._id,
        shop: shops[0]._id,
        items: [
          {
            product: products1[0]._id,
            title: products1[0].title,
            price: products1[0].price,
            quantity: 1,
          },
        ],
        originalPrice: products1[0].price,
        discount: products1[0].price * 0.10,
        couponUsed: coupons[0]._id,
        coupon: {
          code: coupons[0].code,
          discountType: coupons[0].discountType,
          discountValue: coupons[0].discountValue,
        },
        totalPrice: products1[0].price * 0.90, // Applied 10% discount
        status: 'delivered',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
      },
      {
        buyer: users[0]._id,
        shop: shops[0]._id,
        items: [
          {
            product: products1[1]._id,
            title: products1[1].title,
            price: products1[1].price,
            quantity: 1,
          },
        ],
        originalPrice: products1[1].price,
        discount: 50,
        couponUsed: coupons[1]._id,
        coupon: {
          code: coupons[1].code,
          discountType: coupons[1].discountType,
          discountValue: coupons[1].discountValue,
        },
        totalPrice: products1[1].price - 50, // Applied $50 discount
        status: 'shipped',
        shippingAddress: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA',
        },
      },
      {
        buyer: users[0]._id,
        shop: shops[1]._id,
        items: [
          {
            product: products2[0]._id,
            title: products2[0].title,
            price: products2[0].price,
            quantity: 2,
          },
          {
            product: products2[1]._id,
            title: products2[1].title,
            price: products2[1].price,
            quantity: 1,
          },
        ],
        originalPrice: products2[0].price * 2 + products2[1].price,
        discount: (products2[0].price * 2 + products2[1].price) * 0.20,
        couponUsed: coupons[2]._id,
        coupon: {
          code: coupons[2].code,
          discountType: coupons[2].discountType,
          discountValue: coupons[2].discountValue,
        },
        totalPrice: (products2[0].price * 2 + products2[1].price) * 0.80, // Applied 20% discount
        status: 'confirmed',
        shippingAddress: {
          street: '789 Pine Rd',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA',
        },
      },
      {
        buyer: users[0]._id,
        shop: shops[0]._id,
        items: [
          {
            product: products1[2]._id,
            title: products1[2].title,
            price: products1[2].price,
            quantity: 1,
          },
        ],
        totalPrice: products1[2].price, // No coupon applied
        status: 'pending',
        shippingAddress: {
          street: '321 Elm St',
          city: 'Houston',
          state: 'TX',
          zipCode: '77001',
          country: 'USA',
        },
      },
    ]);
    console.log('✅ Created 4 orders');

    // Prepare readable order codes for search/filter in complaints
    const orderCodes = ['ORD-0001', 'ORD-0002', 'ORD-0003', 'ORD-0004'];

    // Create Complaints for seller management
    const complaints = await Complaint.create([
      {
        shop: shops[0]._id,
        order: orders[0]._id,
        product: orders[0].items[0].product,
        buyer: users[0]._id,
        orderCode: orderCodes[0],
        type: 'damaged_product',
        title: 'Tai nghe bị trầy xước và méo khung',
        description: 'Hộp còn nguyên nhưng tai nghe có vết trầy, khung tai trái bị méo.',
        status: 'new',
        evidenceImages: [
          'https://images.unsplash.com/photo-1518441982125-5d4f84f86b35?q=80&w=600',
          'https://images.unsplash.com/photo-1518441766313-7e7d43b2f3b5?q=80&w=600',
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 ngày trước
      },
      {
        shop: shops[0]._id,
        order: orders[1]._id,
        product: orders[1].items[0].product,
        buyer: users[0]._id,
        orderCode: orderCodes[1],
        type: 'wrong_item',
        title: 'Nhận sai mẫu iPhone',
        description: 'Đặt iPhone 14 Pro Max nhưng nhận bản màu khác và dung lượng thấp hơn.',
        status: 'in_progress',
        evidenceImages: [
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600',
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 ngày trước
      },
      {
        shop: shops[1]._id,
        order: orders[2]._id,
        product: orders[2].items[1].product,
        buyer: users[0]._id,
        orderCode: orderCodes[2],
        type: 'missing_item',
        title: 'Thiếu 1 chiếc quần trong đơn',
        description: 'Đơn có 2 áo + 1 quần, nhưng chỉ nhận được 2 áo.',
        status: 'new',
        evidenceImages: [
          'https://images.unsplash.com/photo-1520975922284-8b456906c813?q=80&w=600',
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 ngày trước
      },
      {
        shop: shops[0]._id,
        order: orders[3]._id,
        product: orders[3].items[0].product,
        buyer: users[0]._id,
        orderCode: orderCodes[3],
        type: 'late_delivery',
        title: 'Giao hàng trễ 5 ngày',
        description: 'Đơn dự kiến giao trong 2 ngày nhưng thực tế 7 ngày mới nhận được.',
        status: 'disputed',
        evidenceImages: [
          'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?q=80&w=600',
        ],
        sellerEvidence: [
          'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=600', // ảnh minh chứng của seller
          'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', // video minh chứng mẫu
        ],
        resolution: {
          action: 'reject',
          note: 'Đã cung cấp video chứng minh giao đúng hẹn theo SLA carrier',
          decidedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
          decidedBy: users[1]._id,
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 ngày trước
      },
    ]);
    console.log(`✅ Created ${complaints.length} complaints`);

    // Update coupon usage count
    await Coupon.findByIdAndUpdate(coupons[0]._id, { $inc: { usedCount: 1 } });
    await Coupon.findByIdAndUpdate(coupons[1]._id, { $inc: { usedCount: 1 } });
    await Coupon.findByIdAndUpdate(coupons[2]._id, { $inc: { usedCount: 1 } });
    // ✅ THÊM: Create Reviews (gắn chính xác product/order/buyer/shop)
    const reviewsData = [
      {
        product: products1[0]._id, // Sony WH-1000XM4
        order: orders[0]._id,
        buyer: users[0]._id,       // buyer1
        shop: shops[0]._id,        // Electronics
        rating: 5,
        comment: 'Tai nghe tuyệt vời, âm thanh rõ ràng và chống ồn cực tốt. Đeo cả ngày vẫn thoải mái!',
        images: ['https://cdn.example.com/reviews/sony-wh1000xm4-review1.jpg'],
        sellerResponse: {
          comment: 'Cảm ơn bạn đã tin tưởng và ủng hộ shop nhé! ❤️',
          respondedAt: new Date('2025-03-02T10:12:00Z')
        },
        isVerifiedPurchase: true,
        helpfulVotes: 8,
        votedBy: []
      },
      {
        product: products1[1]._id, // iPhone 14 Pro Max
        order: orders[1]._id,
        buyer: users[0]._id,
        shop: shops[0]._id,
        rating: 4,
        comment: 'Hàng chính hãng, đóng gói cẩn thận. Tuy nhiên giao hàng chậm hơn dự kiến 1 ngày.',
        images: ['https://cdn.example.com/reviews/iphone14-review.jpg'],
        sellerResponse: {
          comment: 'Xin lỗi vì sự chậm trễ, chúng tôi sẽ cải thiện vận chuyển! Cảm ơn bạn đã thông cảm.',
          respondedAt: new Date('2025-03-03T08:30:00Z')
        },
        isVerifiedPurchase: true,
        helpfulVotes: 5,
        votedBy: []
      },
      {
        product: products2[0]._id, // T-Shirt
        order: orders[2]._id,
        buyer: users[0]._id,
        shop: shops[1]._id,        // Fashion
        rating: 5,
        comment: 'Áo rất mềm, mặc cực kỳ dễ chịu. Form vừa và vải không bị co sau khi giặt.',
        images: ['https://cdn.example.com/reviews/tshirt-review.jpg'],
        sellerResponse: {
          comment: 'Rất vui vì bạn hài lòng với sản phẩm của Fashion World 💕',
          respondedAt: new Date('2025-03-05T14:05:00Z')
        },
        isVerifiedPurchase: true,
        helpfulVotes: 12,
        votedBy: []
      },
      {
        product: products2[2]._id, // Sunglasses
        order: orders[2]._id,
        buyer: users[0]._id,
        shop: shops[1]._id,
        rating: 4,
        comment: 'Kính đẹp, chất lượng ổn nhưng hộp đựng hơi đơn giản.',
        images: ['https://cdn.example.com/reviews/sunglasses-review.jpg'],
        isVerifiedPurchase: true,
        helpfulVotes: 3,
        votedBy: []
      },
      {
        product: products1[2]._id, // Samsung 4K TV
        order: orders[3]._id,
        buyer: users[0]._id,
        shop: shops[0]._id,
        rating: 3,
        comment: 'Hình ảnh đẹp nhưng TV hơi nặng và chân đế khó lắp đặt. Mong shop ghi chú rõ hơn.',
        images: ['https://cdn.example.com/reviews/samsung-tv-review.jpg'],
        isVerifiedPurchase: true,
        helpfulVotes: 1,
        votedBy: []
      }
    ];

    await Review.create(reviewsData);
    console.log('✅ Created 5 reviews');

    console.log('\n📊 Database Seeding Complete!');
    console.log('📝 Sample Data Summary:');
    console.log('   - Users: 3 (1 buyer, 2 sellers)');
    console.log('   - Shops: 2');
    console.log('   - Products: 9');
    console.log('   - Coupons: 4');
    console.log('   - Orders: 4 (3 with coupons)');
    console.log(`   - Complaints: ${complaints.length}`);
    console.log('   - Reviews: 5');
    console.log('\n🎫 Sample Coupons:');
    console.log('   - WELCOME10: 10% off (Electronics Paradise)');
    console.log('   - SAVE50: $50 off electronics (Electronics Paradise)');
    console.log('   - FASHION20: 20% off fashion (Fashion World)');
    console.log('   - TECH15: 15% off tech gadgets (Electronics Paradise)');
    console.log('\n🔓 Test Accounts:');
    console.log('   Buyer:');
    console.log('   - Email: buyer1@example.com');
    console.log('   - Password: password123');
    console.log('\n   Seller 1:');
    console.log('   - Email: seller1@example.com');
    console.log('   - Password: password123');
    console.log('\n   Seller 2:');
    console.log('   - Email: seller2@example.com');
    console.log('   - Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

const runSeeder = async () => {
  await connectDB();
  await seedData();
};

runSeeder();
