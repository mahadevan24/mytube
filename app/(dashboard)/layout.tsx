import AppShell from '../components/AppShell';
import ThemeToggle from '../components/ThemeToggle';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <AppShell
            themeToggle={<ThemeToggle />}
            isEmpty={false}
        >
            {children}
        </AppShell>
    );
}
