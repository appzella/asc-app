export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
            <div className="w-full max-w-sm space-y-6">
                {children}
            </div>
        </div>
    )
}
