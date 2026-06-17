import { createClient } from "@supabase/supabase-js";

// Public anon key — safe to ship in the client; access is governed by RLS.
export const supabase = createClient(
  "https://podamzsmvybrbdscqrks.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZGFtenNtdnlicmJkc2NxcmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTAwODIsImV4cCI6MjA5NzI2NjA4Mn0.1oZerymL7ahS_WA8sO_GgCdeubtcxzgzCWp5FpY2Vyw"
);
