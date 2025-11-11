import React from 'react';
import { useLocation } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import './FloatingNotifications.css';

const SHOP_ROUTES_REGEX = /^\/(dashboard|orders|order\/[^/]+|products|inventory|coupons|reviews|profile)\b/i;

export default function FloatingNotifications() {
    const { pathname } = useLocation();
    const shouldShow = SHOP_ROUTES_REGEX.test(pathname);

    if (!shouldShow) return null;

    return (
        <div className="floating-notification-anchor">
            <NotificationDropdown />
        </div>
    );
}
