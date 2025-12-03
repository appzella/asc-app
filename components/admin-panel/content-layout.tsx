import { Navbar } from "@/components/admin-panel/navbar";

interface ContentLayoutProps {
    title: string;
    children: React.ReactNode;
    breadcrumb?: React.ReactNode;
}

export function ContentLayout({ title, children, breadcrumb }: ContentLayoutProps) {
    return (
        <div>
            <Navbar title={title} />
            <div className="container pt-8 pb-8 px-4 sm:px-8">
                <div className="mb-4">
                    {breadcrumb}
                </div>
                {children}
            </div>
        </div>
    );
}
