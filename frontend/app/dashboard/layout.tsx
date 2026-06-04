import { Navbar } from '@/components/ui/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 68 }}>
        {children}
      </div>
    </>
  );
}