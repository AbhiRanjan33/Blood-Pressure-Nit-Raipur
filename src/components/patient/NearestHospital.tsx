"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Hospital, LocateFixed } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// fix default Leaflet marker path issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// custom user icon (small blue pin)
const userIcon = new L.Icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/4870/4870341.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

interface HospitalInfo {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  distanceKm?: number;
}

export default function NearbyHospitals() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [hospitals, setHospitals] = useState<HospitalInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<
    "granted" | "prompt" | "denied" | "unknown"
  >("unknown");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // utility: haversine distance in km
  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // fetch hospitals nearby via OpenStreetMap Nominatim and compute distances
  const fetchNearbyHospitals = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=hospital&limit=10&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        const mapped: HospitalInfo[] = data.map((item: any) => ({
          name: item.display_name.split(",")[0],
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          address: item.display_name,
        }));

        // compute distance and pick nearest 3
        const withDist = mapped.map((h) => ({
          ...h,
          distanceKm: haversineKm(lat, lng, h.lat, h.lng),
        }));
        withDist.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        const nearest = withDist.slice(0, 3);
        setHospitals(nearest);
      } catch (err) {
        console.error("Failed to fetch hospitals:", err);
        setErrorMsg("Unable to fetch nearby hospitals. Try again later.");
      }
    },
    []
  );

  // request the current position with high accuracy
  const requestLocation = useCallback(() => {
    setLoading(true);
    setErrorMsg(null);

    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // only update if coordinates seem plausible
        if (
          typeof latitude === "number" &&
          typeof longitude === "number" &&
          !Number.isNaN(latitude) &&
          !Number.isNaN(longitude)
        ) {
          setUserLocation([latitude, longitude]);
          await fetchNearbyHospitals(latitude, longitude);
        } else {
          setErrorMsg("Received invalid coordinates. Please retry.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState("denied");
          setErrorMsg("Location permission denied.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMsg("Position unavailable. Try moving to an open area.");
        } else if (err.code === err.TIMEOUT) {
          setErrorMsg("Location request timed out. Try again.");
        } else {
          setErrorMsg("Failed to get location. Try again.");
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }, [fetchNearbyHospitals]);

  // check permission state via Permissions API (if available)
  useEffect(() => {
    let cancelled = false;

    const checkPerm = async () => {
      if (!("permissions" in navigator)) {
        // fallback: try to request location immediately (may or may not prompt)
        setPermissionState("prompt");
        setLoading(false);
        return;
      }

      try {
        // @ts-ignore - Permissions API types
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (cancelled) return;
        if (status.state === "granted") {
          setPermissionState("granted");
          // directly request location when granted
          requestLocation();
        } else if (status.state === "prompt") {
          setPermissionState("prompt");
          // do not auto-request here — show Allow button to ensure browser prompt appears
          setLoading(false);
        } else if (status.state === "denied") {
          setPermissionState("denied");
          setLoading(false);
        } else {
          setPermissionState("unknown");
          setLoading(false);
        }

        // listen for changes (user might change permission in browser UI)
        const onChange = () => {
          if (status.state === "granted") {
            setPermissionState("granted");
          } else if (status.state === "prompt") {
            setPermissionState("prompt");
          } else if (status.state === "denied") {
            setPermissionState("denied");
          }
        };
        status.onchange = onChange;
      } catch (err) {
        console.warn("Permissions API unavailable or failed:", err);
        setPermissionState("prompt");
        setLoading(false);
      }
    };

    checkPerm();
    return () => {
      cancelled = true;
    };
  }, [requestLocation]);

  // helper to retry (clears state and calls requestLocation)
  const handleRetry = () => {
    setErrorMsg(null);
    setUserLocation(null);
    setHospitals([]);
    setLoading(true);
    // try to request permission & location again
    requestLocation();
  };

  return (
    <Card className="w-full flex flex-col border border-gray-100 shadow-sm bg-white rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-sky-700">
          <Hospital className="h-6 w-6" />
          <div className="flex flex-col">
            Nearby Hospitals
            <span className="text-xs font-normal text-gray-600 mt-1">
              Based on your current location
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Loading while checking permissions */}
        {loading && permissionState === "unknown" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600 mb-3" />
            <p className="text-sm text-gray-600">Checking location permission...</p>
          </div>
        )}

        {/* If permissions are prompt: show Allow Location button (explicit prompt) */}
        {!loading && permissionState === "prompt" && !userLocation && (
          <div className="p-6 rounded-md border border-dashed border-gray-200 bg-gray-50 text-center">
            <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="font-medium text-gray-700 mb-2">Allow location access</p>
            <p className="text-xs text-gray-500 mb-4">
              Click the button below — your browser will ask for location permission.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={requestLocation} className="text-sm px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white">
                Allow Location
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPermissionState("denied")}>
                I can't / later
              </Button>
            </div>
          </div>
        )}

        {/* Permission denied */}
        {!loading && permissionState === "denied" && (
          <div className="p-6 text-center rounded-md border border-gray-200 bg-gray-50">
            <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="font-medium text-gray-700 mb-2">Location access denied</p>
            <p className="text-xs text-gray-500 mb-4">
              To show nearby hospitals we need access to your location. Please enable location permissions in your browser settings and click Retry.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={handleRetry} className="text-sm px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white">
                Retry
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        )}

        {/* If error (non-permission) */}
        {errorMsg && (
          <div className="p-4 rounded-md border border-red-100 bg-red-50 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Map & list, when we have location */}
        {!loading && userLocation && (
          <>
            <div className="h-[360px] rounded-lg overflow-hidden border border-gray-100 shadow-sm">
              <MapContainer center={userLocation} zoom={14} scrollWheelZoom={true} className="h-full w-full z-0">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User marker */}
                <Marker position={userLocation} icon={userIcon}>
                  <Popup>
                    <strong>Your Current Location</strong>
                    <br />
                    Lat: {userLocation[0].toFixed(5)} <br />
                    Lng: {userLocation[1].toFixed(5)}
                  </Popup>
                </Marker>

                {/* Hospital markers */}
                {hospitals.map((h, i) => (
                  <Marker key={i} position={[h.lat, h.lng]}>
                    <Popup>
                      <div className="text-sm">
                        <strong>{h.name}</strong>
                        <br />
                        <span className="text-xs text-gray-600">
                          {h.address}
                        </span>
                        <br />
                        {h.distanceKm !== undefined && (
                          <span className="text-xs text-gray-600">~{h.distanceKm.toFixed(2)} km</span>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div className="mt-3 space-y-3">
              {hospitals.length === 0 ? (
                <p className="text-center text-gray-500 text-sm">No hospitals found nearby.</p>
              ) : (
                hospitals.map((h, i) => (
                  <div key={i} className="p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-all">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-semibold text-gray-800">
                        {i + 1}. {h.name}
                      </div>
                      <div className="flex items-center gap-2">
                        {h.distanceKm !== undefined && (
                          <div className="text-xs text-gray-600">{h.distanceKm.toFixed(2)} km</div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-sky-700 border-sky-200 hover:bg-sky-50"
                          onClick={() => window.open(`https://www.google.com/maps?q=${h.lat},${h.lng}`, "_blank")}
                        >
                          <LocateFixed className="h-4 w-4 mr-1" /> Directions
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{h.address}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
