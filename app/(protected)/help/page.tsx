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
            className="hidden sm:inline-flex items-center gap-1 text-primary-600"
          >
            <Link href="/dashboard">
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Zurück zum Dashboard
            </Link>
          </Button>
        </div>
        <h1>Hilfe</h1>
        <p className="text-muted-foreground mt-4">Erfahre, wie du die ASC Skitouren App verwendest</p>
      </div>

      {/* Übersicht */}
      <Card>
        <CardHeader>
          <CardTitle>Übersicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            Die ASC Skitouren App ist eine Plattform für den Alpinen Skiclub St. Gallen zur Verwaltung
            von Touren, Anmeldungen und Kommunikation zwischen den Mitgliedern. Die App ermöglicht es dir,
            Touren zu durchsuchen, dich für Touren anzumelden und mit anderen Teilnehmern zu kommunizieren.
          </p>
          <p className="text-muted-foreground">
            Je nach deiner Rolle (Mitglied, Tourenleiter oder Admin) stehen dir unterschiedliche Funktionen
            zur Verfügung. Diese Hilfe-Seite erklärt alle verfügbaren Funktionen basierend auf deiner Rolle.
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
            <h4>Touren-Übersicht</h4>
            <p className="text-muted-foreground">
              In der Touren-Übersicht siehst du alle verfügbaren Touren des Clubs. Jede Tour-Karte zeigt
              wichtige Informationen auf einen Blick:
            </p>
            <ul className="text-muted-foreground">
              <li>Titel und Beschreibung der Tour</li>
              <li>Datum und Dauer</li>
              <li>Tourenart (Wanderung, Skitour, Bike, etc.)</li>
              <li>Tourlänge (Eintagestour, Mehrtagestour, etc.)</li>
              <li>Schwierigkeitsgrad nach SAC-Skala</li>
              <li>Höhenmeter</li>
              <li>Anzahl der angemeldeten Teilnehmer</li>
              <li>Status (Entwurf, Veröffentlicht, Abgesagt)</li>
            </ul>
          </div>

          <div>
            <h4>Filter und Suche</h4>
            <p className="text-muted-foreground">
              Verwende die Filterleiste, um Touren nach deinen Wünschen zu finden:
            </p>
            <ul className="text-muted-foreground">
              <li><strong className="font-semibold">Suche:</strong> Durchsuche Touren nach Titel oder Beschreibung</li>
              <li><strong className="font-semibold">Status:</strong> Filtere nach Entwurf, Veröffentlicht oder Abgesagt (nur für Admins und Tourenleiter)</li>
              <li><strong className="font-semibold">Tourenart:</strong> Zeige nur bestimmte Tourentypen an</li>
              <li><strong className="font-semibold">Tourlänge:</strong> Filtere nach Eintagestour, Mehrtagestour, etc.</li>
              <li><strong className="font-semibold">Schwierigkeit:</strong> Wähle eine bestimmte Schwierigkeitsstufe</li>
              <li><strong className="font-semibold">Meine Touren:</strong> Zeige nur Touren an, für die du angemeldet bist oder die du leitest</li>
            </ul>
          </div>

          <div>
            <h4>Tour-Details</h4>
            <p className="text-muted-foreground">
              Klicke auf eine Tour-Karte, um die vollständigen Details zu sehen:
            </p>
            <ul className="text-muted-foreground">
              <li>Vollständige Beschreibung der Tour</li>
              <li>Alle technischen Details (Datum, Dauer, Höhenmeter, etc.)</li>
              <li>Teilnehmerliste mit Profilfotos</li>
              <li>Anmeldung/Abmeldung für die Tour</li>
              <li>Interaktive Karte (wenn GPX-Datei vorhanden)</li>
              <li>Link zur WhatsApp-Gruppe (optional)</li>
              <li>Für Tourenleiter: Tour bearbeiten, auf Entwurf setzen oder Tour absagen</li>
              <li>Für Admins: Tour freigeben oder ablehnen</li>
            </ul>
          </div>

          <div>
            <h4>Sortierung</h4>
            <p className="text-muted-foreground">
              Die Touren werden automatisch nach Datum sortiert:
            </p>
            <ul className="text-muted-foreground">
              <li>Die nächste stattfindende Tour steht immer ganz oben</li>
              <li>Die Touren sind aufsteigend nach Datum sortiert</li>
              <li>So findest du schnell die nächsten verfügbaren Touren</li>
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
            <h4>Was ist das Tourenarchiv?</h4>
            <p className="text-muted-foreground">
              Das Tourenarchiv enthält automatisch alle Touren, deren Datum in der Vergangenheit liegt.
              Vergangene Touren werden nicht mehr in der normalen Touren-Übersicht angezeigt, sondern
              automatisch ins Archiv verschoben.
            </p>
          </div>

          <div>
            <h4>Zugriff auf das Archiv</h4>
            <p className="text-muted-foreground">
              Du kannst das Tourenarchiv auf verschiedene Weise erreichen:
            </p>
            <ul className="text-muted-foreground">
              <li>Über den <strong className="font-semibold">&quot;Archiv&quot;</strong>-Button auf der Touren-Übersichtsseite</li>
              <li>Über die <strong className="font-semibold">&quot;Tourenarchiv&quot;</strong>-Card im Dashboard</li>
              <li>Direkt über die URL <code className="bg-muted px-1.5 py-0.5 rounded-md text-xs font-mono">/tours/archive</code></li>
            </ul>
          </div>

          <div>
            <h4>Archiv-Funktionen</h4>
            <p className="text-muted-foreground">
              Im Archiv hast du die gleichen Filter- und Suchfunktionen wie in der normalen Touren-Übersicht:
            </p>
            <ul className="text-muted-foreground">
              <li>Suche nach Titel, Beschreibung oder Tourenleiter</li>
              <li>Filter nach Tourenart, Tourlänge und Schwierigkeit</li>
              <li>Filter nach Status (für Admins)</li>
              <li>Option &quot;Nur meine Touren&quot; um nur deine vergangenen Touren zu sehen</li>
            </ul>
          </div>

          <div>
            <h4>Sortierung im Archiv</h4>
            <p className="text-muted-foreground">
              Im Archiv sind die Touren nach Datum sortiert:
            </p>
            <ul className="text-muted-foreground">
              <li>Die neuesten vergangenen Touren stehen oben</li>
              <li>Die ältesten Touren stehen ganz unten</li>
              <li>So kannst du schnell die letzten stattgefundenen Touren finden</li>
            </ul>
          </div>

          <div>
            <h4>Zweck des Archivs</h4>
            <p className="text-muted-foreground">
              Das Archiv dient dazu:
            </p>
            <ul className="text-muted-foreground">
              <li>Die Touren-Übersicht übersichtlich zu halten (nur zukünftige Touren)</li>
              <li>Vergangene Touren für Referenzzwecke zu behalten</li>
              <li>Die Historie der Club-Touren einzusehen</li>
              <li>Vergangene Touren nach bestimmten Kriterien zu durchsuchen</li>
              <li>Statistiken über durchgeführte Touren zu erstellen</li>
            </ul>
          </div>

          <div>
            <h4>Dashboard-Integration</h4>
            <p className="text-muted-foreground">
              Im Dashboard siehst du eine Card mit der Anzahl der vergangenen Touren im Archiv.
              Klicke auf <strong className="font-semibold">&quot;Archiv öffnen&quot;</strong>, um direkt zum Archiv zu gelangen.
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
            <p className="text-muted-foreground">
              Als Tourenleiter oder Admin kannst du neue Touren für den Club erstellen. Gehe folgendermaßen vor:
            </p>

            <div>
              <h4>Schritt 1: Neue Tour erstellen</h4>
              <p className="text-muted-foreground">
                Klicke auf <strong className="font-semibold">&quot;Tour erstellen&quot;</strong> in der Navigation oder auf den Button
                in der Touren-Übersicht.
              </p>
            </div>

            <div>
              <h4>Schritt 2: Tour-Details eingeben</h4>
              <p className="text-muted-foreground">Fülle alle erforderlichen Felder aus:</p>
              <ul className="text-muted-foreground">
                <li><strong className="font-semibold">Titel:</strong> Ein aussagekräftiger Name für die Tour</li>
                <li><strong className="font-semibold">Beschreibung:</strong> Detaillierte Beschreibung der Route, des Schwierigkeitsgrads, der Ausrüstung, etc.</li>
                <li><strong className="font-semibold">Datum:</strong> Das geplante Datum der Tour</li>
                <li><strong className="font-semibold">Tourenart:</strong> Wähle zwischen Wanderung, Skitour oder Bike</li>
                <li><strong className="font-semibold">Tourlänge:</strong> Eintagestour oder Mehrtagestour</li>
                <li><strong className="font-semibold">Schwierigkeit:</strong> Die Schwierigkeit nach SAC-Skala (abhängig von der Tourenart)</li>
                <li><strong className="font-semibold">Höhenmeter:</strong> Die zu überwindenden Höhenmeter</li>
                <li><strong className="font-semibold">Dauer:</strong> Geschätzte Dauer in Stunden</li>
                <li><strong className="font-semibold">Max. Teilnehmer:</strong> Maximale Anzahl der Teilnehmer</li>
              </ul>
            </div>

            <div>
              <h4>Schritt 3: Tour speichern</h4>
              <p className="text-muted-foreground">
                Nach dem Klicken auf <strong className="font-semibold">&quot;Tour erstellen&quot;</strong> wird die Tour mit dem Status
                <strong className="font-semibold">&quot;Entwurf&quot;</strong> gespeichert. Du kannst die Tour später für die Freigabe einreichen.
                Ein Admin muss die Tour freigeben, bevor sich Mitglieder anmelden können.
              </p>
            </div>

            <div>
              <h4>Tour bearbeiten</h4>
              <p className="text-muted-foreground">
                Du kannst deine Touren jederzeit bearbeiten, indem du auf der Tour-Detailseite auf
                <strong className="font-semibold">&quot;Tour bearbeiten&quot;</strong> klickst. Wichtige Hinweise:
              </p>
              <ul className="text-muted-foreground">
                <li>Entwürfe können jederzeit bearbeitet werden</li>
                <li>Veröffentlichte Touren können bearbeitet werden, Änderungen müssen vom Admin genehmigt werden</li>
                <li>Du kannst eine Tour auch &quot;Auf Entwurf setzen&quot; oder &quot;Tour absagen&quot;</li>
                <li>Abgesagte Touren können wieder aktiviert werden</li>
              </ul>
            </div>

            <div>
              <h4>Tour zur Freigabe einreichen</h4>
              <p className="text-muted-foreground">
                Sobald deine Tour fertig ist, kannst du sie zur Freigabe einreichen:
              </p>
              <ul className="text-muted-foreground">
                <li>Klicke auf <strong className="font-semibold">&quot;Zur Freigabe einreichen&quot;</strong></li>
                <li>Die Tour wird im Status &quot;Zur Freigabe eingereicht&quot; angezeigt</li>
                <li>Ein Admin kann die Tour nun freigeben oder ablehnen</li>
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
                <h4>Tour-Freigabe</h4>
                <p className="text-muted-foreground">
                  Als Admin hast du die Verantwortung, neue Touren zu überprüfen und freizugeben:
                </p>
                <ul className="text-muted-foreground">
                  <li>In der Touren-Übersicht siehst du Touren mit Status &quot;Zur Freigabe eingereicht&quot;</li>
                  <li>Öffne die Tour-Detailseite und überprüfe alle Tour-Details sorgfältig</li>
                  <li>Klicke auf <strong className="font-semibold">&quot;Tour freigeben&quot;</strong>, um die Tour für Anmeldungen freizugeben</li>
                  <li>Oder klicke auf <strong className="font-semibold">&quot;Tour ablehnen&quot;</strong>, um die Tour abzulehnen</li>
                  <li>Bei Ablehnung wird die Tour auf Entwurf zurückgesetzt</li>
                </ul>
              </div>

              <div>
                <h4>Änderungen genehmigen</h4>
                <p className="text-muted-foreground">
                  Wenn eine bereits freigegebene Tour bearbeitet wird, müssen die Änderungen genehmigt werden:
                </p>
                <ul className="text-muted-foreground">
                  <li>Die Tour zeigt an, dass ausstehende Änderungen vorhanden sind</li>
                  <li>Du siehst die aktuellen Werte und die vorgeschlagenen Änderungen</li>
                  <li>Genehmige die Änderungen, um sie zu übernehmen</li>
                  <li>Oder lehne die Änderungen ab</li>
                </ul>
              </div>

              <div>
                <h4>Benutzerverwaltung</h4>
                <p className="text-muted-foreground">
                  Im Bereich <strong className="font-semibold">&quot;Benutzer&quot;</strong> kannst du:
                </p>
                <ul className="text-muted-foreground">
                  <li>Alle Clubmitglieder einsehen</li>
                  <li>Benutzerrollen ändern (Mitglied, Tourenleiter, Admin)</li>
                  <li>Benutzer aktivieren oder deaktivieren</li>
                  <li>Benutzerprofile einsehen</li>
                </ul>
              </div>

              <div>
                <h4>Einladungen</h4>
                <p className="text-muted-foreground">
                  Im Bereich <strong className="font-semibold">&quot;Einladungen&quot;</strong> kannst du:
                </p>
                <ul className="text-muted-foreground">
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
              <p className="text-muted-foreground">
                Im Bereich <strong className="font-semibold">&quot;Einstellungen&quot;</strong> kannst du die grundlegenden Konfigurationen
                der App verwalten:
              </p>

              <div>
                <h4>Tourentypen verwalten</h4>
                <p className="text-muted-foreground">
                  Füge neue Tourentypen hinzu oder entferne bestehende:
                </p>
                <ul className="text-muted-foreground">
                  <li>Gib den Namen des neuen Tourentyps ein (z.B. &quot;Klettern&quot;, &quot;Hochtour&quot;)</li>
                  <li>Klicke auf <strong className="font-semibold">&quot;Hinzufügen&quot;</strong></li>
                  <li>Die Reihenfolge kann per Drag & Drop geändert werden</li>
                  <li>Du kannst Tourentypen entfernen, die nicht mehr verwendet werden</li>
                </ul>
              </div>

              <div>
                <h4>Tourlängen verwalten</h4>
                <p className="text-muted-foreground">
                  Verwalte die verfügbaren Tourlängen:
                </p>
                <ul className="text-muted-foreground">
                  <li>Füge neue Tourlängen hinzu (z.B. &quot;Halbtagestour&quot;, &quot;Wochentour&quot;)</li>
                  <li>Entferne nicht mehr benötigte Tourlängen</li>
                  <li>Ändere die Reihenfolge per Drag & Drop</li>
                </ul>
              </div>

              <div>
                <h4>Schwierigkeitsgrade verwalten</h4>
                <p className="text-muted-foreground">
                  Für jeden Tourentyp kannst du eigene Schwierigkeitsgrade definieren:
                </p>
                <ul className="text-muted-foreground">
                  <li>Wähle zuerst einen Tourentyp aus dem Dropdown</li>
                  <li>Füge Schwierigkeitsgrade hinzu (z.B. für Skitouren: &quot;L&quot;, &quot;WS&quot;, &quot;ZS&quot;, &quot;S&quot;, etc.)</li>
                  <li>Die Reihenfolge bestimmt die Anzeigereihenfolge bei der Tour-Erstellung</li>
                  <li>Du kannst die Reihenfolge per Drag & Drop ändern</li>
                  <li>Entferne nicht mehr benötigte Schwierigkeitsgrade</li>
                </ul>
                <p className="text-muted-foreground mt-3">
                  <strong className="font-semibold">Hinweis:</strong> Verschiedene Tourentypen verwenden unterschiedliche Skalen:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-muted-foreground ml-4 mt-2">
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
            <h4>Für eine Tour anmelden</h4>
            <p className="text-muted-foreground">
              So meldest du dich für eine freigegebene Tour an:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground ml-4">
              <li>Öffne die Tour-Detailseite der gewünschten Tour</li>
              <li>Überprüfe alle Details (Datum, Schwierigkeit, Teilnehmerzahl)</li>
              <li>Klicke auf den Button <strong className="font-semibold">&quot;Anmelden&quot;</strong> in der Seitenleiste</li>
              <li>Du siehst nun den Status &quot;Du bist angemeldet&quot;</li>
              <li>Die Teilnehmerzahl wird aktualisiert</li>
            </ol>
            <p className="text-muted-foreground mt-3">
              <strong className="font-semibold">Hinweis:</strong> Du kannst dich nur für veröffentlichte Touren anmelden.
              Tourenleiter und Admins können sich ebenfalls für Touren anmelden.
            </p>
          </div>

          <div>
            <h4>Warteliste</h4>
            <p className="text-muted-foreground">
              Ist eine Tour bereits ausgebucht, kannst du dich auf die Warteliste setzen lassen:
            </p>
            <ul className="text-muted-foreground">
              <li>Klicke auf <strong className="font-semibold">&quot;Auf Warteliste&quot;</strong></li>
              <li>Sobald ein Platz frei wird (z.B. durch Abmeldung eines Teilnehmers), rücken Personen von der Warteliste automatisch nach</li>
              <li>Du wirst per E-Mail informiert, wenn du einen Platz erhalten hast</li>
            </ul>
          </div>

          <div>
            <h4>Von einer Tour abmelden</h4>
            <p className="text-muted-foreground">
              Falls du deine Teilnahme absagen musst:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground ml-4">
              <li>Öffne die Tour-Detailseite</li>
              <li>Klicke auf den Button <strong className="font-semibold">&quot;Abmelden&quot;</strong></li>
              <li>Du wirst aus der Teilnehmerliste entfernt</li>
            </ol>
          </div>

          <div>
            <h4>Teilnehmerliste</h4>
            <p className="text-muted-foreground">
              In der Seitenleiste der Tour-Detailseite siehst du:
            </p>
            <ul className="text-muted-foreground">
              <li>Eine Liste aller angemeldeten Teilnehmer</li>
              <li>Einen Fortschrittsbalken mit der Anzahl der belegten Plätze</li>
              <li>Deinen eigenen Anmeldestatus</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Kommunikation & Karte */}
      <Card>
        <CardHeader>
          <CardTitle>Kommunikation & Karte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4>WhatsApp-Gruppe</h4>
            <p className="text-muted-foreground">
              Für die Kommunikation zwischen den Teilnehmern kann der Tourenleiter optional einen Link zu einer WhatsApp-Gruppe hinterlegen:
            </p>
            <ul className="text-muted-foreground">
              <li>Der Link ist auf der Tour-Detailseite sichtbar (für angemeldete Teilnehmer)</li>
              <li>Nach der Anmeldung zur Tour wird dir der Beitritt zur Gruppe vorgeschlagen</li>
              <li>Hier können Fahrgemeinschaften gebildet und Details besprochen werden</li>
            </ul>
          </div>

          <div>
            <h4>Interaktive Karte</h4>
            <p className="text-muted-foreground">
              Wenn für die Tour eine GPX-Datei hochgeladen wurde, wird eine interaktive Karte angezeigt:
            </p>
            <ul className="text-muted-foreground">
              <li>Die Route wird auf der Karte visualisiert</li>
              <li>Du kannst in die Karte hinein- und herauszoomen</li>
              <li>Start- und Endpunkt sowie das Höhenprofil sind ersichtlich</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            In deinem Profil kannst du deine persönlichen Informationen verwalten. Klicke auf
            deinen Namen in der oberen Navigation, um zum Profil zu gelangen.
          </p>

          <div>
            <h4>Profilfoto</h4>
            <ul className="text-muted-foreground">
              <li>Lade ein Profilfoto hoch (max. 5MB, JPG, PNG oder GIF)</li>
              <li>Klicke auf <strong className="font-semibold">&quot;Hochladen&quot;</strong> oder <strong className="font-semibold">&quot;Ändern&quot;</strong></li>
              <li>Wähle ein Bild von deinem Gerät aus</li>
              <li>Das Bild wird sofort als Profilfoto verwendet</li>
              <li>Du kannst das Profilfoto jederzeit entfernen</li>
              <li>Ohne Profilfoto wird der erste Buchstabe deines Namens angezeigt</li>
            </ul>
          </div>

          <div>
            <h4>Persönliche Informationen</h4>
            <p className="text-muted-foreground">Du kannst folgende Informationen bearbeiten:</p>
            <ul className="text-muted-foreground">
              <li><strong className="font-semibold">Name:</strong> Dein vollständiger Name</li>
              <li><strong className="font-semibold">E-Mail:</strong> Deine E-Mail-Adresse (kann nicht geändert werden)</li>
              <li><strong className="font-semibold">Telefon (Festnetz):</strong> Deine Festnetznummer</li>
              <li><strong className="font-semibold">Mobile:</strong> Deine Mobiltelefonnummer</li>
              <li><strong className="font-semibold">Adresse:</strong> Strasse, PLZ und Ort</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Klicke auf <strong className="font-semibold">&quot;Änderungen speichern&quot;</strong>, um deine Daten zu aktualisieren.
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
            <h4>Mitglied (Member)</h4>
            <ul className="text-muted-foreground">
              <li>Touren ansehen und durchsuchen</li>
              <li>Dich für freigegebene Touren anmelden</li>
              <li>Profil bearbeiten</li>
            </ul>
          </div>

          <div>
            <h4>Tourenleiter (Leader)</h4>
            <ul className="text-muted-foreground">
              <li>Alle Funktionen eines Mitglieds</li>
              <li>Neue Touren erstellen</li>
              <li>Eigene Touren bearbeiten</li>
              <li>Teilnehmer manuell hinzufügen (auch überbuchen möglich)</li>
            </ul>
          </div>

          <div>
            <h4>Administrator (Admin)</h4>
            <ul className="text-muted-foreground">
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
            <h4>Für Tourenleiter</h4>
            <ul className="text-muted-foreground">
              <li>Erstellen Sie Touren rechtzeitig, damit Admins Zeit zur Freigabe haben</li>
              <li>Geben Sie detaillierte Beschreibungen mit allen wichtigen Informationen</li>
              <li>Wählen Sie realistische Teilnehmerzahlen basierend auf der Schwierigkeit</li>
              <li>Erstellen Sie eine WhatsApp-Gruppe für die einfache Koordination</li>
              <li>Informieren Sie Teilnehmer über Änderungen rechtzeitig</li>
            </ul>
          </div>

          <div>
            <h4>Für Teilnehmer</h4>
            <ul className="text-muted-foreground">
              <li>Melden Sie sich frühzeitig für Touren an</li>
              <li>Lesen Sie die Tour-Beschreibung sorgfältig durch</li>
              <li>Überprüfen Sie, ob Sie die nötige Ausrüstung und Erfahrung haben</li>
              <li>Treten Sie der WhatsApp-Gruppe bei, falls vorhanden</li>
              <li>Melden Sie sich rechtzeitig ab, wenn Sie nicht teilnehmen können</li>
              <li>Halten Sie Ihr Profil aktuell, damit Sie kontaktiert werden können</li>
            </ul>
          </div>

          <div>
            <h4>Für Admins</h4>
            <ul className="text-muted-foreground">
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
          <p className="text-muted-foreground">
            Falls Sie Fragen haben oder Probleme auftreten, wenden Sie sich bitte an einen Administrator
            des Clubs. Diese können Ihnen bei technischen Problemen oder Fragen zur Verwendung der App helfen.
          </p>
          <p className="text-muted-foreground">
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

