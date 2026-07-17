"use client";

import { AlertTriangle, CircleAlert, CircleCheck, Info } from "lucide-react";
import { Toaster } from "sonner";

export default function SonnerToaster() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      visibleToasts={4}
      gap={12}
      offset="1rem"
      icons={{
        success: <CircleCheck strokeWidth={2.25} />,
        error: <CircleAlert strokeWidth={2.25} />,
        warning: <AlertTriangle strokeWidth={2.25} />,
        info: <Info strokeWidth={2.25} />,
      }}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast: "ui-sonner-toast",
        },
      }}
    />
  );
}
