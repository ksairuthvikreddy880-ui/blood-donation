/**
 * LocationPicker — reusable GPS detect + address display component
 * Shows a "Detect Location" button, then auto-fills city, pincode, full address
 */
import { Navigation, Loader2, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation, type LocationResult } from "@/hooks/useLocation";

interface LocationPickerProps {
  onDetected: (loc: LocationResult) => void;
  city?: string;
  pincode?: string;
  fullAddress?: string;
  onCityChange?: (v: string) => void;
  onPincodeChange?: (v: string) => void;
  compact?: boolean; // single-line mode for modals
}

export default function LocationPicker({
  onDetected, city = "", pincode = "", fullAddress = "",
  onCityChange, onPincodeChange, compact = false,
}: LocationPickerProps) {
  const { detect, detecting, result, error } = useLocation();

  const handleDetect = async () => {
    const loc = await detect();
    if (loc) onDetected(loc);
  };

  const detected = !!result;

  return (
    <div className="space-y-3">
      {/* Detect button */}
      <button
        type="button"
        onClick={handleDetect}
        disabled={detecting}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
          detected
            ? "border-green-500 bg-green-50 text-green-700"
            : error
            ? "border-red-300 bg-red-50 text-red-600"
            : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
        } disabled:opacity-60`}
      >
        {detecting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Detecting your location…</>
        ) : detected ? (
          <><CheckCircle className="w-4 h-4" /> Location Detected — Click to Refresh</>
        ) : (
          <><Navigation className="w-4 h-4" /> Auto-Detect My Location</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Auto-filled address display */}
      {detected && result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-800 mb-1">Detected Address</p>
              <p className="text-xs text-green-700 break-words">{result.fullAddress}</p>
              <p className="text-xs text-green-600 mt-1">
                📍 {result.lat.toFixed(5)}, {result.lon.toFixed(5)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Editable city + pincode fields */}
      {!compact && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={e => onCityChange?.(e.target.value)}
              placeholder="Auto-filled"
              className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={e => onPincodeChange?.(e.target.value)}
              placeholder="Auto-filled"
              className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}
    </div>
  );
}
