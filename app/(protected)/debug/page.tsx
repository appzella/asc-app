'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/lib/auth'
import { testNotificationSystem, testPushNotification } from '@/app/actions/debug'

export default function DebugPage() {
    const [logs, setLogs] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const runTest = async () => {
        setIsLoading(true)
        setLogs(['Running system test...'])
        try {
            const user = authService.getCurrentUser()
            if (!user) {
                setLogs(prev => [...prev, '❌ No logged in user found on client'])
                return
            }

            const result = await testNotificationSystem(user.id)
            setLogs(result)
        } catch (error: any) {
            setLogs(prev => [...prev, `❌ Client error: ${error.message}`])
        } finally {
            setIsLoading(false)
        }
    }

    const runPushTest = async () => {
        setIsLoading(true)
        setLogs(['Running push test...'])
        try {
            const user = authService.getCurrentUser()
            if (!user) {
                setLogs(prev => [...prev, '❌ No logged in user found on client'])
                return
            }

            const result = await testPushNotification(user.id)
            setLogs(result)
        } catch (error: any) {
            setLogs(prev => [...prev, `❌ Client error: ${error.message}`])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container max-w-2xl py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Notification System Debug</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Button onClick={runTest} disabled={isLoading}>
                            {isLoading ? 'Running...' : 'Run System Test'}
                        </Button>
                        <Button onClick={runPushTest} disabled={isLoading} variant="secondary">
                            {isLoading ? 'Running...' : 'Test Push Notification'}
                        </Button>
                    </div>

                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
                        {logs.length === 0 ? 'Click "Run Test" to start' : logs.join('\n')}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
