"use client";

import type { ReactNode } from "react";
import { CurrentUserProvider } from "../lib/currentUserContext";
import { BrandingProvider } from "../lib/brandingContext";
import { InAppNotificationProvider } from "../lib/inAppNotificationsContext";
import { ReferenceDataProvider } from "../lib/referenceDataContext";
import { TasksProvider } from "../lib/tasksContext";
import { ConfirmDialogProvider } from "./ui/ConfirmDialog";
import SetupRedirect from "./SetupRedirect";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CurrentUserProvider>
      <BrandingProvider>
        <ReferenceDataProvider>
          <TasksProvider>
            <ConfirmDialogProvider>
              <InAppNotificationProvider>
                <SetupRedirect />
                {children}
              </InAppNotificationProvider>
            </ConfirmDialogProvider>
          </TasksProvider>
        </ReferenceDataProvider>
      </BrandingProvider>
    </CurrentUserProvider>
  );
}
