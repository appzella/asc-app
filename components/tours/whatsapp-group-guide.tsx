'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, MessageCircle } from 'lucide-react'

interface WhatsAppGroupGuideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tourName: string
}

export function WhatsAppGroupGuide({ open, onOpenChange, tourName }: WhatsAppGroupGuideProps) {
  const openWhatsApp = () => {
    // Versuche WhatsApp zu öffnen (funktioniert auf Mobile)
    // Auf Desktop öffnet es WhatsApp Web
    if (typeof window !== 'undefined') {
      window.open('https://wa.me/?text=', '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            WhatsApp-Gruppe erstellen
          </DialogTitle>
          <DialogDescription>
            Schritt-für-Schritt-Anleitung zum Erstellen einer WhatsApp-Gruppe für deine Tour
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">WhatsApp öffnen</h3>
                <p className="text-sm text-muted-foreground">
                  Öffne WhatsApp auf deinem Smartphone oder{' '}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-primary underline"
                    onClick={openWhatsApp}
                  >
                    WhatsApp Web
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Neue Gruppe erstellen</h3>
                <p className="text-sm text-muted-foreground">
                  Tippe auf das <strong>Chat-Symbol</strong> (oben rechts) und wähle{' '}
                  <strong>"Neue Gruppe"</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Gruppenname festlegen</h3>
                <p className="text-sm text-muted-foreground">
                  Gib der Gruppe den Namen: <strong>"{tourName}"</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Mindestens einen Kontakt hinzufügen</h3>
                <p className="text-sm text-muted-foreground">
                  Wähle mindestens einen Kontakt aus (du kannst ihn später wieder entfernen) und
                  tippe auf <strong>"Erstellen"</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                5
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Gruppen-Einstellungen anpassen</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Öffne die Gruppeninformationen (tippe auf den Gruppennamen) und stelle sicher:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>
                    <strong>"Teilnehmer können Nachrichten senden"</strong> ist aktiviert
                  </li>
                  <li>
                    <strong>"Teilnehmer können Info bearbeiten"</strong> ist deaktiviert (optional)
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                6
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Einladungslink erstellen</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  In den Gruppeninformationen:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Scrolle nach unten zu <strong>"Mit Link einladen"</strong></li>
                  <li>Tippe darauf und wähle <strong>"Link kopieren"</strong></li>
                  <li>Füge den kopierten Link in das Feld unten ein</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Hinweis:</strong> Der Link ermöglicht es allen Teilnehmern, der Gruppe
              beizutreten. Du kannst den Link jederzeit in den Gruppeneinstellungen zurücksetzen,
              falls nötig.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

