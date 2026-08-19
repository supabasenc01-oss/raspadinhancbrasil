import { useQuery } from "@tanstack/react-query";
import { systemSettingsQuery } from "@/lib/queries";

export function useSettings() {
  const { data: settings, isLoading } = useQuery(systemSettingsQuery);

  const getSetting = (key: string, defaultValue: string = ""): string => {
    if (!settings || !Array.isArray(settings)) return defaultValue;
    const setting = settings.find((s: any) => s.key === key);
    if (!setting) return defaultValue;
    
    let val = setting.value;
    if (val === null || val === undefined) return defaultValue;
    
    // JSONB might return the value as an object or a stringified JSON
    if (typeof val === 'string') {
      let cleanVal = val.trim();
      
      // If it looks like a JSON string, try to parse it
      if ((cleanVal.startsWith('"') && cleanVal.endsWith('"')) || 
          (cleanVal.startsWith('{') && cleanVal.endsWith('}')) || 
          (cleanVal.startsWith('[') && cleanVal.endsWith(']'))) {
        try {
          const parsed = JSON.parse(cleanVal);
          // If the result is a string, use it. If it's an object/array, we might need different handling,
          // but for settings they are usually simple strings or flags.
          if (typeof parsed === 'string') return parsed;
          if (typeof parsed === 'number' || typeof parsed === 'boolean') return String(parsed);
          // If it's still an object, stringify it back or return as is depending on use case
          return typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed);
        } catch (e) {
          // If parsing fails, fall back to simple quote removal if applicable
          return cleanVal.replace(/^"|"$/g, '').replace(/\\"/g, '"');
        }
      }
      return cleanVal;
    }
    
    // For already parsed JSONB objects/numbers/booleans
    return String(val);
  };

  const siteName = getSetting("site_name", "RaspaPremium");
  const logoUrl = getSetting("logo_url", "");
  const faviconUrl = getSetting("favicon_url", "/favicon.png");
  const metaDescription = getSetting("meta_description", "Plataforma premium de raspadinhas online.");
  const ogImageUrl = getSetting("og_image_url", "");
  const googleAnalyticsId = getSetting("google_analytics_id", "");
  const facebookPixelId = getSetting("facebook_pixel_id", "");
  const footerExternalLink = getSetting("footer_external_link", "https://www.ncbrasil.com.br");

  return {
    settings,
    isLoading,
    getSetting,
    siteName,
    logoUrl,
    faviconUrl,
    metaDescription,
    ogImageUrl,
    googleAnalyticsId,
    facebookPixelId,
    footerExternalLink,
    brandStartColor: getSetting("brand_start_color", "oklch(0.45 0.17 265)"),
    brandEndColor: getSetting("brand_end_color", "oklch(0.35 0.15 260)"),
    accentStartColor: getSetting("accent_start_color", "oklch(0.65 0.22 45)"),
    accentEndColor: getSetting("accent_end_color", "oklch(0.55 0.2 35)"),
    showHeroBanners: getSetting("show_hero_banners", "true") === "true",
    showWinnersTicker: getSetting("show_winners_ticker", "true") === "true",
    showScratchDemo: getSetting("show_scratch_demo", "true") === "true",
    showScratchCards: getSetting("show_scratch_cards", "true") === "true",
    showHowToPlay: getSetting("show_how_to_play", "true") === "true",
    showLatestWinners: getSetting("show_latest_winners", "true") === "true",
    showTestimonials: getSetting("show_testimonials", "true") === "true",
    showAppDownload: getSetting("show_app_download", "true") === "true",
  };
}
