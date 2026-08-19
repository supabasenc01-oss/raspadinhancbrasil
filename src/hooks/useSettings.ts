import { useQuery } from "@tanstack/react-query";
import { systemSettingsQuery } from "@/lib/queries";

export function useSettings() {
  const { data: settings, isLoading } = useQuery(systemSettingsQuery);

  const getSetting = (key: string, defaultValue: string = ""): string => {
    if (!settings) return defaultValue;
    const setting = settings.find((s: any) => s.key === key);
    if (!setting) return defaultValue;
    
    let val = setting.value;
    if (val === null || val === undefined) return defaultValue;
    
    if (typeof val === 'string') {
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      if (val === "null" || val === "") return defaultValue;
      return val;
    }
    
    // Convert all non-string values to string to satisfy return type
    return String(val);
  };

  const siteName = getSetting("site_name", "RaspaPremium");
  const logoUrl = getSetting("logo_url", "");
  const faviconUrl = getSetting("favicon_url", "/favicon.ico");
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
