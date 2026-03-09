import { Phone, Mail, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80 py-16 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg">
                <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="font-display text-xl font-bold text-background tracking-tight">
                Instant Blood Connect
              </span>
            </div>
            <p className="text-secondary/60 leading-relaxed max-w-xs">
              Connecting donors and recipients in real-time. Every second counts when saving lives.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-start text-sm">
            <h3 className="font-display font-bold text-background mb-5 uppercase tracking-widest text-xs">Navigation</h3>
            <ul className="space-y-3 text-secondary/60">
              <li><a href="#" className="hover:text-primary transition-colors">Find Blood</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Register as Donor</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Emergency Broadcasts</a></li>
              <li><a href="#how" className="hover:text-primary transition-colors">How It Works</a></li>
            </ul>
          </div>

          <div className="flex flex-col items-center sm:items-start sm:col-span-2 lg:col-span-1">
            <h3 className="font-display font-bold text-background mb-5 uppercase tracking-widest text-xs">Emergency Help</h3>
            <div className="space-y-4">
              <a href="tel:+1800123456" className="flex items-center gap-3 text-secondary/60 hover:text-primary transition-colors">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="font-mono text-base">1-800-BLOOD-NOW</span>
              </a>
              <a href="mailto:sos@instantblood.com" className="flex items-center gap-3 text-secondary/60 hover:text-primary transition-colors">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm">sos@instantblood.com</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-secondary/40 text-[10px] sm:text-xs uppercase tracking-widest font-bold">
          <p>© 2026 Instant Blood Connect.</p>
          <p>Built with ❤️ to save lives.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
