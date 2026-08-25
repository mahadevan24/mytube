import AppShell from '../components/AppShell';
import InterestManager from '../components/InterestManager';
import ThemeToggle from '../components/ThemeToggle';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <AppShell
            sidebar={<InterestManager />}
            themeToggle={<ThemeToggle />}
            isEmpty={false}
        >
            {children}
        </AppShell>
    );
}
