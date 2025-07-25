"use client";

import { PaymentStatus } from "../lib/types";
import { getPaymentStatusInfo } from "../lib/utils";
import { Badge } from "./ui/badge";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export default function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const statusInfo = getPaymentStatusInfo(status);

  return (
    <Badge 
      variant="outline" 
      className={`${statusInfo.colorClass} ${className || ""}`}
    >
      {statusInfo.label}
    </Badge>
  );
}