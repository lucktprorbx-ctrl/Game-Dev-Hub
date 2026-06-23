import { Link } from 'wouter';
import { ArrowLeft, Shield, Database, Cookie, UserCheck, Mail, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const sectionsEn = [
  {
    icon: Shield,
    title: '1. Introduction',
    body: 'RoCheck is a private studio management tool operated by RoVerseFR. This policy explains how we collect, use and protect your information when you use this platform.',
  },
  {
    icon: Database,
    title: '2. Data Collected',
    list: [
      'Your Roblox User ID',
      'Your Roblox username and display name',
      'Your Roblox avatar URL',
      'Your Discord username (optional, if provided by an admin)',
    ],
    note: 'We do not collect passwords, email addresses, or financial information.',
  },
  {
    icon: UserCheck,
    title: '3. Use of Data',
    list: [
      'Authenticate you and maintain your session',
      'Display your profile in the dashboard',
      'Assign your role (Admin or Collaborator) based on your Roblox ID',
      'Allow team coordination features (planning boards, calendar, notes)',
    ],
  },
  {
    icon: Lock,
    title: '4. Data Storage',
    body: 'Your profile information is stored in a secure PostgreSQL database. Sessions expire after 7 days. Your data is not shared with third parties.',
  },
  {
    icon: Cookie,
    title: '5. Cookies',
    cookieNote: true,
  },
  {
    icon: UserCheck,
    title: '6. Your Rights (GDPR)',
    body: 'If you reside in the European Union, you have the right to access, rectify and delete your personal data. To exercise these rights, contact the RoVerseFR team via the official Roblox group.',
  },
  {
    icon: Lock,
    title: '7. Access',
    body: 'This platform is private and exclusively reserved for authorised members of RoVerseFR. Access is granted solely based on your Roblox ID being pre-approved by an admin.',
  },
  {
    icon: Mail,
    title: '8. Contact',
    body: 'For any questions regarding this privacy policy, contact the RoVerseFR team via the official Roblox group.',
  },
];

const sectionsFr = [
  {
    icon: Shield,
    title: '1. Introduction',
    body: 'RoCheck est un outil privé de gestion de studio, opéré par RoVerseFR. Cette politique explique comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez cette plateforme.',
  },
  {
    icon: Database,
    title: '2. Données collectées',
    list: [
      'Votre identifiant Roblox (User ID)',
      'Votre nom d\'utilisateur et nom d\'affichage Roblox',
      'L\'URL de votre avatar Roblox',
      'Votre nom d\'utilisateur Discord (optionnel, si renseigné par un admin)',
    ],
    note: 'Nous ne collectons ni mot de passe, ni adresse e-mail, ni information financière.',
  },
  {
    icon: UserCheck,
    title: '3. Utilisation des données',
    list: [
      'Vous authentifier et maintenir votre session',
      'Afficher votre profil dans le tableau de bord',
      'Attribuer votre rôle (Admin ou Collaborateur) en fonction de votre ID Roblox',
      'Permettre les fonctionnalités de coordination d\'équipe (tableaux, calendrier, notes)',
    ],
  },
  {
    icon: Lock,
    title: '4. Stockage des données',
    body: 'Vos informations de profil sont stockées dans une base de données PostgreSQL sécurisée. Les sessions expirent après 7 jours. Vos données ne sont pas partagées avec des tiers.',
  },
  {
    icon: Cookie,
    title: '5. Cookies',
    cookieNote: true,
  },
  {
    icon: UserCheck,
    title: '6. Vos droits (RGPD)',
    body: 'Si vous résidez dans l\'Union Européenne, vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez l\'équipe RoVerseFR via le groupe Roblox officiel.',
  },
  {
    icon: Lock,
    title: '7. Accès',
    body: 'Cette plateforme est privée et réservée exclusivement aux membres autorisés de RoVerseFR. L\'accès est accordé uniquement en fonction de votre ID Roblox pré-approuvé par un admin.',
  },
  {
    icon: Mail,
    title: '8. Contact',
    body: 'Pour toute question relative à cette politique de confidentialité, contactez l\'équipe RoVerseFR via le groupe Roblox officiel.',
  },
];

export default function Privacy() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const sections = isFr ? sectionsFr : sectionsEn;
  const backLabel = isFr ? 'Retour au dashboard' : 'Back to dashboard';
  const title = isFr ? 'Politique de confidentialité' : 'Privacy Policy';
  const updated = isFr ? 'Dernière mise à jour : juin 2025' : 'Last updated: June 2025';
  const cookieLabelFr = 'Nous utilisons un unique cookie de session';
  const cookieLabelEn = 'We use a single session cookie';
  const cookieBodyFr = `(session_id) pour maintenir votre connexion. Ce cookie est strictement nécessaire au fonctionnement de la plateforme. Nous n'utilisons aucun cookie publicitaire ou de tracking.`;
  const cookieBodyEn = `(session_id) to maintain your login. This cookie is strictly necessary for the platform to function. We do not use advertising or tracking cookies.`;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Link href="/">
          <motion.span
            whileHover={{ x: -3 }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> {backLabel}
          </motion.span>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground text-sm">{updated}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed border-l-2 border-primary/30 pl-4">
            {isFr
              ? 'RoVerseFR · RoCheck est une plateforme interne privée. Seuls les membres autorisés y ont accès.'
              : 'RoVerseFR · RoCheck is a private internal platform. Only authorised members have access.'}
          </p>
        </div>

        <div className="space-y-3">
          {sections.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
              >
                <Card className="hover:border-border/80 transition-colors">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <h2 className="text-sm font-semibold text-foreground">{s.title}</h2>
                    </div>
                    {s.body && <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>}
                    {s.list && (
                      <>
                        <ul className="space-y-1 ml-1">
                          {s.list.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="w-1 h-1 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                        {s.note && <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mt-2">{s.note}</p>}
                      </>
                    )}
                    {s.cookieNote && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isFr ? cookieLabelFr : cookieLabelEn}{' '}
                        (<code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">session_id</code>)
                        {' '}{isFr ? cookieBodyFr.replace('(session_id) ', '') : cookieBodyEn.replace('(session_id) ', '')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground/40 text-center mt-10">
          RoVerseFR · RoCheck Dashboard
        </p>
      </div>
    </div>
  );
}
