import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import HouseOwnerNavigator from './HouseOwnerNavigator';
import TradeWorkerNavigator from './TradeWorkerNavigator';
import ServiceAgencyNavigator from './ServiceAgencyNavigator';
import HardwareShopNavigator from './HardwareShopNavigator';

export default function RootNavigator() {
    const { userRole } = useContext(AuthContext);

    if (!userRole) {
        return <AuthNavigator />;
    }

    switch (userRole) {
        case 'HouseOwner':
            return <HouseOwnerNavigator />;
        case 'TradeWorker':
            return <TradeWorkerNavigator />;
        case 'ServiceAgency':
            return <ServiceAgencyNavigator />;
        case 'HardwareShop':
            return <HardwareShopNavigator />;
        default:
            return <AuthNavigator />;
    }
}
