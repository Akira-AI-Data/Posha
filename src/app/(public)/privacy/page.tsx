import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Posha',
  description: 'Privacy Policy for Posha, including data collection, retention, deletion, sharing, and user choices.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8F6F1] text-[#1A241C]">
      <section className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6F806B]">
          Posha
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-sm text-[#5B665B]">Last updated: May 3, 2026</p>

        <div className="mt-10 space-y-8 text-base leading-7 text-[#334035]">
          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">Overview</h2>
            <p className="mt-3">
              Posha helps users log meals, analyze food photos, plan meals, track nutrition, and create shopping lists.
              This Privacy Policy explains what information Posha accesses, collects, uses, shares, retains, and deletes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">Information We Collect</h2>
            <p className="mt-3">
              We may collect account information such as name, email address, authentication identifiers, and user ID.
              We may collect nutrition and app information that users enter or create, including meals, ingredients,
              servings, calories, protein, carbohydrates, fat, nutrition goals, target weight, family profile details,
              allergies, excluded ingredients, pantry items, shopping-list items, saved recipes, app activity, and
              settings.
            </p>
            <p className="mt-3">
              If users choose to upload or capture photos for meal analysis, we collect those photos long enough to
              process the request and return meal estimates. Posha does not require users to upload photos to use the
              app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">How We Use Information</h2>
            <p className="mt-3">
              We use information to provide app functionality, personalize meal planning, estimate nutrition, generate
              shopping lists, maintain accounts, process subscriptions, prevent abuse, improve reliability, respond to
              support requests, and provide nutrition recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">AI Meal Analysis</h2>
            <p className="mt-3">
              When users upload food photos or meal descriptions, Posha may send that content to an AI provider to
              estimate meal names, ingredients, servings, calories, and nutrients. AI estimates can be uncertain, and
              users should review and edit results before saving. Uploaded photos may be processed by AI service
              providers only for the purpose of providing meal analysis and app functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">Payments</h2>
            <p className="mt-3">
              Payments are handled by third-party payment providers. Posha does not store full card numbers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">Data Sharing</h2>
            <p className="mt-3">
              We share data only with service providers needed to operate Posha, such as authentication, hosting,
              database, analytics, AI processing, and payment providers. These providers process information on our
              behalf to deliver the app. We do not sell personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">Data Retention</h2>
            <p className="mt-3">
              We retain account information and user-created app data for as long as the account remains active or as
              needed to provide Posha. Meal logs, recipes, goals, pantry items, shopping lists, family profiles, and
              settings are retained until the user deletes them, requests deletion, or closes the account.
            </p>
            <p className="mt-3">
              Photos uploaded for AI meal analysis are used to process the analysis request. We do not intentionally
              retain meal photos longer than needed to provide the analysis, troubleshoot failures, protect the service,
              or meet legal obligations. Backup copies and server logs may remain for a limited period as part of normal
              security, reliability, and disaster-recovery operations.
            </p>
            <p className="mt-3">
              We may retain limited records when required for legal, tax, security, fraud-prevention, payment, dispute,
              or compliance reasons. When data is no longer needed, we delete it or de-identify it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">Data Deletion</h2>
            <p className="mt-3">
              Users can delete individual meals, shopping-list items, pantry items, family profiles, and other editable
              records inside the app where those controls are available. Users can request deletion of their account and
              associated personal data at <a href="/delete-account" className="font-semibold underline">Delete Account</a>
              or by emailing rahulpagidi025@gmail.com from the email address connected to their Posha account.
            </p>
            <p className="mt-3">
              After receiving a verified deletion request, we will delete or de-identify personal data within 30 days
              unless we must retain limited information for legal, security, payment, dispute, or compliance purposes.
              Data stored in backups may take additional time to expire through normal backup cycles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">User Choices</h2>
            <p className="mt-3">
              Users can choose what meals, goals, family profile details, and photos they add to Posha. Users can edit or
              delete meal details before and after saving. Users can stop using the app at any time and can request data
              deletion by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">Security</h2>
            <p className="mt-3">
              We use HTTPS and reasonable technical measures to protect information. No internet service can guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">Health Disclaimer</h2>
            <p className="mt-3">
              Posha is for informational nutrition support only. It is not a medical device and does not provide medical
              diagnosis, treatment, or professional medical advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">Contact</h2>
            <p className="mt-3">
              For privacy questions or data deletion requests, contact rahulpagidi025@gmail.com.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
