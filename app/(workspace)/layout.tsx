import type { ReactNode } from "react";
import V2AppLayout from "../../components/v2/V2AppLayout";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <V2AppLayout>{children}</V2AppLayout>;
}
