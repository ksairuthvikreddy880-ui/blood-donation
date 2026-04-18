import { useState } from "react";
import { ArrowRight, Building2, Droplet } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HospitalInventory {
  id: number;
  hospitalName: string;
  bloodGroup: string;
  currentUnits: number;
  requiredUnits: number;
}

interface Transfer {
  from: string;
  to: string;
  bloodGroup: string;
  units: number;
}

const BloodExchange = () => {
  // Demo data for hospitals
  const [inventory] = useState<HospitalInventory[]>([
    { id: 1, hospitalName: "City General Hospital", bloodGroup: "O-", currentUnits: 15, requiredUnits: 25 },
    { id: 2, hospitalName: "Metro Medical Center", bloodGroup: "O-", currentUnits: 35, requiredUnits: 20 },
    { id: 3, hospitalName: "St. Mary's Hospital", bloodGroup: "A+", currentUnits: 8, requiredUnits: 20 },
    { id: 4, hospitalName: "Central Care Hospital", bloodGroup: "A+", currentUnits: 30, requiredUnits: 15 },
    { id: 5, hospitalName: "Regional Health Center", bloodGroup: "B+", currentUnits: 18, requiredUnits: 18 },
    { id: 6, hospitalName: "Community Hospital", bloodGroup: "AB-", currentUnits: 5, requiredUnits: 12 },
  ]);

  const getStatus = (current: number, required: number) => {
    const diff = current - required;
    if (diff < 0) return { label: "Shortage", color: "destructive", icon: "🔴" };
    if (diff > 0) return { label: "Surplus", color: "success", icon: "🟢" };
    return { label: "Balanced", color: "secondary", icon: "⚪" };
  };

  const calculateSuggestedTransfers = (): Transfer[] => {
    const transfers: Transfer[] = [];
    const bloodGroups = [...new Set(inventory.map(h => h.bloodGroup))];

    bloodGroups.forEach(bloodGroup => {
      const hospitals = inventory.filter(h => h.bloodGroup === bloodGroup);
      const shortages = hospitals.filter(h => h.currentUnits < h.requiredUnits);
      const surpluses = hospitals.filter(h => h.currentUnits > h.requiredUnits);

      shortages.forEach(shortage => {
        surpluses.forEach(surplus => {
          const shortageAmount = shortage.requiredUnits - shortage.currentUnits;
          const surplusAmount = surplus.currentUnits - surplus.requiredUnits;
          const transferAmount = Math.min(shortageAmount, surplusAmount);

          if (transferAmount > 0) {
            transfers.push({
              from: surplus.hospitalName,
              to: shortage.hospitalName,
              bloodGroup: bloodGroup,
              units: transferAmount,
            });
          }
        });
      });
    });

    return transfers;
  };

  const suggestedTransfers = calculateSuggestedTransfers();

  const handleInitiateTransfer = (transfer: Transfer) => {
    alert(`Transfer initiated:\n${transfer.units} units of ${transfer.bloodGroup}\nFrom: ${transfer.from}\nTo: ${transfer.to}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Hospital Network</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Hospital Blood Inventory Exchange
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Intelligent blood distribution system connecting hospitals to optimize inventory and save lives
          </p>
        </motion.div>

        {/* Hospital Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold">Hospital Name</th>
                    <th className="text-center p-4 font-semibold">Blood Group</th>
                    <th className="text-center p-4 font-semibold">Current Units</th>
                    <th className="text-center p-4 font-semibold">Required Units</th>
                    <th className="text-center p-4 font-semibold">Difference</th>
                    <th className="text-center p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((hospital, index) => {
                    const difference = hospital.currentUnits - hospital.requiredUnits;
                    const status = getStatus(hospital.currentUnits, hospital.requiredUnits);
                    
                    return (
                      <motion.tr
                        key={hospital.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{hospital.hospitalName}</span>
                          </div>
                        </td>
                        <td className="text-center p-4">
                          <Badge variant="outline" className="font-mono font-bold">
                            {hospital.bloodGroup}
                          </Badge>
                        </td>
                        <td className="text-center p-4 font-semibold">{hospital.currentUnits}</td>
                        <td className="text-center p-4 font-semibold">{hospital.requiredUnits}</td>
                        <td className="text-center p-4">
                          <span className={`font-bold ${
                            difference < 0 ? "text-destructive" : 
                            difference > 0 ? "text-green-600" : 
                            "text-muted-foreground"
                          }`}>
                            {difference > 0 ? "+" : ""}{difference}
                          </span>
                        </td>
                        <td className="text-center p-4">
                          <Badge 
                            variant={status.color as any}
                            className="gap-1"
                          >
                            <span>{status.icon}</span>
                            {status.label}
                          </Badge>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* Suggested Transfers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
            <Droplet className="w-6 h-6 text-primary" />
            Suggested Transfers
          </h2>

          {suggestedTransfers.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                All hospitals are balanced. No transfers needed at this time.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {suggestedTransfers.map((transfer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="font-mono font-bold text-base px-3 py-1">
                            {transfer.bloodGroup}
                          </Badge>
                          <span className="text-2xl font-bold text-primary">
                            {transfer.units} units
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          <span className="font-medium text-foreground">{transfer.from}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span className="font-medium text-foreground">{transfer.to}</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleInitiateTransfer(transfer)}
                        className="md:w-auto w-full"
                      >
                        Initiate Transfer
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/10"
        >
          <h3 className="font-semibold mb-2 text-primary">How It Works</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• System automatically identifies blood shortages and surpluses across hospitals</li>
            <li>• Matches hospitals with the same blood group for optimal transfers</li>
            <li>• Suggests transfer amounts to balance inventory efficiently</li>
            <li>• Reduces waste and ensures critical blood availability</li>
          </ul>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default BloodExchange;
