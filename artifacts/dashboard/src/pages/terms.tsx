export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10 text-sm">Last updated: June 2025</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance</h2>
            <p>By accessing RoVerse Dashboard, you agree to these Terms of Service. If you do not agree, do not use this platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Eligibility</h2>
            <p>Access is restricted to authorized members of RoVerseFR whose Roblox ID has been approved by an administrator. Unauthorized access is prohibited.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Use of the Platform</h2>
            <p>You agree to use this platform only for its intended purpose: managing RoVerseFR game studio operations. You must not:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Attempt to access accounts or data that are not yours</li>
              <li>Interfere with or disrupt the platform's infrastructure</li>
              <li>Share your session or credentials with unauthorized persons</li>
              <li>Use the platform for any unlawful purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Authentication</h2>
            <p>Authentication is handled via Roblox OAuth 2.0. By logging in, you authorize RoVerse Dashboard to read your basic Roblox profile information (user ID, username, display name, avatar). You may revoke this authorization at any time through your Roblox account settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Intellectual Property</h2>
            <p>All content, data, and assets displayed on this platform belong to RoVerseFR or their respective owners. You may not reproduce or distribute any content without explicit permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Limitation of Liability</h2>
            <p>RoVerse Dashboard is provided "as is" without warranty of any kind. We are not liable for any loss of data, downtime, or damages arising from the use of this platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Modifications</h2>
            <p>We reserve the right to modify these Terms at any time. Continued use of the platform after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Governing Law</h2>
            <p>These Terms are governed by French law and applicable European Union regulations.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Contact</h2>
            <p>For any questions regarding these Terms, contact the RoVerseFR team via the official Roblox group.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
