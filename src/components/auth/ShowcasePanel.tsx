import React from "react";
import showcaseImage from "@/assets/auth-showcase.jpg";
import { CheckCircle, Zap, ShieldCheck } from "lucide-react";

export function ShowcasePanel() {
  return (
    <aside className="hidden md:flex relative min-h-screen">
      <img
        src={showcaseImage}
        alt="Green Leaf pharmacy management system dashboard showcase"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-background/90 via-background/60 to-background/30" />
      <div className="relative z-10 flex w-full flex-col justify-between p-8 xl:p-12">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-glow">
              <span className="text-primary-foreground font-bold">G</span>
            </div>
            <span className="text-base font-semibold text-foreground">Green Leaf</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Run your pharmacy with confidence
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Smart inventory, fast billing, staff oversight, and insightful reports — all in one place.
          </p>

          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Inventory & expiry alerts
            </li>
            <li className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" />
              Quick sales & instant receipts
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Secure roles & staff access
            </li>
          </ul>
        </div>

        <div className="mt-10 text-xs text-muted-foreground">
          Trusted by forward‑thinking pharmacies
        </div>
      </div>
    </aside>
  );
}
