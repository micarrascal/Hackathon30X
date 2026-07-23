"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/tracking-client";

export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent("page_view", { pageUrl: pathname });
  }, [pathname]);

  return null;
}
