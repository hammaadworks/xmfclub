import { createFileRoute } from '@tanstack/react-router'
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Rocket,
  ShieldCheck,
  Star,
  Target,
  Zap,
} from 'lucide-react'

export const Route = createFileRoute('/proposal')({
  component: HWDealPage,
})

function HWDealPage() {
  const corePromises = [
    '1.5x Revenue',
    'Student ID Card System',
    'Tech support for xmfclub events',
    'Online store and affiliate earnings',
    '12+ content collabs',
  ]

  const softPromises = [
    'Help reach 5K IG followers',
    'Make proposals to partner with schools',
    'Help in getting FitIndia (other associate) certificate',
  ]

  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 landscape; 
            margin: 10mm; 
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          /* Forcefully hide any DevTools portals that append to body */
          .tsqd-parent-container,
          [class*="TanStack"],
          [id*="tanstack-"],
          .tsrd-panel,
          iframe,
          #tanstack-router-devtools {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gray-100 text-black font-sans selection:bg-primary/20 selection:text-black print:bg-white print:p-0 p-4 flex flex-col items-center justify-center print:block">
        {/* A4 Landscape container (adjusted for 10mm print margins) */}
        <div className="w-full max-w-[277mm] h-[190mm] max-h-[190mm] bg-white p-6 border-4 border-gray-100 print:border-gray-200 print:border-2 shadow-2xl print:shadow-none relative flex flex-col justify-between overflow-hidden mx-auto print:mx-0">
          {/* Subtle decorative color accents */}
          <div className="absolute top-0 left-0 w-full h-3 brand-gradient opacity-90" />
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

          <div className="relative z-10 flex-1 flex flex-col h-full gap-4">
            {/* Header & Invoice Details */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-xs font-black tracking-widest text-primary mb-2 uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Agreement #01: xmfclub webapp</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight uppercase italic leading-none mb-1.5">
                  <span className="brand-gradient bg-clip-text text-transparent">
                    xmfclub
                  </span>{' '}
                  <span className="text-gray-300">x</span> hammaadworks
                </h1>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
                  Work Details, Terms & Commitments
                </p>
              </div>

              {/* Date Box */}
              <div className="text-right text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm min-w-[150px]">
                <div className="flex items-center justify-end gap-2">
                  <span className="font-bold text-black uppercase tracking-widest text-[10px]">
                    Date:
                  </span>
                  <span className="border-b-2 border-gray-300 inline-block w-40 h-4"></span>
                </div>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-12 gap-4 flex-1">
              {/* Left Column: Terms & Signatures */}
              <div className="col-span-4 flex flex-col gap-4">
                {/* Terms Box */}
                <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Target className="w-20 h-20 text-black" />
                  </div>
                  <h2 className="flex items-center gap-2 text-base font-black uppercase italic mb-4 text-black border-b border-gray-200 pb-2.5 relative z-10">
                    <Target className="w-5 h-5 text-primary" /> Payment Terms
                  </h2>
                  <div className="space-y-3 relative z-10">
                    <div className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-800" />
                      <div className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-0.5 ml-3">
                        Fixed Fee (Retainer)
                      </div>
                      <div className="text-2xl font-black italic mb-0.5 ml-3 text-gray-900">
                        ₹15,000
                      </div>
                      <p className="text-xs text-gray-600 font-medium ml-3 leading-tight">
                        Total for 4 months <br />
                        (Sept, Oct, Nov, Dec 2026).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                      <div className="text-xs font-bold tracking-widest text-primary uppercase mb-0.5 ml-3">
                        Equity Share
                      </div>
                      <div className="text-2xl font-black italic mb-0.5 text-primary-800 ml-3">
                        10% Web Revenue
                      </div>
                      <p className="text-xs text-gray-600 font-medium ml-3 leading-tight">
                        Applies only to web revenue (after tax & expenses).
                        Calculated quarterly (Mar, Jun, Sep, Dec). Starts Nov
                        15, 2026. First payout Dec 1.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Signatures Box */}
                <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 shadow-sm h-[120px] relative overflow-hidden">
                  <div className="grid grid-cols-2 gap-4 h-full relative z-10">
                    <div className="flex flex-col justify-end">
                      <div className="h-6 border-b-2 border-gray-300 mb-2"></div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-gray-800">
                        Hammaad (hammaadworks)
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <div className="h-6 border-b-2 border-primary mb-2"></div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-primary">
                        Master Farhan (XMFCLUB)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column: Core Promises & Soft Promises */}
              <div className="col-span-4 flex flex-col gap-4">
                <div className="bg-gray-900 rounded-3xl p-5 border border-gray-800 shadow-sm flex-1 flex flex-col justify-center text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Rocket className="w-20 h-20 text-white" />
                  </div>
                  <h2 className="flex items-center gap-2 text-base font-black uppercase italic mb-4 text-white border-b border-gray-700 pb-2.5 relative z-10">
                    <Rocket className="w-5 h-5 text-primary" /> Main Work Scope
                  </h2>
                  <div className="space-y-3 relative z-10 mb-5">
                    {corePromises.map((promise, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div className="bg-primary/20 rounded-full p-1 shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-white leading-snug">
                          {promise}
                        </span>
                      </div>
                    ))}
                  </div>

                  <h2 className="flex items-center gap-2 text-sm font-black uppercase italic mb-3 text-gray-200 border-b border-gray-700 pb-2 mt-5 relative z-10">
                    <Star className="w-4 h-4 text-accent" /> Soft Promises
                  </h2>
                  <div className="space-y-2.5 relative z-10">
                    {softPromises.map((promise, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div className="bg-accent/20 rounded-full p-1 shrink-0 mt-0.5">
                          <Zap className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="text-xs font-medium text-gray-300 leading-snug">
                          {promise}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Time Commitment & Momentum */}
              <div className="col-span-4 flex flex-col gap-4">
                {/* Time & Routine Box */}
                <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Clock className="w-20 h-20 text-black" />
                  </div>

                  <h2 className="flex items-center gap-2 text-base font-black uppercase italic mb-4 text-black border-b border-gray-200 pb-2.5 relative z-10">
                    <Clock className="w-5 h-5 text-primary" /> Time & Routine
                  </h2>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed relative z-10">
                    This requires ~10 hours/week of active collaboration. Let's
                    lock in our routine:
                  </p>

                  <div className="space-y-3 relative z-10 flex-1 flex flex-col">
                    <div className="flex items-start gap-2.5">
                      <div className="bg-primary/20 rounded-full p-1 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-gray-800 leading-snug">
                        2x: 20mins status calls per week
                      </span>
                      <div className="bg-primary/20 rounded-full p-1 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-gray-800 leading-snug">
                        2x: 1hr feature meeting per week
                      </span>
                    </div>
                  </div>
                </div>

                {/* The Kill Switch Box */}
                <div className="bg-red-50/50 rounded-3xl p-5 border border-red-100 shadow-sm h-[120px] flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
                  <h3 className="flex items-center gap-1.5 text-xs font-black uppercase text-red-600 mb-1.5 relative z-10">
                    <AlertOctagon className="w-3.5 h-3.5" /> The 2-Week Rule
                    (Stop Switch)
                  </h3>
                  <p className="text-[10px] text-red-900/70 leading-snug relative z-10">
                    Momentum is key. If calls, commitments, or feedback are
                    missed for <strong>2 consecutive weeks</strong>, this
                    agreement is automatically terminated to protect both our
                    time. Future obligations & equity will be cancelled.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-2 text-center relative z-10">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                * Please refer to the reverse side of this page for any
                additional handwritten notes, terms, or addendums.
              </p>
            </div>
          </div>
        </div>

        {/* Print Button */}
        <div className="fixed bottom-8 right-8 print:hidden z-50">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-black tracking-widest text-xs rounded-xl shadow-2xl hover:scale-105 transition-all uppercase flex items-center gap-2"
          >
            Print Agreement
          </button>
        </div>
      </div>
    </>
  )
}