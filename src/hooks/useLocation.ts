/**
 * useLocation — GPS + reverse geocoding via OpenStreetMap Nominatim (free, no API key)
 * Returns: { detect, detecting, lat, lon, address, city, pincode, fullAddress }
 */
import { useState } from "react";

export interface LocationResult {
  lat: number;
  lon: number;
  city: string;
  pincode: string;
  area: string;
  fullAddress: string;
}

export function useLocation() {
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<LocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detect = (): Promise<LocationResult | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError("Geolocation not supported by your browser");
        resolve(null);
        return;
      }

      setDetecting(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;

          try {
            // Nominatim reverse geocode — free, no key needed
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
              { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            const addr = data.address ?? {};

            const city =
              addr.city || addr.town || addr.village || addr.county || addr.state_district || "";
            const pincode = addr.postcode || "";
            const area =
              addr.suburb || addr.neighbourhood || addr.road || addr.quarter || "";
            const fullAddress = [
              addr.road,
              addr.suburb || addr.neighbourhood,
              addr.city || addr.town || addr.village,
              addr.state,
              addr.postcode,
            ]
              .filter(Boolean)
              .join(", ");

            const loc: LocationResult = { lat, lon, city, pincode, area, fullAddress };
            setResult(loc);
            setDetecting(false);
            resolve(loc);
          } catch {
            // Fallback: coords only, no address
            const loc: LocationResult = {
              lat, lon, city: "", pincode: "", area: "",
              fullAddress: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
            };
            setResult(loc);
            setDetecting(false);
            resolve(loc);
          }
        },
        (err) => {
          const msg =
            err.code === 1 ? "Location permission denied. Please allow access." :
            err.code === 2 ? "Location unavailable. Try again." :
            "Location request timed out.";
          setError(msg);
          setDetecting(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  return { detect, detecting, result, error };
}
