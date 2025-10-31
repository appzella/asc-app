'use client'

import { useState, useEffect } from 'react'
import { authService } from '@/lib/auth'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

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
    return <div>Lädt...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
          ← Zurück zum Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Hilfe</h1>
        <p className="text-lg text-gray-600">Erfahren Sie, wie Sie die ASC Skitouren App verwenden</p>
      </div>

      {/* Übersicht */}
      <Card>
        <CardHeader>
          <CardTitle>Übersicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Die ASC Skitouren App ist eine Plattform für den Alpinen Skiclub St. Gallen zur Verwaltung
            von Touren, Anmeldungen und Kommunikation zwischen den Mitgliedern. Die App ermöglicht es Ihnen,
            Touren zu erstellen, sich für Touren anzumelden und mit anderen Teilnehmern zu kommunizieren.
          </p>
          <p className="text-gray-600">
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
            <h3 className="font-semibold text-gray-900 mb-2">Touren-Übersicht</h3>
            <p className="text-gray-600 mb-3">
              In der Touren-Übersicht sehen Sie alle verfügbaren Touren des Clubs. Jede Tour-Karte zeigt
              wichtige Informationen auf einen Blick:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
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
            <h3 className="font-semibold text-gray-900 mb-2">Filter und Suche</h3>
            <p className="text-gray-600 mb-3">
              Verwenden Sie die Filterleiste, um Touren nach Ihren Wünschen zu finden:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li><strong>Suche:</strong> Durchsuchen Sie Touren nach Titel oder Beschreibung</li>
              <li><strong>Status:</strong> Filtern Sie nach Ausstehend, Freigegeben oder Abgelehnt (nur für Admins)</li>
              <li><strong>Tourenart:</strong> Zeigen Sie nur bestimmte Tourentypen an</li>
              <li><strong>Tourlänge:</strong> Filtern Sie nach Eintagestour oder Mehrtagestour</li>
              <li><strong>Schwierigkeit:</strong> Wählen Sie eine bestimmte Schwierigkeitsstufe</li>
              <li><strong>Meine Touren:</strong> Zeigen Sie nur Touren an, für die Sie angemeldet sind</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Tour-Details</h3>
            <p className="text-gray-600 mb-3">
              Klicken Sie auf eine Tour-Karte, um die vollständigen Details zu sehen:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Vollständige Beschreibung der Tour</li>
              <li>Alle technischen Details (Datum, Dauer, Höhenmeter, etc.)</li>
              <li>Teilnehmerliste</li>
              <li>Anmeldung/Abmeldung für die Tour</li>
              <li>Chat-Funktion für Kommunikation mit anderen Teilnehmern</li>
              <li>Für Admins: Freigabe- oder Ablehnungsoptionen</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Sortierung</h3>
            <p className="text-gray-600 mb-3">
              Die Touren werden automatisch nach Datum sortiert:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
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
            <h3 className="font-semibold text-gray-900 mb-2">Was ist das Tourenarchiv?</h3>
            <p className="text-gray-600 mb-3">
              Das Tourenarchiv enthält automatisch alle Touren, deren Datum in der Vergangenheit liegt.
              Vergangene Touren werden nicht mehr in der normalen Touren-Übersicht angezeigt, sondern
              automatisch ins Archiv verschoben.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Zugriff auf das Archiv</h3>
            <p className="text-gray-600 mb-3">
              Sie können das Tourenarchiv auf verschiedene Weise erreichen:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Über den <strong>"Archiv"</strong>-Button auf der Touren-Übersichtsseite</li>
              <li>Über die <strong>"Tourenarchiv"</strong>-Card im Dashboard</li>
              <li>Direkt über die URL <code className="bg-gray-100 px-1 rounded">/tours/archive</code></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Archiv-Funktionen</h3>
            <p className="text-gray-600 mb-3">
              Im Archiv haben Sie die gleichen Filter- und Suchfunktionen wie in der normalen Touren-Übersicht:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Suche nach Titel, Beschreibung oder Tourenleiter</li>
              <li>Filter nach Tourenart, Tourlänge und Schwierigkeit</li>
              <li>Filter nach Status (für Admins)</li>
              <li>Option "Nur meine Touren" um nur Ihre vergangenen Touren zu sehen</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Sortierung im Archiv</h3>
            <p className="text-gray-600 mb-3">
              Im Archiv sind die Touren nach Datum sortiert:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Die neuesten vergangenen Touren stehen oben</li>
              <li>Die ältesten Touren stehen ganz unten</li>
              <li>So können Sie schnell die letzten stattgefundenen Touren finden</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Zweck des Archivs</h3>
            <p className="text-gray-600 mb-3">
              Das Archiv dient dazu:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Die Touren-Übersicht übersichtlich zu halten (nur zukünftige Touren)</li>
              <li>Vergangene Touren für Referenzzwecke zu behalten</li>
              <li>Die Historie der Club-Touren einzusehen</li>
              <li>Vergangene Touren nach bestimmten Kriterien zu durchsuchen</li>
              <li>Statistiken über durchgeführte Touren zu erstellen</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Dashboard-Integration</h3>
            <p className="text-gray-600 mb-3">
              Im Dashboard sehen Sie eine Card mit der Anzahl der vergangenen Touren im Archiv.
              Klicken Sie auf <strong>"Archiv öffnen"</strong>, um direkt zum Archiv zu gelangen.
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
            <p className="text-gray-600">
              Als Tourenleiter oder Admin können Sie neue Touren für den Club erstellen. Gehen Sie folgendermaßen vor:
            </p>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Schritt 1: Neue Tour erstellen</h3>
              <p className="text-gray-600 mb-3">
                Klicken Sie auf <strong>"Tour erstellen"</strong> in der Navigation oder auf den Button
                in der Touren-Übersicht.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Schritt 2: Tour-Details eingeben</h3>
              <p className="text-gray-600 mb-3">Füllen Sie alle erforderlichen Felder aus:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                <li><strong>Titel:</strong> Ein aussagekräftiger Name für die Tour</li>
                <li><strong>Beschreibung:</strong> Detaillierte Beschreibung der Route, des Schwierigkeitsgrads, der Ausrüstung, etc.</li>
                <li><strong>Datum:</strong> Das geplante Datum der Tour</li>
                <li><strong>Tourenart:</strong> Wählen Sie zwischen Wanderung, Skitour oder Bike</li>
                <li><strong>Tourlänge:</strong> Eintagestour oder Mehrtagestour</li>
                <li><strong>Schwierigkeit:</strong> Die Schwierigkeit nach SAC-Skala (abhängig von der Tourenart)</li>
                <li><strong>Höhenmeter:</strong> Die zu überwindenden Höhenmeter</li>
                <li><strong>Dauer:</strong> Geschätzte Dauer in Stunden</li>
                <li><strong>Max. Teilnehmer:</strong> Maximale Anzahl der Teilnehmer</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Schritt 3: Tour speichern</h3>
              <p className="text-gray-600 mb-3">
                Nach dem Klicken auf <strong>"Tour erstellen"</strong> wird die Tour mit dem Status
                <strong>"Ausstehend"</strong> gespeichert. Ein Admin muss die Tour freigeben, bevor
                sich Mitglieder anmelden können.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Tour bearbeiten</h3>
              <p className="text-gray-600 mb-3">
                Sie können Ihre Touren jederzeit bearbeiten, indem Sie auf der Tour-Detailseite auf
                <strong>"Tour bearbeiten"</strong> klicken. Wichtige Hinweise:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                <li>Für noch nicht freigegebene Touren werden Änderungen sofort übernommen</li>
                <li>Für bereits freigegebene Touren müssen Änderungen vom Admin genehmigt werden</li>
                <li>Ausstehende Änderungen werden als "pendingChanges" gespeichert</li>
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
                <h3 className="font-semibold text-gray-900 mb-2">Tour-Freigabe</h3>
                <p className="text-gray-600 mb-3">
                  Als Admin haben Sie die Verantwortung, neue Touren zu überprüfen und freizugeben:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>In der Tour-Detailseite sehen Sie eine Box <strong>"Freigabe erforderlich"</strong></li>
                  <li>Überprüfen Sie alle Tour-Details sorgfältig</li>
                  <li>Klicken Sie auf <strong>"Tour freigeben"</strong>, um die Tour für Anmeldungen freizugeben</li>
                  <li>Oder klicken Sie auf <strong>"Ablehnen"</strong>, um die Tour abzulehnen</li>
                  <li>Bei Ablehnung können Sie einen Kommentar hinzufügen, der dem Tourenleiter den Grund erklärt</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Änderungen genehmigen</h3>
                <p className="text-gray-600 mb-3">
                  Wenn eine bereits freigegebene Tour bearbeitet wird, müssen die Änderungen genehmigt werden:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Die Tour zeigt an, dass ausstehende Änderungen vorhanden sind</li>
                  <li>Sie sehen die aktuellen Werte und die vorgeschlagenen Änderungen</li>
                  <li>Genehmigen Sie die Änderungen, um sie zu übernehmen</li>
                  <li>Oder lehnen Sie die Änderungen ab</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Benutzerverwaltung</h3>
                <p className="text-gray-600 mb-3">
                  Im Bereich <strong>"Benutzer"</strong> können Sie:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Alle Clubmitglieder einsehen</li>
                  <li>Benutzerrollen ändern (Mitglied, Tourenleiter, Admin)</li>
                  <li>Benutzer aktivieren oder deaktivieren</li>
                  <li>Benutzerprofile einsehen</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Einladungen</h3>
                <p className="text-gray-600 mb-3">
                  Im Bereich <strong>"Einladungen"</strong> können Sie:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
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
              <p className="text-gray-600">
                Im Bereich <strong>"Einstellungen"</strong> können Sie die grundlegenden Konfigurationen
                der App verwalten:
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tourentypen verwalten</h3>
                <p className="text-gray-600 mb-3">
                  Fügen Sie neue Tourentypen hinzu oder entfernen Sie bestehende:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Geben Sie den Namen des neuen Tourentyps ein (z.B. "Klettern", "Hochtour")</li>
                  <li>Klicken Sie auf <strong>"Hinzufügen"</strong></li>
                  <li>Die Reihenfolge kann per Drag & Drop geändert werden</li>
                  <li>Sie können Tourentypen entfernen, die nicht mehr verwendet werden</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tourlängen verwalten</h3>
                <p className="text-gray-600 mb-3">
                  Verwalten Sie die verfügbaren Tourlängen:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Fügen Sie neue Tourlängen hinzu (z.B. "Halbtagestour", "Wochentour")</li>
                  <li>Entfernen Sie nicht mehr benötigte Tourlängen</li>
                  <li>Ändern Sie die Reihenfolge per Drag & Drop</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Schwierigkeitsgrade verwalten</h3>
                <p className="text-gray-600 mb-3">
                  Für jeden Tourentyp können Sie eigene Schwierigkeitsgrade definieren:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Wählen Sie zuerst einen Tourentyp aus dem Dropdown</li>
                  <li>Fügen Sie Schwierigkeitsgrade hinzu (z.B. für Skitouren: "L", "WS", "ZS", "S", etc.)</li>
                  <li>Die Reihenfolge bestimmt die Anzeigereihenfolge bei der Tour-Erstellung</li>
                  <li>Sie können die Reihenfolge per Drag & Drop ändern</li>
                  <li>Entfernen Sie nicht mehr benötigte Schwierigkeitsgrade</li>
                </ul>
                <p className="text-gray-600 mt-3">
                  <strong>Hinweis:</strong> Verschiedene Tourentypen verwenden unterschiedliche Skalen:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mt-2">
                  <li><strong>Wanderungen:</strong> T1-T6 (T-Skala)</li>
                  <li><strong>Skitouren:</strong> L, WS, ZS, S, SS, AS, EX (SAC-Skala)</li>
                  <li><strong>Bike:</strong> B1-B5 (vereinfachte Skala)</li>
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
            <h3 className="font-semibold text-gray-900 mb-2">Sich für eine Tour anmelden</h3>
            <p className="text-gray-600 mb-3">
              So melden Sie sich für eine freigegebene Tour an:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 ml-4">
              <li>Öffnen Sie die Tour-Detailseite der gewünschten Tour</li>
              <li>Überprüfen Sie alle Details (Datum, Schwierigkeit, Teilnehmerzahl)</li>
              <li>Klicken Sie auf den Button <strong>"Anmelden"</strong> in der Seitenleiste</li>
              <li>Sie sehen nun den Status "Sie sind angemeldet"</li>
              <li>Die Teilnehmerzahl wird aktualisiert</li>
            </ol>
            <p className="text-gray-600 mt-3">
              <strong>Hinweis:</strong> Sie können sich nur für freigegebene Touren anmelden, die noch
              nicht ausgebucht sind. Admins können sich nicht für Touren anmelden.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Von einer Tour abmelden</h3>
            <p className="text-gray-600 mb-3">
              Falls Sie Ihre Teilnahme absagen müssen:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 ml-4">
              <li>Öffnen Sie die Tour-Detailseite</li>
              <li>Klicken Sie auf den Button <strong>"Abmelden"</strong></li>
              <li>Sie werden aus der Teilnehmerliste entfernt</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Teilnehmerliste</h3>
            <p className="text-gray-600 mb-3">
              In der Seitenleiste der Tour-Detailseite sehen Sie:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
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
          <p className="text-gray-600">
            Jede Tour hat einen eigenen Chat-Bereich, in dem sich alle Teilnehmer und Interessierte
            austauschen können.
          </p>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Nachrichten senden</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Geben Sie Ihre Nachricht in das Eingabefeld ein</li>
              <li>Klicken Sie auf <strong>"Senden"</strong> oder drücken Sie Enter</li>
              <li>Ihre Nachricht wird sofort für alle sichtbar</li>
              <li>Jede Nachricht zeigt den Namen des Absenders und die Uhrzeit</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Typische Anwendungen</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Fragen zur Tour stellen</li>
              <li>Fahrgemeinschaften organisieren</li>
              <li>Ausrüstung diskutieren</li>
              <li>Wetter- und Schneeverhältnisse besprechen</li>
              <li>Treffpunkt und Zeit absprechen</li>
              <li>Allgemeine Kommunikation zwischen Teilnehmern</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Nachrichten anzeigen</h3>
            <p className="text-gray-600 mb-3">
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
          <p className="text-gray-600">
            In Ihrem Profil können Sie Ihre persönlichen Informationen verwalten. Klicken Sie auf
            Ihren Namen in der oberen Navigation, um zum Profil zu gelangen.
          </p>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Profilfoto</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Laden Sie ein Profilfoto hoch (max. 5MB, JPG, PNG oder GIF)</li>
              <li>Klicken Sie auf <strong>"Hochladen"</strong> oder <strong>"Ändern"</strong></li>
              <li>Wählen Sie ein Bild von Ihrem Gerät aus</li>
              <li>Das Bild wird sofort als Profilfoto verwendet</li>
              <li>Sie können das Profilfoto jederzeit entfernen</li>
              <li>Ohne Profilfoto wird der erste Buchstabe Ihres Namens angezeigt</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Persönliche Informationen</h3>
            <p className="text-gray-600 mb-3">Sie können folgende Informationen bearbeiten:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li><strong>Name:</strong> Ihr vollständiger Name</li>
              <li><strong>E-Mail:</strong> Ihre E-Mail-Adresse (kann nicht geändert werden)</li>
              <li><strong>Telefon (Festnetz):</strong> Ihre Festnetznummer</li>
              <li><strong>Mobile:</strong> Ihre Mobiltelefonnummer</li>
              <li><strong>Adresse:</strong> Strasse, PLZ und Ort</li>
            </ul>
            <p className="text-gray-600 mt-3">
              Klicken Sie auf <strong>"Änderungen speichern"</strong>, um Ihre Daten zu aktualisieren.
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
            <h3 className="font-semibold text-gray-900 mb-2">Mitglied (Member)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Touren ansehen und durchsuchen</li>
              <li>Sich für freigegebene Touren anmelden</li>
              <li>Am Chat teilnehmen</li>
              <li>Profil bearbeiten</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Tourenleiter (Leader)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Alle Funktionen eines Mitglieds</li>
              <li>Neue Touren erstellen</li>
              <li>Eigene Touren bearbeiten</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Administrator (Admin)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
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
            <h3 className="font-semibold text-gray-900 mb-2">Für Tourenleiter</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Erstellen Sie Touren rechtzeitig, damit Admins Zeit zur Freigabe haben</li>
              <li>Geben Sie detaillierte Beschreibungen mit allen wichtigen Informationen</li>
              <li>Wählen Sie realistische Teilnehmerzahlen basierend auf der Schwierigkeit</li>
              <li>Beantworten Sie Fragen im Chat schnell und ausführlich</li>
              <li>Informieren Sie Teilnehmer über Änderungen rechtzeitig</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Für Teilnehmer</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Melden Sie sich frühzeitig für Touren an</li>
              <li>Lesen Sie die Tour-Beschreibung sorgfältig durch</li>
              <li>Überprüfen Sie, ob Sie die nötige Ausrüstung und Erfahrung haben</li>
              <li>Nutzen Sie den Chat für Fragen und Koordination</li>
              <li>Melden Sie sich rechtzeitig ab, wenn Sie nicht teilnehmen können</li>
              <li>Halten Sie Ihr Profil aktuell, damit Sie kontaktiert werden können</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Für Admins</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
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
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Falls Sie Fragen haben oder Probleme auftreten, wenden Sie sich bitte an einen Administrator
            des Clubs. Diese können Ihnen bei technischen Problemen oder Fragen zur Verwendung der App helfen.
          </p>
          <p className="text-gray-600">
            Die App wird kontinuierlich weiterentwickelt. Feedback und Verbesserungsvorschläge sind
            jederzeit willkommen.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center pb-8">
        <Link href="/dashboard">
          <Button variant="primary">
            Zurück zum Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}

