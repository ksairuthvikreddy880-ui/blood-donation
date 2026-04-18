import { Phone, Mail, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80 py-16 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="font-display text-xl font-bold text-background">
                Instant Blood Connect
              </span>
            </div>
            <p className="text-background/60 leading-relaxed">
              Connecting donors and recipients in real-time. Every second counts when saving lives.
            </p>
          </div>

          <div>
            <h3 className="font-display font-semibold text-background mb-4">Quick Links</h3>
            <ul className="space-y-2 text-background/60">
              <li><a href="#" className="hover:text-primary transition-colors">Find Blood</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Register as Donor</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Emergency Broadcast</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">How It Works</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-background mb-4">Emergency Contact</h3>
            <div className="space-y-3">
              <a href="tel:+1800123456" className="flex items-center gap-3 text-background/60 hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
                1-800-BLOOD-NOW
              </a>
              <a href="mailto:emergency@instantblood.com" className="flex items-center gap-3 text-background/60 hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
                emergency@instantblood.com
              </a>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium">
                🚨 In a life-threatening emergency, always call 102 first.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center text-background/40 text-sm">
          © 2026 Instant Blood Connect. All rights reserved. Built with ❤️ to save lives.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
