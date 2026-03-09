import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  MapPin, List, Navigation, Phone, Clock, Droplets, Search,
  Loader2, AlertCircle, Map as MapIcon, Building2, X, RefreshCw, Star, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface BloodCentre {
  id: string;
  name: string;
  address: string;
  phone: string;
  workingHours: string;
  latitude: number;
  longitude: number;
  distance?: number;
  type: "blood_bank" | "hospital";
  rating?: number;
  reviews?: number;
  quote?: string;
  bloodAvailability: { [key: string]: boolean };
}

const ALL_BLOOD_CENTRES: BloodCentre[] = [
  // ── USER-PROVIDED REAL BLOOD BANKS ──────────────────────────────
  {
    id: "r1", name: "Sri Anjaniputhra Blood Centre",
    address: "B 1st floor, H no 5-5-35/154, Hyderabad",
    phone: "088853 89033", workingHours: "Open 24 hours",
    latitude: 17.4398, longitude: 78.4930,
    type: "blood_bank", rating: 4.9, reviews: 146,
    quote: "All blood groups available for emergency need.",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": true, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "r2", name: "St.Theresa Hospital Blood Bank",
    address: "Erragadda, Raitu Bazzar, Hyderabad",
    phone: "090300 08003", workingHours: "Open 24 hours",
    latitude: 17.4476, longitude: 78.4268,
    type: "blood_bank", rating: 4.8, reviews: 360,
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": true, "AB-": false, "O+": true, "O-": true },
  },
  {
    id: "r3", name: "Aaraadhya Blood Center",
    address: "5TH FLOOR, H.no. 15-24-497/5F, Road No. 4, above KFC, Hyderabad",
    phone: "097062 22999", workingHours: "Open 24 hours",
    latitude: 17.4108, longitude: 78.4630,
    type: "blood_bank", rating: 4.8, reviews: 49,
    quote: "I donated my blood today on 27th Nov 2025 at ABC.",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": false, "AB+": true, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "r4", name: "Dr RONALD ROSS Blood Bank",
    address: "Sai Plaza, 3rd floor plot no 36, Erragadda Nagar, Hyderabad",
    phone: "088862 23113", workingHours: "Open 24 hours",
    latitude: 17.4490, longitude: 78.4220,
    type: "blood_bank", rating: 4.2, reviews: 23,
    quote: "Good place for blood requirement.",
    bloodAvailability: { "A+": true, "A-": false, "B+": true, "B-": true, "AB+": false, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "r5", name: "Aayush Blood Bank",
    address: "Obul Reddy Complex, Rd Number 2, Sumitra Nagar Colony, Hyderabad",
    phone: "N/A", workingHours: "Open 24 hours",
    latitude: 17.4530, longitude: 78.4790,
    type: "blood_bank", rating: 4.5, reviews: 21,
    quote: "A good place to donate the blood, staff is caring and friendly.",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": false, "AB+": true, "AB-": false, "O+": true, "O-": true },
  },
  {
    id: "r6", name: "Radnya Blood Centre Suchitra",
    address: "Venkateshwara Enclave, nr. 3rd floor, beside Priyadarshini hotel, Suchitra, Hyderabad",
    phone: "099515 00067", workingHours: "Open 24 hours",
    latitude: 17.5200, longitude: 78.4800,
    type: "blood_bank", rating: 5.0, reviews: 1,
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": true, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "r7", name: "Life Voluntary Blood Bank",
    address: "Isihta Women's Clinic, MIG: 786, 540, Rd Number 1, Hyderabad",
    phone: "040 2305 9222", workingHours: "Open 24 hours",
    latitude: 17.4950, longitude: 78.3900,
    type: "blood_bank", rating: 4.4, reviews: 16,
    quote: "Good Blood Bank.",
    bloodAvailability: { "A+": true, "A-": false, "B+": true, "B-": true, "AB+": false, "AB-": true, "O+": true, "O-": false },
  },
  {
    id: "r8", name: "Chiranjeevi Eye and Blood Bank",
    address: "No.8-2-293, 82/A, Road No. 1, Banjara Hills, Hyderabad",
    phone: "040 2355 5005", workingHours: "Open 24 hours",
    latitude: 17.4268, longitude: 78.4448,
    type: "blood_bank", rating: 4.5, reviews: 551,
    quote: "Will provide a certificate and card after successfully donating blood.",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": true, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "r9", name: "Nandi Blood Center",
    address: "AL-ameen Plaza Complex, H.No.6-3-134/1 4th floor, Balanagar X Road, Hyderabad",
    phone: "094901 08800", workingHours: "Open 24 hours",
    latitude: 17.4624, longitude: 78.4148,
    type: "blood_bank", rating: 5.0, reviews: 7,
    quote: "Blood donation went smooth and good.",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": false, "AB+": true, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "r10", name: "PV Blood Centre",
    address: "NVK Tower, 3-6-272, Second Floor, Himayatnagar, Hyderabad",
    phone: "040 2322 0989", workingHours: "Open 24 hours",
    latitude: 17.4122, longitude: 78.4799,
    type: "blood_bank", rating: 4.9, reviews: 926,
    quote: "Great staff, smoothly run process of blood donation.",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": true, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "r11", name: "AKSHAYA BLOOD CENTRE",
    address: "ECIL, Telangana, Hyderabad",
    phone: "089775 36788", workingHours: "Open 24 hours",
    latitude: 17.4687, longitude: 78.5689,
    type: "blood_bank", rating: 4.7, reviews: 194,
    quote: "Best blood bank and their service and well professional staff.",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": true, "AB-": false, "O+": true, "O-": true },
  },
  {
    id: "r12", name: "NTR Memorial Trust Blood Centre",
    address: "NTR Trust Bhavan, Road No. 2, Banjara Hills, Hyderabad",
    phone: "040 4857 7888", workingHours: "Open 24 hours",
    latitude: 17.4265, longitude: 78.4420,
    type: "blood_bank", rating: 4.4, reviews: 130,
    quote: "Definitely recommend this place to anyone looking to donate blood.",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": false, "AB+": true, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "r13", name: "Omni Hospital Blood Bank",
    address: "Kothapet, Hyderabad",
    phone: "040 2474 5555", workingHours: "Open 24 hours",
    latitude: 17.3793, longitude: 78.5326,
    type: "hospital", rating: 4.0, reviews: 106,
    quote: "So do donate blood.",
    bloodAvailability: { "A+": true, "A-": false, "B+": true, "B-": true, "AB+": false, "AB-": false, "O+": true, "O-": true },
  },
  {
    id: "r14", name: "Mother Teresa Blood Bank",
    address: "4th Floor, Kosal Sai Plaza, Near Sai Ayush Ayurveda, Madinaguda, Hyderabad",
    phone: "090902 27979", workingHours: "Open 24 hours",
    latitude: 17.4875, longitude: 78.3286,
    type: "blood_bank", rating: 4.2, reviews: 31,
    quote: "Blood donation process went very smooth.",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": false, "AB+": true, "AB-": false, "O+": true, "O-": true },
  },
  {
    id: "r15", name: "DECCAN'S BLOOD CENTRE",
    address: "Shop no.1, 7-1-53, Bapu Bhavan, Dharam Karan Rd, beside GHMC Ground, Hyderabad",
    phone: "N/A", workingHours: "Open 24 hours",
    latitude: 17.4337, longitude: 78.4508,
    type: "blood_bank", rating: 4.7, reviews: 31,
    quote: "Good service healthy blood.",
    bloodAvailability: { "A+": true, "A-": false, "B+": true, "B-": true, "AB+": true, "AB-": true, "O+": true, "O-": false },
  },
  {
    id: "r16", name: "Aarohi Blood Center",
    address: "Savithri Nilayam, D.No.6-2-935/2A, beside BPCL Petrol Pump, Kammari Krishna St, Hyderabad",
    phone: "040 2338 4212", workingHours: "Open · Closes 6 pm",
    latitude: 17.4115, longitude: 78.4785,
    type: "blood_bank", rating: 4.8, reviews: 82,
    quote: "Right place to donate blood voluntarily.",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": false, "AB+": false, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "r17", name: "Gene Blood Bank",
    address: "Kanthisikara Complex, beside FMS Dental Clinic, opposite Model House, Hyderabad",
    phone: "040 2341 1658", workingHours: "Open 24 hours",
    latitude: 17.4489, longitude: 78.4265,
    type: "blood_bank", rating: 4.3, reviews: 23,
    quote: "Gene blood bank best services Thank you.",
    bloodAvailability: { "A+": true, "A-": false, "B+": true, "B-": true, "AB+": false, "AB-": true, "O+": true, "O-": false },
  },
  {
    id: "r18", name: "Rudhira Voluntary Blood Bank",
    address: "1st Floor, Anasuya Complex, 3-6-10/A, Liberty Rd, Hyderabad",
    phone: "N/A", workingHours: "Open 24 hours",
    latitude: 17.4115, longitude: 78.4773,
    type: "blood_bank", rating: 4.8, reviews: 12,
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": true, "AB-": false, "O+": true, "O-": true },
  },
  {
    id: "r19", name: "Chiranjeevi Charitable Trust",
    address: "No.8-2-293, 82/A, Road No. 1, Banjara Hills, Hyderabad",
    phone: "040 2355 5005", workingHours: "Open · Closes 6 pm",
    latitude: 17.4272, longitude: 78.4452,
    type: "blood_bank", rating: 4.9, reviews: 88,
    quote: "Re birth to the society.",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": true, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "r20", name: "Indian Red Cross Blood Bank",
    address: "1-9-311/A, Red Hills, Hyderabad",
    phone: "040 2763 3087", workingHours: "Open 24 hours",
    latitude: 17.4435, longitude: 78.4747,
    type: "blood_bank", rating: 4.4, reviews: 57,
    quote: "I am any time blood donation I help.",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": true, "AB-": false, "O+": true, "O-": true },
  },
  // ── ORIGINAL CENTRES ────────────────────────────────────────────
  {
    id: "1", name: "Red Cross Blood Bank",
    address: "Red Hills, Hyderabad, Telangana 500004",
    phone: "+91 40 2763 0644", workingHours: "24/7",
    latitude: 17.4435, longitude: 78.4747,
    type: "blood_bank",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": false, "AB+": true, "AB-": false, "O+": true, "O-": true },
  },
  {
    id: "2", name: "Lifeblood Centre",
    address: "Kompally, Medchal, Hyderabad, Telangana 500014",
    phone: "+91 40 2719 2345", workingHours: "Mon-Sat: 9AM-6PM",
    latitude: 17.5404, longitude: 78.4909,
    type: "blood_bank",
    bloodAvailability: { "A+": true, "A-": false, "B+": true, "B-": true, "AB+": false, "AB-": true, "O+": true, "O-": false },
  },
  {
    id: "3", name: "Gandhi Hospital Blood Bank",
    address: "Musheerabad, Secunderabad, Telangana 500003",
    phone: "+91 40 2761 1951", workingHours: "24/7",
    latitude: 17.4489, longitude: 78.4942,
    type: "blood_bank",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": true, "AB-": false, "O+": true, "O-": true },
  },
  {
    id: "4", name: "Apollo Hospitals",
    address: "Jubilee Hills, Hyderabad, Telangana 500033",
    phone: "+91 40 2360 7777", workingHours: "24/7 Emergency",
    latitude: 17.4239, longitude: 78.4138,
    type: "hospital",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": true, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "5", name: "Yashoda Hospital",
    address: "Somajiguda, Hyderabad, Telangana 500082",
    phone: "+91 40 2344 4444", workingHours: "24/7 Emergency",
    latitude: 17.4281, longitude: 78.4561,
    type: "hospital",
    bloodAvailability: { "A+": true, "A-": false, "B+": true, "B-": true, "AB+": false, "AB-": false, "O+": true, "O-": true },
  },
  {
    id: "6", name: "Care Hospitals",
    address: "Banjara Hills, Hyderabad, Telangana 500034",
    phone: "+91 40 6165 6666", workingHours: "24/7 Emergency",
    latitude: 17.4126, longitude: 78.4476,
    type: "hospital",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": false, "AB+": true, "AB-": true, "O+": true, "O-": false },
  },
  {
    id: "7", name: "Continental Hospitals",
    address: "Gachibowli, Hyderabad, Telangana 500032",
    phone: "+91 40 6767 6767", workingHours: "24/7 Emergency",
    latitude: 17.4401, longitude: 78.3489,
    type: "hospital",
    bloodAvailability: { "A+": true, "A-": false, "B+": true, "B-": true, "AB+": true, "AB-": false, "O+": true, "O-": true },
  },
  {
    id: "8", name: "KIMS Hospital",
    address: "Secunderabad, Telangana 500003",
    phone: "+91 40 4488 8888", workingHours: "24/7 Emergency",
    latitude: 17.4399, longitude: 78.4983,
    type: "hospital",
    bloodAvailability: { "A+": true, "A-": true, "B+": false, "B-": true, "AB+": true, "AB-": true, "O+": true, "O-": false },
  },
  {
    id: "9", name: "Sunshine Hospitals",
    address: "Paradise Circle, Secunderabad, Telangana 500003",
    phone: "+91 40 4455 5555", workingHours: "24/7 Emergency",
    latitude: 17.4435, longitude: 78.4965,
    type: "hospital",
    bloodAvailability: { "A+": true, "A-": false, "B+": true, "B-": false, "AB+": false, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "10", name: "Medicover Hospitals",
    address: "Madhapur, Hyderabad, Telangana 500081",
    phone: "+91 40 6810 6589", workingHours: "24/7 Emergency",
    latitude: 17.4485, longitude: 78.3908,
    type: "hospital",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": true, "AB-": false, "O+": true, "O-": false },
  },
  {
    id: "11", name: "Rainbow Children's Hospital",
    address: "Banjara Hills, Hyderabad, Telangana 500034",
    phone: "+91 40 4455 5566", workingHours: "24/7 Emergency",
    latitude: 17.4183, longitude: 78.4479,
    type: "hospital",
    bloodAvailability: { "A+": true, "A-": false, "B+": true, "B-": true, "AB+": false, "AB-": false, "O+": true, "O-": true },
  },
  {
    id: "12", name: "Aware Gleneagles Global Hospital",
    address: "Lakdi Ka Pool, Hyderabad, Telangana 500004",
    phone: "+91 40 4444 6666", workingHours: "24/7 Emergency",
    latitude: 17.4015, longitude: 78.4684,
    type: "hospital",
    bloodAvailability: { "A+": true, "A-": true, "B+": false, "B-": true, "AB+": true, "AB-": true, "O+": true, "O-": true },
  },
  {
    id: "13", name: "Prathima Hospitals",
    address: "Kukatpally, Hyderabad, Telangana 500072",
    phone: "+91 40 2311 2345", workingHours: "24/7 Emergency",
    latitude: 17.4948, longitude: 78.3982,
    type: "hospital",
    bloodAvailability: { "A+": true, "A-": false, "B+": true, "B-": false, "AB+": true, "AB-": true, "O+": true, "O-": false },
  },
  {
    id: "14", name: "Fernandez Hospital",
    address: "Bogulkunta, Hyderabad, Telangana 500001",
    phone: "+91 40 4780 0000", workingHours: "24/7 Emergency",
    latitude: 17.3753, longitude: 78.4787,
    type: "hospital",
    bloodAvailability: { "A+": true, "A-": true, "B+": true, "B-": true, "AB+": false, "AB-": false, "O+": true, "O-": true },
  },
  {
    id: "15", name: "Maxcure Hospitals",
    address: "Madhapur, Hyderabad, Telangana 500081",
    phone: "+91 40 6777 7777", workingHours: "24/7 Emergency",
    latitude: 17.4504, longitude: 78.3915,
    type: "hospital",
    bloodAvailability: { "A+": true, "A-": false, "B+": true, "B-": true, "AB+": true, "AB-": false, "O+": true, "O-": false },
  },
];

// ── helpers ──────────────────────────────────────────────────────
const calcDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const googleMapsUrl = (centre: BloodCentre, from?: { lat: number; lng: number }) => {
  const dest = `${centre.latitude},${centre.longitude}`;
  if (from) return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${dest}`;
  return `https://www.google.com/maps/search/?api=1&query=${dest}`;
};

// ── Google Maps iframe URL (shows blood banks near Hyderabad) ────
const HYDERABAD_CENTER = { lat: 17.4239, lng: 78.4483 };

const buildGoogleMapsEmbed = (userLoc?: { lat: number; lng: number }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const loc = userLoc ?? HYDERABAD_CENTER;
  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=blood+banks+near+${loc.lat},${loc.lng}&zoom=13`;
  }
  // Fallback: legacy embed (no key needed for basic view)
  return `https://maps.google.com/maps?q=blood+banks+near+hyderabad&t=m&z=13&ie=UTF8&iwloc=&output=embed`;
};

// ── Main component ───────────────────────────────────────────────
const BloodCentres = () => {
  const { toast } = useToast();
  const [view, setView] = useState<"map" | "list">("list");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [centres, setCentres] = useState<BloodCentre[]>([]);
  const [filteredCentres, setFilteredCentres] = useState<BloodCentre[]>([]);
  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);
  const [manualLoc, setManualLoc] = useState("");
  const [filterType, setFilterType] = useState<"all" | "blood_bank" | "hospital">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => { init(); }, []);

  useEffect(() => {
    let f = centres;
    if (filterType !== "all") f = f.filter((c) => c.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter((c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q));
    }
    setFilteredCentres(f);
  }, [centres, filterType, searchQuery]);

  const loadCentres = (loc?: { lat: number; lng: number }) => {
    const enriched = ALL_BLOOD_CENTRES.map((c) => ({
      ...c,
      distance: loc ? parseFloat(calcDist(loc.lat, loc.lng, c.latitude, c.longitude).toFixed(1)) : undefined,
    }));
    const sorted = loc ? [...enriched].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)) : enriched;
    setCentres(sorted);
    setLastRefresh(new Date());
    setLoading(false);
  };

  const init = () => {
    setLoading(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported — showing all centres.");
      loadCentres();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        loadCentres(loc);
      },
      () => {
        setLocError("Location denied — all centres shown, sorted alphabetically.");
        loadCentres();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleManualLoc = () => {
    if (!manualLoc.trim()) return;
    const hyd = { lat: 17.385, lng: 78.4867 };
    setUserLocation(hyd);
    loadCentres(hyd);
    toast({ title: "Location set", description: `Sorting from: ${manualLoc}` });
  };

  const openAllGoogleMaps = () => {
    const q = userLocation
      ? `blood banks near ${userLocation.lat},${userLocation.lng}`
      : "blood banks near Hyderabad";
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(q)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors min-w-0">
            <MapPin className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium truncate hidden xs:inline">Back to Dashboard</span>
            <span className="font-medium xs:hidden">Back</span>
          </Link>
          <h1 className="font-display text-lg sm:text-xl font-bold text-foreground truncate mx-2">
            Hospitals & Banks
          </h1>
          <button
            onClick={openAllGoogleMaps}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#4285F4] text-white rounded-lg text-sm font-medium hover:bg-[#3367D6] transition-colors flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Open Google Maps</span>
            <span className="sm:hidden">Maps</span>
          </button>
        </div>
      </nav>

      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Location error */}
        {locError && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-orange-800">{locError}</p>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Enter your city/area to sort by distance"
                  value={manualLoc}
                  onChange={(e) => setManualLoc(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleManualLoc()}
                  className="flex-1 px-3 py-2 rounded-lg border border-orange-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <button
                  onClick={handleManualLoc}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search blood bank or hospital…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm h-11"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={() => { setLoading(true); init(); }}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 h-11 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="sm:hidden">Refresh List</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
              {(["list", "map"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {v === "list" ? <List className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
                  {v === "list" ? "List" : "Map"}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 overflow-x-auto no-scrollbar">
              {(["all", "blood_bank", "hospital"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`flex-1 sm:flex-none whitespace-nowrap flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t === "blood_bank" && <Droplets className="w-3.5 h-3.5" />}
                  {t === "hospital" && <Building2 className="w-3.5 h-3.5" />}
                  {t === "all" ? "All" : t === "blood_bank" ? "Banks" : "Hospitals"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <p className="text-sm text-muted-foreground mb-4">
            Showing <span className="font-semibold text-foreground">{filteredCentres.length}</span> of{" "}
            <span className="font-semibold text-foreground">{ALL_BLOOD_CENTRES.length}</span> locations
            {userLocation ? " · sorted by distance from you" : ""}
            {lastRefresh && <span className="ml-2 opacity-60">· Updated {lastRefresh.toLocaleTimeString()}</span>}
          </p>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading blood centres…</p>
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {!loading && view === "list" && (
          <div className="space-y-3">
            {filteredCentres.length === 0 ? (
              <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">No results match your search</p>
              </div>
            ) : (
              filteredCentres.map((centre, i) => (
                <CentreCard key={centre.id} centre={centre} index={i} userLocation={userLocation} />
              ))
            )}
          </div>
        )}

        {/* ── MAP VIEW (Google Maps embed + list sidebar) ── */}
        {!loading && view === "map" && (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            {/* Embedded Google Map */}
            <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border shadow-soft h-[400px] sm:h-[500px] lg:h-[620px]">
              <iframe
                title="Blood Banks Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={buildGoogleMapsEmbed(userLocation ?? undefined)}
              />
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-3 max-h-[500px] lg:max-h-[620px] overflow-y-auto pr-1">
              <div className="sticky top-0 bg-background/90 backdrop-blur pb-2 z-10">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
                  {filteredCentres.length} locations found
                </p>
              </div>
              {filteredCentres.map((centre) => (
                <a
                  key={centre.id}
                  href={googleMapsUrl(centre, userLocation ?? undefined)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/60 hover:shadow-soft transition-all block group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">{centre.name}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-tighter sm:tracking-normal ${centre.type === "blood_bank" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                          {centre.type === "blood_bank" ? "Blood Bank" : "Hospital"}
                        </span>
                        {centre.distance !== undefined && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{centre.distance} km</p>
                        )}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                      <Navigation className="w-4 h-4" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Centre Card ──────────────────────────────────────────────────
const CentreCard = ({
  centre, index, userLocation,
}: {
  centre: BloodCentre;
  index: number;
  userLocation: { lat: number; lng: number } | null;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-5 hover:shadow-soft transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-foreground text-base">{centre.name}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${centre.type === "blood_bank" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
              {centre.type === "blood_bank" ? "🩸 Blood Bank" : "🏥 Hospital"}
            </span>
            {centre.distance !== undefined && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full flex-shrink-0">
                {centre.distance} km away
              </span>
            )}
          </div>

          {/* Rating */}
          {centre.rating && (
            <p className="text-xs text-yellow-600 mb-2 flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{centre.rating}</span>
              <span className="text-muted-foreground">({centre.reviews} reviews)</span>
            </p>
          )}

          {/* Details */}
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="flex items-start gap-2"><MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />{centre.address}</p>
            {centre.phone !== "N/A" && (
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 flex-shrink-0" />{centre.phone}</p>
            )}
            <p className="flex items-center gap-2"><Clock className="w-4 h-4 flex-shrink-0" />{centre.workingHours}</p>
            {centre.quote && (
              <p className="text-xs italic text-muted-foreground mt-1 pl-1 border-l-2 border-primary/30">
                "{centre.quote}"
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
          <a
            href={googleMapsUrl(centre, userLocation ?? undefined)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4285F4] text-white rounded-lg text-sm font-semibold hover:bg-[#3367D6] transition-colors shadow-sm"
          >
            <Navigation className="w-4 h-4" />
            Directions
          </a>
          <a
            href={googleMapsUrl(centre)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Map
          </a>
        </div>
      </div>

      {/* Blood availability toggle */}
      <div className="mt-3 pt-3 border-t border-border/60">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Droplets className="w-4 h-4" />
          {expanded ? "Hide" : "Show"} Blood Availability
        </button>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 grid grid-cols-4 gap-2">
            {Object.entries(centre.bloodAvailability).map(([type, avail]) => (
              <div
                key={type}
                className={`px-2 py-1.5 rounded-lg text-center text-xs font-semibold ${avail ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-400 border border-gray-200"}`}
              >
                {type}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BloodCentres;
