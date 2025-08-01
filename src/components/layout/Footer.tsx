import { Mail, Phone, Globe, Heart, Shield, Zap, Users, Code, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Footer() {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <footer className={`bg-card border-t border-border mt-auto transition-all duration-500 ease-in-out ${isMinimized ? 'h-16' : 'h-auto'}`}>
      {/* Minimize Button */}
      <div className="flex justify-center py-2 border-b border-border">
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="flex items-center gap-2 px-4 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
        >
          {isMinimized ? (
            <>
              <ChevronDown className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              <span>Expand Footer</span>
            </>
          ) : (
            <>
              <ChevronUp className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              <span>Minimize Footer</span>
            </>
          )}
        </button>
      </div>

      {/* Footer Content */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isMinimized ? 'opacity-0 max-h-0' : 'opacity-100 max-h-screen'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Devzora Technologies</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Leading provider of innovative pharmacy management solutions. 
                Empowering healthcare professionals with cutting-edge technology.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://devzoratech.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                </a>
                <a 
                  href="mailto:support@devzoratech.com" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </a>
                <a 
                  href="tel:+256755543250" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Contact Information</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>support@devzoratech.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>devzoratech@gmail.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+256 755 543 250</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>devzoratech.com</span>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">PharmaFlow Sync</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Version 2.1.0</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Enterprise Grade Security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Multi-User Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Code className="h-4 w-4" />
                  <span>Built with React & TypeScript</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <a 
                  href="https://devzoratech.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Company Website
                </a>
                <a 
                  href="mailto:support@devzoratech.com" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Technical Support
                </a>
                <a 
                  href="mailto:devzoratech@gmail.com" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  General Inquiries
                </a>
                <a 
                  href="tel:+256755543250" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Call Support
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border mt-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>© 2024 Devzora Technologies. All rights reserved.</span>
                <Heart className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>PharmaFlow Sync</span>
                <span>•</span>
                <span>Powered by Devzora Technologies</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimized State - Show only essential info */}
      {isMinimized && (
        <div className="container mx-auto px-4 py-2 flex items-center justify-between text-sm text-muted-foreground animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center space-x-4">
            <span>© 2024 Devzora Technologies</span>
            <span>•</span>
            <span>PharmaFlow Sync v2.1.0</span>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="mailto:support@devzoratech.com" 
              className="hover:text-primary transition-colors"
            >
              support@devzoratech.com
            </a>
            <span>•</span>
            <a 
              href="tel:+256755543250" 
              className="hover:text-primary transition-colors"
            >
              +256 755 543 250
            </a>
          </div>
        </div>
      )}
    </footer>
  );
} 