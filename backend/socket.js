// socket.js
const { Server } = require('socket.io');

let io; // singleton cho toàn app
const connectedSellers = new Map(); // Map<sellerId, socketId>

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('seller:join', (sellerId) => {
            console.log(`Seller ${sellerId} joined with socket ${socket.id}`);
            connectedSellers.set(sellerId, socket.id);
            socket.join(`seller:${sellerId}`);
        });

        socket.on('buyer:join', (buyerId) => {
            console.log(`Buyer ${buyerId} joined with socket ${socket.id}`);
            socket.join(`buyer:${buyerId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Xóa seller tương ứng
            for (const [sellerId, socketId] of connectedSellers.entries()) {
                if (socketId === socket.id) {
                    connectedSellers.delete(sellerId);
                    break;
                }
            }
        });
    });

    console.log('Socket.IO initialized');
    return io;
}

function getIO() {
    if (!io) throw new Error('Socket.io has not been initialized. Call initSocket(server) first.');
    return io;
}

// Helper dùng ở bất kỳ đâu (route/service) để bắn sự kiện
function emitNewOrder(sellerId, orderData) {
    if (!io) return;
    getIO().to(`seller:${sellerId}`).emit('new:order', orderData);
}

module.exports = {
    initSocket,
    getIO,
    emitNewOrder,
    connectedSellers,
};
