import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock, Building2, User, Phone, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BloodRequest {
  id: string;
  blood_group: string;
  urgency: string;
  city: string | null;
  status: string;
  created_at: string;
  notes: any;
  requester_id: string;
}

interface SimpleBloodRequestsListProps {
  userBloodGroup: string | null;
}

const SimpleBloodRequestsList = ({ userBloodGroup }: SimpleBloodRequestsListProps) => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoadin