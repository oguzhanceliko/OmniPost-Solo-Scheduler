import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 sm:p-12 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
      <p className="text-xs text-zinc-400">Last updated: September 2026</p>

      <section className="space-y-3 text-sm text-zinc-300 leading-relaxed">
        <h2 className="text-base font-semibold text-white">1. Acceptance of Terms</h2>
        <p>
          By using OmniPost Solo Scheduler, you agree to comply with and be bound by these Terms of Service.
        </p>

        <h2 className="text-base font-semibold text-white">2. Description of Service</h2>
        <p>
          OmniPost Solo Scheduler is a personal social media management and scheduling application designed to automate the publishing of short-form videos to supported platforms including TikTok, YouTube Shorts, and Instagram Reels.
        </p>

        <h2 className="text-base font-semibold text-white">3. User Responsibility</h2>
        <p>
          Users are solely responsible for the content they upload, schedule, and distribute through this service. All content must comply with the Community Guidelines and Terms of Service of third-party platforms.
        </p>

        <h2 className="text-base font-semibold text-white">4. Termination</h2>
        <p>
          We reserve the right to terminate or restrict access to the service at any time without notice.
        </p>
      </section>
    </div>
  );
}
