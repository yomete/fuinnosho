import { Navigation } from "@/components/navigation";
import NavUserIconWrapper from "@/components/nav-user-icon-wrapper";
import { DemoBanner } from "@/components/demo-banner";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DemoBanner />
      <Navigation />
      <div className="fixed top-6 right-6 z-50">
        <NavUserIconWrapper />
      </div>
      <main className="relative z-10 pb-16 px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
        {children}
      </main>
    </>
  );
}
