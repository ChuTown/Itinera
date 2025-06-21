"use client"

import React from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'

export default function RequestPage() {
    
    const containerStyle = {
        width: '100%',
        height: '95vh',
    };
    
    const center = {
        lat: -3.745,
        lng: -38.523,
    };
    
    function MyComponent() {
        const { isLoaded } = useJsApiLoader({
            id: 'google-map-script',
            googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        });

        const [map, setMap] = React.useState(null);

        const onLoad = React.useCallback(function callback(map) {
            const bounds = new window.google.maps.LatLngBounds(center);
            map.fitBounds(bounds);
            setMap(map);
        }, []);

        const onUnmount = React.useCallback(function callback(map) {
            setMap(null);
        }, []);

        return isLoaded ? (
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={10}
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                {/* Child components, such as markers, info windows, etc. */}
                <></>
            </GoogleMap>
        ) : (
            <></>
        );
    }

    return <MyComponent />;
}
