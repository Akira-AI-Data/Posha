import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delete Account | Posha',
  description: 'Request deletion of your Posha account and associated app data.',
};

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-[#F8F6F1] text-[#1A241C]">
      <section className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6F806B]">
          Posha
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Delete Account</h1>
        <p className="mt-4 text-base leading-7 text-[#334035]">
          You can request deletion of your Posha account and associated personal data by emailing us from the email
          address connected to your Posha account.
        </p>

        <div className="mt-8 rounded-2xl border border-[#DDD7CC] bg-white p-6">
          <h2 className="text-xl font-semibold">How to request deletion</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-[#334035]">
            <li>Email rahulpagidi025@gmail.com from your Posha account email address.</li>
            <li>Use the subject line: Delete my Posha account.</li>
            <li>Include the email address connected to your Posha account.</li>
          </ol>
          <a
            href="mailto:rahulpagidi025@gmail.com?subject=Delete%20my%20Posha%20account"
            className="mt-6 inline-flex rounded-xl bg-[#1E3F20] px-5 py-3 text-sm font-semibold text-white"
          >
            Request deletion by email
          </a>
        </div>

        <div className="mt-8 space-y-6 text-base leading-7 text-[#334035]">
          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">What will be deleted</h2>
            <p className="mt-3">
              After verification, we delete or de-identify account information, meal logs, nutrition goals, family
              profiles, allergies, excluded ingredients, pantry items, shopping lists, saved recipes, settings, and other
              personal app data associated with your Posha account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">How long deletion takes</h2>
            <p className="mt-3">
              Verified deletion requests are completed within 30 days unless we must retain limited information for
              legal, security, fraud-prevention, payment, dispute, tax, or compliance reasons. Backup copies may take
              additional time to expire through normal backup cycles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A241C]">More privacy details</h2>
            <p className="mt-3">
              Read the full <a href="/privacy" className="font-semibold underline">Posha Privacy Policy</a> for more
              information about collection, use, sharing, retention, and deletion.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
