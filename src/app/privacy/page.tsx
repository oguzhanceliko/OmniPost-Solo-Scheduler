import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 sm:p-12 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
      <p className="text-xs text-zinc-400">Last updated: September 2026</p>

      <section className="space-y-3 text-sm text-zinc-300 leading-relaxed">
        <h2 className="text-base font-semibold text-white">1. Information We Collect</h2>
        <p>
          OmniPost Solo Scheduler collects minimal data required to provide scheduling and publishing services. This includes API authentication tokens and media files scheduled by the user.
        </p>

        <h2 className="text-base font-semibold text-white">2. How Information is Used</h2>
        <p>
          Collected information is used exclusively to authenticate API requests and publish authorized video content to platforms specified by the user (such as TikTok, YouTube, and Instagram).
        </p>

        <h2 className="text-base font-semibold text-white">3. Data Retention and Deletion</h2>
        <p>
          Media files uploaded for scheduling are automatically deleted from cloud storage once publication is confirmed. Authentication tokens are securely stored in your private database and can be deleted at any time.
        </p>

        <h2 className="text-base font-semibold text-white">4. Third-Party Sharing</h2>
        <p>
          We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.
        </p>
      </section>
    </div>
  );
}
