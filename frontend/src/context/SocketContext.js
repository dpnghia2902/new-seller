import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user, isUserSeller } = useAuth();

    useEffect(() => {
        if (!user) return;
        console.log(user)
        // Create socket connection
        const newSocket = io('http://localhost:5000', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);

            // Join appropriate room based on user role
            if (isUserSeller && user.storeId) {
                newSocket.emit('seller:join', user.id);
                console.log('📢 Seller joined room:', user.id);
            } else {
                newSocket.emit('buyer:join', user.id);
                console.log('📢 Buyer joined room:', user.id);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        // Listen for new orders (sellers only)
        newSocket.on('new:order', (orderData) => {
            console.log('🔔 New order received:', orderData);

            const notification = {
                id: Date.now(),
                type: 'new_order',
                title: 'New Order Received!',
                message: `Order ${orderData.orderNumber} from ${orderData.buyerName}`,
                data: orderData,
                read: false,
                timestamp: new Date(),
            };

            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('New Order! 🎉', {
                    body: `${orderData.buyerName} placed an order for $${orderData.totalPrice.toFixed(2)}`,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                });
            }

            // Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(err => console.log('Audio play failed:', err));
        });

        setSocket(newSocket);

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            newSocket.disconnect();
        };
    }, [user, isUserSeller]);

    const markAsRead = (notificationId) => {
        setNotifications((prev) =>
            prev.map((notif) =>
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
        setUnreadCount(0);
    };

    const clearNotification = (notificationId) => {
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
        const notif = notifications.find((n) => n.id === notificationId);
        if (notif && !notif.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    };

    const clearAllNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    const value = {
        socket,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};