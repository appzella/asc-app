'use client'

import { useState, useEffect } from 'react'
import { authService } from '@/lib/auth'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function HelpPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
          >
            <Link href="/dashboard">
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Zurück zum Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hilfe</h1>
        <CardDescription className="text-base">Erfahren Sie, wie Sie die ASC Skitouren App verwenden</CardDescription>
      </div>

      {/* Übersicht */}
      <Card>
        <CardHeader>
          <CardTitle>Übersicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-600 text-sm leading-relaxed">
            Die ASC Skitouren App ist eine Plattform für den Alpinen Skiclub St. Gallen zur Verwaltung
            von Touren, Anmeldungen und Kommunikation zwischen den Mitgliedern. Die App ermöglicht es Ihnen,
            Touren zu erstellen, sich für Touren anzumelden und mit anderen Teilnehmern zu kommunizieren.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Je nach Ihrer Rolle (Mitglied, Tourenleiter oder Admin) stehen Ihnen unterschiedliche Funktionen
            zur Verfügung. Diese Hilfe-Seite erklärt alle verfügbaren Funktionen basierend auf Ihrer Rolle.
          </p>
        </CardContent>
      </Card>

      {/* Touren */}
      <Card>
        <CardHeader>
          <CardTitle>Touren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Touren-Übersicht</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              In der Touren-Übersicht sehen Sie alle verfügbaren Touren des Clubs. Jede Tour-Karte zeigt
              wichtige Informationen auf einen Blick:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Titel und Beschreibung der Tour</li>
              <li>Datum und Dauer</li>
              <li>Tourenart (Wanderung, Skitour, Bike)</li>
              <li>Tourlänge (Eintagestour, Mehrtagestour)</li>
              <li>Schwierigkeitsgrad nach SAC-Skala</li>
              <li>Höhenmeter</li>
              <li>Anzahl der angemeldeten Teilnehmer</li>
              <li>Status (Ausstehend, Freigegeben, Abgelehnt)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Filter und Suche</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              Verwenden Sie die Filterleiste, um Touren nach Ihren Wünschen zu finden:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li><strong className="font-semibold">Suche:</strong> Durchsuchen Sie Touren nach Titel oder Beschreibung</li>
              <li><strong className="font-semibold">Status:</strong> Filtern Sie nach Ausstehend, Freigegeben oder Abgelehnt (nur für Admins)</li>
              <li><strong className="font-semibold">Tourenart:</strong> Zeigen Sie nur bestimmte Tourentypen an</li>
              <li><strong className="font-semibold">Tourlänge:</strong> Filtern Sie nach Eintagestour oder Mehrtagestour</li>
              <li><strong className="font-semibold">Schwierigkeit:</strong> Wählen Sie eine bestimmte Schwierigkeitsstufe</li>
              <li><strong className="font-semibold">Meine Touren:</strong> Zeigen Sie nur Touren an, für die Sie angemeldet sind</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Tour-Details</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              Klicken Sie auf eine Tour-Karte, um die vollständigen Details zu sehen:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Vollständige Beschreibung der Tour</li>
              <li>Alle technischen Details (Datum, Dauer, Höhenmeter, etc.)</li>
              <li>Teilnehmerliste</li>
              <li>Anmeldung/Abmeldung für die Tour</li>
              <li>Chat-Funktion für Kommunikation mit anderen Teilnehmern</li>
              <li>Für Admins: Freigabe- oder Ablehnungsoptionen</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Sortierung</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              Die Touren werden automatisch nach Datum sortiert:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Die nächste stattfindende Tour steht immer ganz oben</li>
              <li>Die Touren sind aufsteigend nach Datum sortiert</li>
              <li>So finden Sie schnell die nächsten verfügbaren Touren</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Tourenarchiv */}
      <Card>
        <CardHeader>
          <CardTitle>Tourenarchiv</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Was ist das Tourenarchiv?</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              Das Tourenarchiv enthält automatisch alle Touren, deren Datum in der Vergangenheit liegt.
              Vergangene Touren werden nicht mehr in der normalen Touren-Übersicht angezeigt, sondern
              automatisch ins Archiv verschoben.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Zugriff auf das Archiv</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              Sie können das Tourenarchiv auf verschiedene Weise erreichen:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Über den <strong className="font-semibold">&quot;Archiv&quot;</strong>-Button auf der Touren-Übersichtsseite</li>
              <li>Über die <strong className="font-semibold">&quot;Tourenarchiv&quot;</strong>-Card im Dashboard</li>
              <li>Direkt über die URL <code className="bg-gray-100 px-1.5 py-0.5 rounded-md text-xs font-mono">/tours/archive</code></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Archiv-Funktionen</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              Im Archiv haben Sie die gleichen Filter- und Suchfunktionen wie in der normalen Touren-Übersicht:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Suche nach Titel, Beschreibung oder Tourenleiter</li>
              <li>Filter nach Tourenart, Tourlänge und Schwierigkeit</li>
              <li>Filter nach Status (für Admins)</li>
              <li>Option &quot;Nur meine Touren&quot; um nur Ihre vergangenen Touren zu sehen</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Sortierung im Archiv</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              Im Archiv sind die Touren nach Datum sortiert:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Die neuesten vergangenen Touren stehen oben</li>
              <li>Die ältesten Touren stehen ganz unten</li>
              <li>So können Sie schnell die letzten stattgefundenen Touren finden</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Zweck des Archivs</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              Das Archiv dient dazu:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Die Touren-Übersicht übersichtlich zu halten (nur zukünftige Touren)</li>
              <li>Vergangene Touren für Referenzzwecke zu behalten</li>
              <li>Die Historie der Club-Touren einzusehen</li>
              <li>Vergangene Touren nach bestimmten Kriterien zu durchsuchen</li>
              <li>Statistiken über durchgeführte Touren zu erstellen</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Dashboard-Integration</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              Im Dashboard sehen Sie eine Card mit der Anzahl der vergangenen Touren im Archiv.
              Klicken Sie auf <strong className="font-semibold">&quot;Archiv öffnen&quot;</strong>, um direkt zum Archiv zu gelangen.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tour erstellen - nur für Leader/Admin */}
      {(user.role === 'admin' || user.role === 'leader') && (
        <Card>
          <CardHeader>
            <CardTitle>Tour erstellen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-sm leading-relaxed">
              Als Tourenleiter oder Admin können Sie neue Touren für den Club erstellen. Gehen Sie folgendermaßen vor:
            </p>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Schritt 1: Neue Tour erstellen</h3>
              <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                Klicken Sie auf <strong className="font-semibold">&quot;Tour erstellen&quot;</strong> in der Navigation oder auf den Button
                in der Touren-Übersicht.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Schritt 2: Tour-Details eingeben</h3>
              <p className="text-gray-600 mb-3 text-sm leading-relaxed">Füllen Sie alle erforderlichen Felder aus:</p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
                <li><strong className="font-semibold">Titel:</strong> Ein aussagekräftiger Name für die Tour</li>
                <li><strong className="font-semibold">Beschreibung:</strong> Detaillierte Beschreibung der Route, des Schwierigkeitsgrads, der Ausrüstung, etc.</li>
                <li><strong className="font-semibold">Datum:</strong> Das geplante Datum der Tour</li>
                <li><strong className="font-semibold">Tourenart:</strong> Wählen Sie zwischen Wanderung, Skitour oder Bike</li>
                <li><strong className="font-semibold">Tourlänge:</strong> Eintagestour oder Mehrtagestour</li>
                <li><strong className="font-semibold">Schwierigkeit:</strong> Die Schwierigkeit nach SAC-Skala (abhängig von der Tourenart)</li>
                <li><strong className="font-semibold">Höhenmeter:</strong> Die zu überwindenden Höhenmeter</li>
                <li><strong className="font-semibold">Dauer:</strong> Geschätzte Dauer in Stunden</li>
                <li><strong className="font-semibold">Max. Teilnehmer:</strong> Maximale Anzahl der Teilnehmer</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Schritt 3: Tour speichern</h3>
              <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                Nach dem Klicken auf <strong className="font-semibold">&quot;Tour erstellen&quot;</strong> wird die Tour mit dem Status
                <strong className="font-semibold">&quot;Ausstehend&quot;</strong> gespeichert. Ein Admin muss die Tour freigeben, bevor
                sich Mitglieder anmelden können.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Tour bearbeiten</h3>
              <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                Sie können Ihre Touren jederzeit bearbeiten, indem Sie auf der Tour-Detailseite auf
                <strong className="font-semibold">&quot;Tour bearbeiten&quot;</strong> klicken. Wichtige Hinweise:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
                <li>Für noch nicht freigegebene Touren werden Änderungen sofort übernommen</li>
                <li>Für bereits freigegebene Touren müssen Änderungen vom Admin genehmigt werden</li>
                <li>Ausstehende Änderungen werden als <code className="bg-gray-100 px-1.5 py-0.5 rounded-md text-xs font-mono">&quot;pendingChanges&quot;</code> gespeichert</li>
                <li>Der Admin sieht alle ausstehenden Änderungen bei der Freigabe</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin-Funktionen */}
      {user.role === 'admin' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Admin-Funktionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Tour-Freigabe</h3>
                <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                  Als Admin haben Sie die Verantwortung, neue Touren zu überprüfen und freizugeben:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
                  <li>In der Tour-Detailseite sehen Sie eine Box <strong className="font-semibold">&quot;Freigabe erforderlich&quot;</strong></li>
                  <li>Überprüfen Sie alle Tour-Details sorgfältig</li>
                  <li>Klicken Sie auf <strong className="font-semibold">&quot;Tour freigeben&quot;</strong>, um die Tour für Anmeldungen freizugeben</li>
                  <li>Oder klicken Sie auf <strong className="font-semibold">&quot;Ablehnen&quot;</strong>, um die Tour abzulehnen</li>
                  <li>Bei Ablehnung können Sie einen Kommentar hinzufügen, der dem Tourenleiter den Grund erklärt</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Änderungen genehmigen</h3>
                <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                  Wenn eine bereits freigegebene Tour bearbeitet wird, müssen die Änderungen genehmigt werden:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
                  <li>Die Tour zeigt an, dass ausstehende Änderungen vorhanden sind</li>
                  <li>Sie sehen die aktuellen Werte und die vorgeschlagenen Änderungen</li>
                  <li>Genehmigen Sie die Änderungen, um sie zu übernehmen</li>
                  <li>Oder lehnen Sie die Änderungen ab</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Benutzerverwaltung</h3>
                <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                  Im Bereich <strong className="font-semibold">&quot;Benutzer&quot;</strong> können Sie:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
                  <li>Alle Clubmitglieder einsehen</li>
                  <li>Benutzerrollen ändern (Mitglied, Tourenleiter, Admin)</li>
                  <li>Benutzer aktivieren oder deaktivieren</li>
                  <li>Benutzerprofile einsehen</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Einladungen</h3>
                <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                  Im Bereich <strong className="font-semibold">&quot;Einladungen&quot;</strong> können Sie:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
                  <li>Neue Einladungen für Clubmitglieder erstellen</li>
                  <li>Die E-Mail-Adresse des neuen Mitglieds eingeben</li>
                  <li>Ein Einladungstoken wird automatisch generiert</li>
                  <li>Der Token wird per E-Mail (oder manuell) an das neue Mitglied gesendet</li>
                  <li>Neue Mitglieder können sich mit dem Token registrieren</li>
                  <li>Alle Einladungen und deren Status einsehen</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Einstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                Im Bereich <strong className="font-semibold">&quot;Einstellungen&quot;</strong> können Sie die grundlegenden Konfigurationen
                der App verwalten:
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Tourentypen verwalten</h3>
                <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                  Fügen Sie neue Tourentypen hinzu oder entfernen Sie bestehende:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
                  <li>Geben Sie den Namen des neuen Tourentyps ein (z.B. &quot;Klettern&quot;, &quot;Hochtour&quot;)</li>
                  <li>Klicken Sie auf <strong className="font-semibold">&quot;Hinzufügen&quot;</strong></li>
                  <li>Die Reihenfolge kann per Drag & Drop geändert werden</li>
                  <li>Sie können Tourentypen entfernen, die nicht mehr verwendet werden</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Tourlängen verwalten</h3>
                <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                  Verwalten Sie die verfügbaren Tourlängen:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
                  <li>Fügen Sie neue Tourlängen hinzu (z.B. &quot;Halbtagestour&quot;, &quot;Wochentour&quot;)</li>
                  <li>Entfernen Sie nicht mehr benötigte Tourlängen</li>
                  <li>Ändern Sie die Reihenfolge per Drag & Drop</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Schwierigkeitsgrade verwalten</h3>
                <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                  Für jeden Tourentyp können Sie eigene Schwierigkeitsgrade definieren:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
                  <li>Wählen Sie zuerst einen Tourentyp aus dem Dropdown</li>
                  <li>Fügen Sie Schwierigkeitsgrade hinzu (z.B. für Skitouren: &quot;L&quot;, &quot;WS&quot;, &quot;ZS&quot;, &quot;S&quot;, etc.)</li>
                  <li>Die Reihenfolge bestimmt die Anzeigereihenfolge bei der Tour-Erstellung</li>
                  <li>Sie können die Reihenfolge per Drag & Drop ändern</li>
                  <li>Entfernen Sie nicht mehr benötigte Schwierigkeitsgrade</li>
                </ul>
                <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                  <strong className="font-semibold">Hinweis:</strong> Verschiedene Tourentypen verwenden unterschiedliche Skalen:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 mt-2 text-sm">
                  <li><strong className="font-semibold">Wanderungen:</strong> T1-T6 (T-Skala)</li>
                  <li><strong className="font-semibold">Skitouren:</strong> L, WS, ZS, S, SS, AS, EX (SAC-Skala)</li>
                  <li><strong className="font-semibold">Bike:</strong> B1-B5 (vereinfachte Skala)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Anmeldung */}
      <Card>
        <CardHeader>
          <CardTitle>Anmeldung für Touren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Sich für eine Tour anmelden</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              So melden Sie sich für eine freigegebene Tour an:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Öffnen Sie die Tour-Detailseite der gewünschten Tour</li>
              <li>Überprüfen Sie alle Details (Datum, Schwierigkeit, Teilnehmerzahl)</li>
              <li>Klicken Sie auf den Button <strong className="font-semibold">&quot;Anmelden&quot;</strong> in der Seitenleiste</li>
              <li>Sie sehen nun den Status &quot;Sie sind angemeldet&quot;</li>
              <li>Die Teilnehmerzahl wird aktualisiert</li>
            </ol>
            <p className="text-gray-600 mt-3 text-sm leading-relaxed">
              <strong className="font-semibold">Hinweis:</strong> Sie können sich nur für freigegebene Touren anmelden, die noch
              nicht ausgebucht sind. Admins können sich nicht für Touren anmelden.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Von einer Tour abmelden</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              Falls Sie Ihre Teilnahme absagen müssen:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Öffnen Sie die Tour-Detailseite</li>
              <li>Klicken Sie auf den Button <strong className="font-semibold">&quot;Abmelden&quot;</strong></li>
              <li>Sie werden aus der Teilnehmerliste entfernt</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Teilnehmerliste</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              In der Seitenleiste der Tour-Detailseite sehen Sie:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Eine Liste aller angemeldeten Teilnehmer</li>
              <li>Einen Fortschrittsbalken mit der Anzahl der belegten Plätze</li>
              <li>Ihren eigenen Anmeldestatus</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Chat */}
      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            Jede Tour hat einen eigenen Chat-Bereich, in dem sich alle Teilnehmer und Interessierte
            austauschen können.
          </p>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Nachrichten senden</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Geben Sie Ihre Nachricht in das Eingabefeld ein</li>
              <li>Klicken Sie auf <strong className="font-semibold">&quot;Senden&quot;</strong> oder drücken Sie Enter</li>
              <li>Ihre Nachricht wird sofort für alle sichtbar</li>
              <li>Jede Nachricht zeigt den Namen des Absenders und die Uhrzeit</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Typische Anwendungen</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Fragen zur Tour stellen</li>
              <li>Fahrgemeinschaften organisieren</li>
              <li>Ausrüstung diskutieren</li>
              <li>Wetter- und Schneeverhältnisse besprechen</li>
              <li>Treffpunkt und Zeit absprechen</li>
              <li>Allgemeine Kommunikation zwischen Teilnehmern</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Nachrichten anzeigen</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              Der Chat scrollt automatisch zur neuesten Nachricht. Ältere Nachrichten bleiben
              erhalten und können nach oben gescrollt werden.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            In Ihrem Profil können Sie Ihre persönlichen Informationen verwalten. Klicken Sie auf
            Ihren Namen in der oberen Navigation, um zum Profil zu gelangen.
          </p>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Profilfoto</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Laden Sie ein Profilfoto hoch (max. 5MB, JPG, PNG oder GIF)</li>
              <li>Klicken Sie auf <strong className="font-semibold">&quot;Hochladen&quot;</strong> oder <strong className="font-semibold">&quot;Ändern&quot;</strong></li>
              <li>Wählen Sie ein Bild von Ihrem Gerät aus</li>
              <li>Das Bild wird sofort als Profilfoto verwendet</li>
              <li>Sie können das Profilfoto jederzeit entfernen</li>
              <li>Ohne Profilfoto wird der erste Buchstabe Ihres Namens angezeigt</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Persönliche Informationen</h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">Sie können folgende Informationen bearbeiten:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li><strong className="font-semibold">Name:</strong> Ihr vollständiger Name</li>
              <li><strong className="font-semibold">E-Mail:</strong> Ihre E-Mail-Adresse (kann nicht geändert werden)</li>
              <li><strong className="font-semibold">Telefon (Festnetz):</strong> Ihre Festnetznummer</li>
              <li><strong className="font-semibold">Mobile:</strong> Ihre Mobiltelefonnummer</li>
              <li><strong className="font-semibold">Adresse:</strong> Strasse, PLZ und Ort</li>
            </ul>
            <p className="text-gray-600 mt-3 text-sm leading-relaxed">
              Klicken Sie auf <strong className="font-semibold">&quot;Änderungen speichern&quot;</strong>, um Ihre Daten zu aktualisieren.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Rollen */}
      <Card>
        <CardHeader>
          <CardTitle>Rollen und Berechtigungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Mitglied (Member)</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Touren ansehen und durchsuchen</li>
              <li>Sich für freigegebene Touren anmelden</li>
              <li>Am Chat teilnehmen</li>
              <li>Profil bearbeiten</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Tourenleiter (Leader)</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Alle Funktionen eines Mitglieds</li>
              <li>Neue Touren erstellen</li>
              <li>Eigene Touren bearbeiten</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Administrator (Admin)</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Alle Funktionen eines Tourenleiters</li>
              <li>Touren freigeben oder ablehnen</li>
              <li>Änderungen an Touren genehmigen</li>
              <li>Benutzer verwalten</li>
              <li>Einladungen erstellen</li>
              <li>Einstellungen verwalten (Tourentypen, Tourlängen, Schwierigkeitsgrade)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Tipps */}
      <Card>
        <CardHeader>
          <CardTitle>Tipps und Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Für Tourenleiter</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Erstellen Sie Touren rechtzeitig, damit Admins Zeit zur Freigabe haben</li>
              <li>Geben Sie detaillierte Beschreibungen mit allen wichtigen Informationen</li>
              <li>Wählen Sie realistische Teilnehmerzahlen basierend auf der Schwierigkeit</li>
              <li>Beantworten Sie Fragen im Chat schnell und ausführlich</li>
              <li>Informieren Sie Teilnehmer über Änderungen rechtzeitig</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Für Teilnehmer</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Melden Sie sich frühzeitig für Touren an</li>
              <li>Lesen Sie die Tour-Beschreibung sorgfältig durch</li>
              <li>Überprüfen Sie, ob Sie die nötige Ausrüstung und Erfahrung haben</li>
              <li>Nutzen Sie den Chat für Fragen und Koordination</li>
              <li>Melden Sie sich rechtzeitig ab, wenn Sie nicht teilnehmen können</li>
              <li>Halten Sie Ihr Profil aktuell, damit Sie kontaktiert werden können</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Für Admins</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-4 text-sm">
              <li>Überprüfen Sie neue Touren sorgfältig auf Vollständigkeit und Sicherheit</li>
              <li>Geben Sie bei Ablehnungen konstruktive Kommentare</li>
              <li>Verwenden Sie konsistente Schwierigkeitsgrade innerhalb einer Tourenart</li>
              <li>Halten Sie die Einstellungen (Tourentypen, etc.) aktuell und übersichtlich</li>
              <li>Reagieren Sie schnell auf Freigabe-Anfragen</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Unterstützung */}
      <Card>
        <CardHeader>
          <CardTitle>Unterstützung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-600 text-sm leading-relaxed">
            Falls Sie Fragen haben oder Probleme auftreten, wenden Sie sich bitte an einen Administrator
            des Clubs. Diese können Ihnen bei technischen Problemen oder Fragen zur Verwendung der App helfen.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Die App wird kontinuierlich weiterentwickelt. Feedback und Verbesserungsvorschläge sind
            jederzeit willkommen.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Zurück zum Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}

