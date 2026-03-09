import { getDonorStatus, DonorProfile } from "@/utils/donorEligibility";
import { AlertCircle } from "lucide-react";

interface DonorStatusBadgeProps {
  profile: DonorProfile;
  showDescription?: boolean;
}

const DonorStatusBadge = ({ profile, showDescription = false }: DonorStatusBadgeProps) => {
  const statusInfo = getDonorStatus(profile);

  return (
    <div className="space-y-2">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${statusInfo.bgColor}`}>
        <span className="text-lg">{statusInfo.icon}</span>
        <span className={`font-medium text-sm ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>
      
      {showDescription && (
        <div className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
          <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
        </div>
      )}
    </div>
  );
};

export default DonorStatusBadge;
