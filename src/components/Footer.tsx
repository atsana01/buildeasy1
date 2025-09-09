import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand Section - Compact */}
          <div className="space-y-3 max-w-md">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/569809aa-baff-4dfd-a37e-09697c885f6d.png" alt="BuildEasy Logo" className="h-20 w-auto object-contain" />
            </div>
            <p className="text-muted-foreground text-sm">
              Connecting dreams with the right professionals to build anything, anywhere.
            </p>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span>support@buildeasy.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap gap-8 md:gap-12">
            {/* How It Works */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">How It Works</h3>
              <ul className="space-y-1">
                <li><Link to="/faq#getting-started" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Getting Started</Link></li>
                <li><Link to="/faq#submitting-requests" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Submitting Requests</Link></li>
                <li><Link to="/faq#matching-process" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Matching Process</Link></li>
                <li><Link to="/faq#project-management" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Project Management</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Support</h3>
              <ul className="space-y-1">
                <li><Link to="/faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link to="/faq#account-types" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Account Types</Link></li>
                <li><Link to="/payment-billing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Payment & Billing</Link></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Legal</h3>
              <ul className="space-y-1">
                <li><Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/cookies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</Link></li>
                <li><Link to="/acceptable-use" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Acceptable Use</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-6 pt-4">
          <div className="text-xs text-muted-foreground text-center">
            © 2025 BuildEasy. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};