import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format";

export type ReceiptsRules = {
  valuePerCredit?: number;
  creditsPerStep?: number;
  maxCreditsPerReceipt?: number;
  instructions?: string;
};

export const receiptsRulesQuery = {
  queryKey: ["settings", "receipts"] as const,
  queryFn: async (): Promise<ReceiptsRules> => {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "receipts")
      .maybeSingle();
    return (data?.value ?? {}) as ReceiptsRules;
  },
};

export function useReceiptsRules() {
  const { data: rules } = useQuery(receiptsRulesQuery);

  const valuePerCredit = Number(rules?.valuePerCredit ?? 100) || 100;
  const creditsPerStep = Number(rules?.creditsPerStep ?? 2) || 1;
  const maxCreditsPerReceipt = Number(rules?.maxCreditsPerReceipt ?? 50) || 1;

  const receiptsRuleText = `a cada ${formatCurrency(valuePerCredit)} você libera ${creditsPerStep} raspadinha${
    creditsPerStep === 1 ? "" : "s"
  }`;

  const estimateCredits = (purchaseValue: number) =>
    Math.min(Math.floor((purchaseValue || 0) / valuePerCredit) * creditsPerStep, maxCreditsPerReceipt);

  return {
    rules,
    valuePerCredit,
    creditsPerStep,
    maxCreditsPerReceipt,
    instructions: rules?.instructions,
    receiptsRuleText,
    estimateCredits,
  };
}
