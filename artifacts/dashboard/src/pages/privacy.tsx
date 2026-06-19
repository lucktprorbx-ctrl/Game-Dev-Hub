export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10 text-sm">Last updated: June 2025</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Introduction</h2>
            <p>RoVerse Dashboard ("we", "our", "us") is a private studio operations tool operated by RoVerseFR. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Data We Collect</h2>
            <p>When you authenticate with Roblox OAuth 2.0, we collect:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Your Roblox user ID</li>
              <li>Your Roblox username and display name</li>
              <li>Your Roblox profile avatar URL</li>
            </ul>
            <p className="mt-2">We do not collect passwords, email addresses, or any financial information.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. How We Use Your Data</h2>
            <p>Your data is used solely to:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Authenticate you and maintain your session</li>
              <li>Display your profile within the dashboard</li>
              <li>Assign your role (Admin or Collaborator) based on your Roblox ID</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Storage</h2>
            <p>Your profile information is stored in a secure PostgreSQL database. Sessions expire after 7 days. We do not share your data with third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Cookies</h2>
            <p>We use a single session cookie (<code className="text-xs bg-muted px-1 py-0.5 rounded">session_id</code>) to keep you logged in. This cookie is strictly necessary for the platform to function. We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Your Rights (GDPR)</h2>
            <p>If you are located in the European Union, you have the right to access, correct, or delete your personal data. To exercise these rights, contact us at the address below.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Access</h2>
            <p>This platform is private and restricted to authorized members of RoVerseFR only. Access is granted exclusively based on your Roblox ID.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
            <p>For any questions regarding this Privacy Policy, please contact the RoVerseFR team via the official Roblox group.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
