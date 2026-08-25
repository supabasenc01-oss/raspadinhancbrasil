// Client for calling Supabase Edge Functions that replaced the old
// TanStack Start server functions (src/lib/*.functions.ts) — those relied
// on a Node.js server, which the static SPA build doesn't have.
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL =
  import.meta.env["VITE_SUPABASE_URL"];

export class EdgeFunctionError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "EdgeFunctionError";
  }
}

export async function callEdgeFunction<T>(name: string, body?: unknown): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new EdgeFunctionError(payload?.error || "Erro ao chamar o servidor", response.status);
  }

  return payload as T;
}
