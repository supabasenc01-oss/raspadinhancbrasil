import { useState } from "react";
import { X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import { useFileUrl } from "@/hooks/useFileUrl";

export function AppDownloadBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { logoUrl: rawLogoUrl, siteName, appBannerText, appBannerCta, appBannerLink } = useSettings();
  const logoUrl = useFileUrl(rawLogoUrl);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-success py-2 px-4 flex items-center justify-between text-success-foreground relative z-[60]"
        >
          <div className="flex items-center gap-2 mx-auto text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-5 w-auto object-contain mr-2" />
            ) : (
              <Smartphone className="size-3 sm:size-4" />
            )}
            {appBannerText || `Baixe o app oficial da ${siteName}!`}
            {appBannerCta ? (
              <a
                href={appBannerLink || "#"}
                className="bg-white text-success px-3 py-1 rounded-full text-[9px] sm:text-xs hover:bg-white/90 transition-colors ml-2"
              >
                {appBannerCta}
              </a>
            ) : null}
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-black/10 rounded-full transition-colors absolute right-2"
          >
            <X className="size-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
