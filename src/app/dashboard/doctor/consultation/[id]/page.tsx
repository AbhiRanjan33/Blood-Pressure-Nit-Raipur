// // // src/app/dashboard/doctor/consultation/[id]/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { useUser } from "@clerk/nextjs";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { ArrowLeft, Heart, AlertCircle, Pill, FileText, Sparkles, Stethoscope, Loader2, CheckCircle2 } from "lucide-react";
// import PrescriptionForm from "@/components/doctor/PrescriptionForm";
// import BPTreatmentAdvisor from "@/components/doctor/BPTreatmentAdvisor"; // ← NEW COMPONENT

// interface ConsultRequest {
//   _id: string;
//   vitals: string;
//   allergies: string;
//   notes: string;
//   medications: string;
//   createdAt: string;
//   status?: string;
//   patientName?: string;
//   patientAge?: number;
// }

// interface Alert {
//   type: string;
//   finding: string;
// }

// interface DrugReport {
//   genericName: string;
//   brandName: string;
//   drugClass: string;
//   alerts: Alert[];
//   fullData: {
//     contraindications?: string;
//     warnings_and_precautions?: string;
//     drugInteractions?: string;
//     adverseReactions?: string;
//   };
// }

// export default function DoctorConsultation() {
//   const { id } = useParams();
//   const router = useRouter();
//   const { user } = useUser();

//   const [request, setRequest] = useState<ConsultRequest | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [reportLoading, setReportLoading] = useState(false);
//   const [reports, setReports] = useState<DrugReport[]>([]);
//   const [customDrug, setCustomDrug] = useState("");
//   const [customReports, setCustomReports] = useState<DrugReport[]>([]);

//   useEffect(() => {
//     if (!id || !user?.id) return;

//     const fetchRequest = async () => {
//       setLoading(true);
//       try {
//         const res = await fetch(`/api/get-doctor-consult-by-id?id=${id}&clerkId=${user.id}`);
//         if (!res.ok) throw new Error("Not found");
//         const data = await res.json();
//         setRequest(data.request);
//       } catch {
//         alert("Request not found.");
//         router.push("/dashboard/doctor");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRequest();
//   }, [id, user?.id, router]);

//   const getPatientProfile = () => ({
//     vitals: request?.vitals || "N/A",
//     notes: request?.notes || "N/A",
//     allergies: (request?.allergies || "").split(",").map(s => s.trim()).filter(Boolean),
//     meds: (request?.medications || "").split(",").map(s => s.trim()).filter(Boolean),
//   });

//   const generateSummaryReport = async () => {
//     if (!request) return;
//     setReportLoading(true);
//     setReports([]);
//     setCustomReports([]);

//     try {
//       const response = await fetch("http://127.0.0.1:5000/generate-report", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(getPatientProfile()),
//       });

//       if (!response.ok) {
//         const err = await response.json();
//         throw new Error(err.error || "Server error");
//       }

//       const reports: DrugReport[] = await response.json();
//       setReports(reports);
//     } catch (error: any) {
//       alert(
//         error.message.includes("fetch")
//           ? "Connection Error: Could not connect to the backend server. Is your Python 'app.py' server running?"
//           : `Error: ${error.message}`
//       );
//     } finally {
//       setReportLoading(false);
//     }
//   };

//   const checkSingleDrug = async () => {
//     if (!customDrug.trim()) {
//       alert("Please enter a drug name.");
//       return;
//     }

//     try {
//       const response = await fetch("http://127.0.0.1:5000/check-drug", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ profile: getPatientProfile(), drugName: customDrug.trim() }),
//       });

//       if (!response.ok) {
//         const err = await response.json();
//         throw new Error(err.error || "Not found");
//       }

//       const report: DrugReport = await response.json();
//       setCustomReports(prev => [report, ...prev]);
//       setCustomDrug("");
//     } catch (error: any) {
//       alert(
//         error.message.includes("fetch")
//           ? "Backend not running. Start app.py"
//           : `Error: ${error.message}`
//       );
//     }
//   };

//   const createReportCardHTML = (report: DrugReport) => {
//     const alertList = report.alerts.map(alert => {
//       let borderColor = 'border-gray-500';
//       if (alert.type.includes('CONTRAINDICATION')) borderColor = 'border-red-500';
//       else if (alert.type.includes('INTERACTION')) borderColor = 'border-yellow-500';
//       else if (alert.type.includes('WARNING') || alert.type.includes('SIDE EFFECT')) borderColor = 'border-orange-500';
//       else if (alert.type.includes('INFO')) borderColor = 'border-green-500';

//       return `<li class="p-3 bg-gray-100 border-l-4 ${borderColor} rounded">
//         <span class="font-bold">${alert.type}</span> <strong>${alert.finding}</strong>
//       </li>`;
//     }).join('');

//     const fullData = report.fullData;
//     const createPreText = (text: string | undefined, section: string) => {
//       const color = section === "contraindications" ? "bg-red-50 border-red-200" :
//                     section === "warnings_and_precautions" ? "bg-orange-50 border-orange-200" :
//                     section === "drugInteractions" ? "bg-yellow-50 border-yellow-200" :
//                     "bg-orange-50 border-orange-200";
//       return `<pre class="bg-gray-50 p-3 rounded h-32 overflow-y-auto border ${color} text-xs">${text || "No info."}</pre>`;
//     };

//     return `
//       <div class="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm mb-6">
//         <div class="bg-gray-200 p-5">
//           <h3 class="text-2xl font-bold">${report.genericName}</h3>
//           <p class="text-sm text-gray-600">${report.drugClass} (Brand: ${report.brandName})</p>
//         </div>
//         <div class="p-5">
//           <h4 class="font-bold text-lg mb-3">LLM-Generated Alerts:</h4>
//           <ul class="space-y-3">${alertList}</ul>
//         </div>
//         <details class="p-5 bg-gray-50 border-t">
//           <summary class="cursor-pointer text-blue-600 font-medium">Show/Hide Full FDA Data</summary>
//           <div class="mt-4 space-y-4 text-sm">
//             <div><h5 class="font-bold text-red-700">Contraindications</h5>${createPreText(fullData.contraindications, "contraindications")}</div>
//             <div><h5 class="font-bold text-orange-700">Warnings & Precautions</h5>${createPreText(fullData.warnings_and_precautions, "warnings_and_precautions")}</div>
//             <div><h5 class="font-bold text-yellow-800">Drug Interactions</h5>${createPreText(fullData.drugInteractions, "drugInteractions")}</div>
//             <div><h5 class="font-bold text-orange-700">Adverse Reactions</h5>${createPreText(fullData.adverseReactions, "adverseReactions")}</div>
//           </div>
//         </details>
//       </div>
//     `;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent"></div>
//       </div>
//     );
//   }

//   if (!request) return null;

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <div className="container mx-auto p-6 max-w-5xl">

//         <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/doctor")} className="mb-6">
//           <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
//         </Button>

//         <header className="mb-8">
//           <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-2">Clinical Summary & Alerter Tool (LLM)</h1>
//           <p className="text-lg text-gray-600">AI-powered drug safety checker using openFDA + Gemini</p>
//         </header>

//         <Card className="p-8 mb-8 shadow-lg border-2 border-blue-200">
//           {/* Patient Profile */}
//           <h2 className="text-2xl font-bold mb-6 border-b-2 border-gray-200 pb-3">Patient Profile</h2>
//           <div className="grid md:grid-cols-2 gap-8 mb-8">
//             <div><p className="font-bold text-gray-700 mb-2"><Heart className="inline h-5 w-5 text-red-600" /> Vitals</p><p className="font-mono text-lg bg-gray-50 p-3 rounded">{request.vitals}</p></div>
//             <div><p className="font-bold text-gray-700 mb-2"><AlertCircle className="inline h-5 w-5 text-orange-600" /> Allergies</p><p className="bg-gray-50 p-3 rounded">{request.allergies || "None"}</p></div>
//             <div><p className="font-bold text-gray-700 mb-2"><Pill className="inline h-5 w-5 text-blue-600" /> Current Medications</p><p className="bg-gray-50 p-3 rounded">{request.medications || "None"}</p></div>
//             <div><p className="font-bold text-gray-700 mb-2"><FileText className="inline h-5 w-5 text-green-600" /> Notes / History</p><p className="bg-gray-50 p-3 rounded italic">{request.notes || "None"}</p></div>
//           </div>

//           {/* Generate Report */}
//           <div className="border-t pt-8">
//             <h3 className="text-xl font-bold mb-3">1. Generate Default Report</h3>
//             <p className="text-gray-600 mb-4">Check against 5 common hypertension drugs</p>
//             <Button onClick={generateSummaryReport} disabled={reportLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6">
//               <Sparkles className="h-6 w-6 mr-3" />
//               {reportLoading ? "Analyzing... (10-20s)" : "Generate Main Summary Report"}
//             </Button>
//           </div>

//           {/* Custom Drug */}
//           <div className="mt-8 border-t pt-8">
//             <h3 className="text-xl font-bold mb-3">2. Check a Specific Drug</h3>
//             <p className="text-gray-600 mb-4">Enter any drug name (generic or brand)</p>
//             <div className="flex gap-3">
//               <Input
//                 placeholder="e.g., Warfarin, Aspirin, Paracetamol"
//                 value={customDrug}
//                 onChange={(e) => setCustomDrug(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && checkSingleDrug()}
//                 className="text-lg"
//               />
//               <Button onClick={checkSingleDrug} variant="secondary" size="lg">
//                 Check Drug
//               </Button>
//             </div>
//           </div>
//         </Card>

//         {/* Custom Reports */}
//         <div className="space-y-8">
//           {customReports.map((r, i) => (
//             <div key={i} dangerouslySetInnerHTML={{ __html: createReportCardHTML(r) }} />
//           ))}
//         </div>

//         {/* Loading */}
//         {reportLoading && (
//           <div className="my-12 text-center">
//             <div className="inline-block animate-spin h-16 w-16 border-8 border-blue-600 rounded-full border-t-transparent"></div>
//             <p className="mt-6 text-xl text-blue-700">Generating report... This may take 10-20 seconds</p>
//           </div>
//         )}

//         {/* MAIN REPORTS + HINDI BUTTON */}
//         <div className="space-y-8 relative">
//           {/* Hindi Translation Button */}
//           {reports.length > 0 && (
//             <div className="sticky top-4 z-10 flex justify-end mb-8 -mt-10">
//               <button
//                 onClick={() => {
//                   const container = document.getElementById("google_translate_element");
//                   if (container) {
//                     // @ts-ignore
//                     new google.translate.TranslateElement(
//                       { pageLanguage: "en", includedLanguages: "hi", autoDisplay: false },
//                       "google_translate_element"
//                     );
//                     setTimeout(() => {
//                       const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
//                       if (select) {
//                         select.value = "hi";
//                         select.dispatchEvent(new Event("change"));
//                       }
//                     }, 300);
//                   }
//                 }}
//                 className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-5 px-10 rounded-full shadow-2xl flex items-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-orange-500/50"
//               >
//                 <span className="text-3xl">हिन्दी में</span>
//                 <span className="text-lg">Translate Report to Hindi</span>
//               </button>
//             </div>
//           )}

//           {/* Hidden Google Translate Widget */}
//           <div id="google_translate_element" style={{ display: "none" }}></div>

//           {/* Actual Main Reports */}
//           <div className="space-y-8">
//             {reports.map((report, i) => (
//               <div key={i} dangerouslySetInnerHTML={{ __html: createReportCardHTML(report) }} />
//             ))}
//           </div>
//         </div>

//         {/* NEW: BP TREATMENT ADVISOR — INSERTED HERE */}
//         {request && (
//           <BPTreatmentAdvisor
//             age={request.patientAge || 50}
//             vitals={request.vitals}
//             medications={request.medications}
//             consultId={request._id.toString()} // ← PASS THIS
//           />
//         )}

//         {/* FINAL PRESCRIPTION FORM */}
//         <PrescriptionForm />

//       </div>
//     </div>
//   );
// }

// src/app/dashboard/doctor/consultation/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Heart, AlertCircle, Pill, FileText,
  Sparkles, Loader2
} from "lucide-react";
import PrescriptionForm from "@/components/doctor/PrescriptionForm";
import BPTreatmentAdvisor from "@/components/doctor/BPTreatmentAdvisor";

interface ConsultRequest {
  _id: string;
  vitals: string;
  allergies: string;
  notes: string;
  medications: string;
  createdAt: string;
  status?: string;
  patientName?: string;
  patientAge?: number;
}

interface Alert {
  type: string;
  finding: string;
}

interface DrugReport {
  genericName: string;
  brandName: string;
  drugClass: string;
  alerts: Alert[];
  fullData: {
    contraindications?: string;
    warnings_and_precautions?: string;
    drugInteractions?: string;
    adverseReactions?: string;
  };
}

export default function DoctorConsultation() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();

  const [request, setRequest] = useState<ConsultRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [reports, setReports] = useState<DrugReport[]>([]);
  const [customDrug, setCustomDrug] = useState("");
  const [customReports, setCustomReports] = useState<DrugReport[]>([]);

  // Prevent multiple Google Translate loads
  const translateInitialized = useRef(false);

  useEffect(() => {
    if (!id || !user?.id) return;

    const fetchRequest = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/get-doctor-consult-by-id?id=${id}&clerkId=${user.id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setRequest(data.request);
      } catch {
        alert("Request not found.");
        router.push("/dashboard/doctor");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, user?.id, router]);

  const getPatientProfile = () => ({
    vitals: request?.vitals || "N/A",
    notes: request?.notes || "N/A",
    allergies: (request?.allergies || "").split(",").map(s => s.trim()).filter(Boolean),
    meds: (request?.medications || "").split(",").map(s => s.trim()).filter(Boolean),
  });

  const generateSummaryReport = async () => {
    if (!request) return;
    setReportLoading(true);
    setReports([]);
    setCustomReports([]);

    try {
      const response = await fetch("http://127.0.0.1:5000/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPatientProfile()),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Server error");
      }

      const reports: DrugReport[] = await response.json();
      setReports(reports);
    } catch (error: any) {
      alert(
        error.message.includes("fetch")
          ? "Connection Error: Could not connect to the backend server. Is your Python 'app.py' server running?"
          : `Error: ${error.message}`
      );
    } finally {
      setReportLoading(false);
    }
  };

  const checkSingleDrug = async () => {
    if (!customDrug.trim()) {
      alert("Please enter a drug name.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/check-drug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: getPatientProfile(), drugName: customDrug.trim() }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Not found");
      }

      const report: DrugReport = await response.json();
      setCustomReports(prev => [report, ...prev]);
      setCustomDrug("");
    } catch (error: any) {
      alert(
        error.message.includes("fetch")
          ? "Backend not running. Start app.py"
          : `Error: ${error.message}`
      );
    }
  };

  const createReportCardHTML = (report: DrugReport) => {
    const alertToAccent = (type: string) => {
      if (type.toUpperCase().includes("CONTRAINDICATION")) return "border-red-500 bg-red-50";
      if (type.toUpperCase().includes("INTERACTION")) return "border-yellow-400 bg-yellow-50";
      if (type.toUpperCase().includes("WARNING") || type.toUpperCase().includes("SIDE EFFECT")) return "border-orange-400 bg-orange-50";
      if (type.toUpperCase().includes("INFO")) return "border-emerald-400 bg-emerald-50";
      return "border-gray-200 bg-gray-50";
    };

    const alertList = report.alerts.map(alert => {
      const accent = alertToAccent(alert.type);
      return `
        <li class="p-3 rounded-md ${accent} border-l-4">
          <div class="flex items-start gap-3">
            <div class="text-xs font-semibold text-gray-700">${escapeHtml(alert.type)}</div>
            <div class="text-sm text-gray-800 font-medium flex-1">${escapeHtml(alert.finding)}</div>
          </div>
        </li>
      `;
    }).join("");

    const fullData = report.fullData;

    const createPreText = (text: string | undefined, section: string) => {
      const colorClass =
        section === "contraindications" ? "border-red-100 bg-red-50" :
        section === "warnings_and_precautions" ? "border-orange-100 bg-orange-50" :
        section === "drugInteractions" ? "border-yellow-100 bg-yellow-50" :
        "border-gray-100 bg-gray-50";
      return `<pre class="whitespace-pre-wrap text-xs ${colorClass} border rounded p-3 max-h-36 overflow-auto">${escapeHtml(text || "No information available.")}</pre>`;
    };

    return `
      <div class="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
        <div class="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
          <div>
            <div class="text-lg font-semibold text-gray-900">${escapeHtml(report.genericName)}</div>
            <div class="text-xs text-gray-500 mt-1">${escapeHtml(report.drugClass)} • Brand: ${escapeHtml(report.brandName)}</div>
          </div>
          <div class="text-right">
            <div class="inline-flex items-center gap-2">
              <div class="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">AI Alerts</div>
              <div class="text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded border border-sky-100">${report.alerts.length} found</div>
            </div>
          </div>
        </div>

        <div class="p-4 space-y-3">
          <div>
            <div class="text-sm font-semibold text-gray-800 mb-2">Key Alerts</div>
            <ul class="space-y-2">${alertList || `<li class="text-xs text-gray-600">No alerts generated.</li>`}</ul>
          </div>

          <details class="bg-gray-50 border border-gray-100 rounded-md p-3 text-sm">
            <summary class="cursor-pointer text-sky-600 font-medium">Show full FDA / reference data</summary>
            <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <div class="text-xs font-bold text-red-700 mb-1">Contraindications</div>
                ${createPreText(fullData.contraindications, "contraindications")}
              </div>
              <div>
                <div class="text-xs font-bold text-orange-700 mb-1">Warnings & Precautions</div>
                ${createPreText(fullData.warnings_and_precautions, "warnings_and_precautions")}
              </div>
              <div>
                <div class="text-xs font-bold text-yellow-800 mb-1">Drug Interactions</div>
                ${createPreText(fullData.drugInteractions, "drugInteractions")}
              </div>
              <div>
                <div class="text-xs font-bold text-gray-800 mb-1">Adverse Reactions</div>
                ${createPreText(fullData.adverseReactions, "adverseReactions")}
              </div>
            </div>
          </details>
        </div>

        <div class="p-3 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
          <button class="text-xs text-gray-600 underline">Copy Report</button>
          <button class="text-xs bg-sky-600 text-white px-3 py-1 rounded hover:bg-sky-700">Export</button>
        </div>
      </div>
    `;
  };

  const escapeHtml = (unsafe: string) => {
    return String(unsafe)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  // Hindi Translation Function
  const translateToHindi = () => {
    if (translateInitialized.current) return;

    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    // @ts-ignore
    window.googleTranslateElementInit = () => {
      // @ts-ignore
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: "hi", autoDisplay: false },
        "google_translate_element"
      );

      setTimeout(() => {
        const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
        if (select) {
          select.value = "hi";
          select.dispatchEvent(new Event("change"));
        }
      }, 500);

      translateInitialized.current = true;
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-5 md:p-6 max-w-5xl">

        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/doctor")}
          className="mb-5 text-gray-700 hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-sky-700 mb-1">
            Clinical Summary & Alerter Tool (LLM)
          </h1>
          <p className="text-sm text-gray-600">
            AI-powered drug safety checker using openFDA + Gemini
          </p>
        </header>

        {/* Patient Profile */}
        <Card className="p-5 mb-5 shadow-sm border border-gray-100 rounded-lg bg-white">
          <h2 className="text-base font-semibold mb-3 border-b border-gray-100 pb-2">
            Patient Profile
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700 mb-2">
                <Heart className="inline h-4 w-4 text-red-600 mr-1" /> Vitals
              </p>
              <p className="font-mono text-sm bg-gray-50 p-2.5 rounded border border-gray-100">
                {request.vitals}
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">
                <AlertCircle className="inline h-4 w-4 text-orange-600 mr-1" /> Allergies
              </p>
              <p className="bg-gray-50 p-2.5 rounded border border-gray-100">
                {request.allergies || "None"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">
                <Pill className="inline h-4 w-4 text-blue-600 mr-1" /> Current Medications
              </p>
              <p className="bg-gray-50 p-2.5 rounded border border-gray-100">
                {request.medications || "None"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 text-sky-600 mr-1" /> Notes / History
              </p>
              <p className="bg-gray-50 p-2.5 rounded border border-gray-100 italic text-sm">
                {request.notes || "None"}
              </p>
            </div>
          </div>

          {/* Generate Report */}
          <div className="border-t pt-5 mt-5">
            <h3 className="text-sm font-semibold mb-2">1. Generate Default Report</h3>
            <p className="text-xs text-gray-600 mb-3">
              Check against common hypertension drugs and generate AI alerts
            </p>
            <Button
              onClick={generateSummaryReport}
              disabled={reportLoading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-xs py-2.5"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {reportLoading
                ? "Analyzing... (this may take a few seconds)"
                : "Generate Summary Report"}
            </Button>
          </div>

          {/* Custom Drug */}
          <div className="mt-5 border-t pt-5">
            <h3 className="text-sm font-semibold mb-2">2. Check a Specific Drug</h3>
            <p className="text-xs text-gray-600 mb-3">
              Enter any drug name (generic or brand) to get a focused safety report
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Warfarin, Aspirin, Paracetamol"
                value={customDrug}
                onChange={(e) => setCustomDrug(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkSingleDrug()}
                className="text-xs"
              />
              <Button onClick={checkSingleDrug} variant="secondary" size="sm" className="text-xs">
                Check
              </Button>
            </div>
          </div>
        </Card>

        {/* Custom Reports */}
        {customReports.length > 0 && (
          <div className="mb-5 space-y-3">
            <div className="text-sm font-semibold text-gray-800">Recent Drug Checks</div>
            <div className="space-y-3">
              {customReports.map((r, i) => (
                <div key={i} dangerouslySetInnerHTML={{ __html: createReportCardHTML(r) }} />
              ))}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {reportLoading && (
          <div className="my-6 text-center">
            <div className="inline-block animate-spin h-10 w-10 border-4 border-sky-500 rounded-full border-t-transparent"></div>
            <p className="mt-3 text-xs text-sky-700">
              Generating report... this may take a few seconds
            </p>
          </div>
        )}

        {/* AI Reports + HINDI BUTTON */}
        {reports.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-semibold text-gray-800">AI Summary Reports</div>

              {/* HINDI TRANSLATE BUTTON */}
              <button
                onClick={translateToHindi}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-[11px] px-3 py-1.5 rounded-full shadow-sm hover:scale-105 transition-all"
              >
                हिन्दी में
              </button>
            </div>

            {/* Hidden Google Translate Container */}
            <div id="google_translate_element" style={{ display: "none" }}></div>

            {/* Reports */}
            <div className="space-y-3">
              {reports.map((report, i) => (
                <div key={i} dangerouslySetInnerHTML={{ __html: createReportCardHTML(report) }} />
              ))}
            </div>
          </div>
        )}

        {/* BP TREATMENT ADVISOR */}
        {request && (
          <div className="mb-4">
            <div className="scale-95 transform origin-top">
              <BPTreatmentAdvisor
                age={request.patientAge || 50}
                vitals={request.vitals}
                medications={request.medications}
                consultId={request._id.toString()}
              />
            </div>
          </div>
        )}

        {/* PRESCRIPTION FORM */}
        <div className="mb-6">
          <PrescriptionForm />
        </div>
      </div>
    </div>
  );
}
