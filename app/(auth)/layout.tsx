'use client'

import Image from 'next/image'
import Snowfall from 'react-snowfall'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
            <Image
                src="/login-background.jpg"
                alt="Login Background"
                fill
                className="object-cover"
                priority
            />
            <div className="w-full absolute inset-0 h-full z-0">
                <Snowfall
                    color="white"
                    snowflakeCount={1500}
                    radius={[0.2, 1.0]}
                    speed={[1.0, 5.0]}
                    wind={[0.5, 4.0]}
                />
            </div>
            <div className="w-full max-w-md relative z-10">
                {children}
            </div>
        </div>
    )
}
