"use client";

import type { ComponentProps } from "react";
import NextLink from "next/link";
import { Link } from "@/i18n/navigation";
import { trackFunnel, type FunnelData, type FunnelEvent } from "@/lib/funnel-events";

type Tracking = { event: FunnelEvent; data?: FunnelData; /** false = a plain link (nothing recorded). */ track?: boolean };

/**
 * A localized Link that records a funnel event when pressed, so server pages can carry a measured
 * button without becoming client components themselves.
 */
export function TrackedLink({ event, data, track = true, onClick, ...props }: ComponentProps<typeof Link> & Tracking) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        if (track) trackFunnel(event, data);
        onClick?.(e);
      }}
    />
  );
}

/** Same, for an href that already carries its locale (e.g. "/ro/auth/register?plan=FAMILY"). */
export function TrackedPlainLink({ event, data, track = true, onClick, ...props }: ComponentProps<typeof NextLink> & Tracking) {
  return (
    <NextLink
      {...props}
      onClick={(e) => {
        if (track) trackFunnel(event, data);
        onClick?.(e);
      }}
    />
  );
}
