import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const sections = [
  {
    title: '1. Introduction',
    body: 'RoCheck est un outil privé de gestion de studio, opéré par RoVerseFR. Cette politique explique comment nous collectons, utilisons et protégeons vos informations.',
  },
  {
    title: '2. Données collectées',
    body: null,
    list: [
      'Votre identifiant Roblox (User ID)',
      'Votre nom d\'utilisateur et nom d\'affichage Roblox',
      'L\'URL de votre avatar Roblox',
    ],
    note: 'Nous ne collectons ni mot de passe, ni adresse e-mail, ni information financière.',
  },
  {
    title: '3. Utilisation des données',
    body: null,
    list: [
      'Vous authentifier et maintenir votre session',
      'Afficher votre profil dans le tableau de bord',
      'Attribuer votre rôle (Admin ou Collaborateur) en fonction de votre ID Roblox',
    ],
  },
  {
    title: '4. Stockage des données',
    body: 'Vos informations de profil sont stockées dans une base de données PostgreSQL sécurisée. Les sessions expirent après 7 jours. Vos données ne sont pas partagées avec des tiers.',
  },
  {
    title: '5. Cookies',
    body: null,
    cookieNote: true,
  },
  {
    title: '6. Vos droits (RGPD)',
    body: 'Si vous résidez dans l\'Union Européenne, vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez l\'équipe RoVerseFR via le groupe Roblox officiel.',
  },
  {
    title: '7. Accès',
    body: 'Cette plateforme est privée et réservée exclusivement aux membres autorisés de RoVerseFR. L\'accès est accordé uniquement en fonction de votre ID Roblox.',
  },
  {
    title: '8. Contact',
    body: 'Pour toute question relative à cette politique de confidentialité, contactez l\'équipe RoVerseFR via le groupe Roblox officiel.',
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Link href="/">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-8">
            <ArrowLeft className="w-4 h-4" /> Retour au dashboard
          </span>
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-1">Politique de confidentialité</h1>
        <p className="text-muted-foreground mb-8 text-sm">Dernière mise à jour : juin 2025</p>

        <div className="space-y-3">
          {sections.map((s) => (
            <Card key={s.title}>
              <CardContent className="p-5 space-y-2">
                <h2 className="text-sm font-semibold text-foreground">{s.title}</h2>
                {s.body && <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>}
                {s.list && (
                  <>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-sm text-muted-foreground">
                      {s.list.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    {s.note && <p className="text-sm text-muted-foreground">{s.note}</p>}
                  </>
                )}
                {s.cookieNote && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Nous utilisons un unique cookie de session (
                    <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">session_id</code>
                    ) pour maintenir votre connexion. Ce cookie est strictement nécessaire au fonctionnement de la plateforme.
                    Nous n'utilisons aucun cookie publicitaire ou de tracking.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/40 text-center mt-10">
          RoVerseFR · RoCheck Dashboard
        </p>
      </div>
    </div>
  );
}
