// Integration lab: all three lab winners wired together.
// ViewTransition wraps the layout so navigations to /detail use the View Transitions API.
import { ViewTransition } from "react";

export default function IntegrationLayout({ children }: { children: React.ReactNode }) {
  return <ViewTransition>{children}</ViewTransition>;
}
