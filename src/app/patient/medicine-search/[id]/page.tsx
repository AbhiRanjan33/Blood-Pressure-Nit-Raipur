// src/app/patient/medicine-search/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Pill,
  ExternalLink,
  Loader2,
  AlertCircle,
  IndianRupee,
  FileText,
  Calendar,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

interface Consultation {
  _id: string;
  prescription: string;
  completedAt: string;
}

interface Offer {
  title: string;
  price: number;
  currency: string;
  seller: string;
  link: string;
}

interface SearchResult {
  query: string;
  best_offer: Offer;
  offers: Offer[];
}

const MEDICINE_LIST = [
  "paracetamol", "amlodipine", "metformin", "atorvastatin", "losartan", "insulin", "thyroxin",
  "levothyroxine", "omeprazole", "pantoprazole", "cetirizine", "montelukast", "aspirin",
  "clopidogrel", "rosuvastatin", "telma", "telmisartan", "nebivolol", "ivabradine",
  "dapagliflozin", "sitagliptin", "vildagliptin", "glimepiride", "glipizide", "pioglitazone",
  "linagliptin", "empagliflozin", "atorva", "lipitor", "crestor", "norvasc", "cozaar",
  "diovan", "benicar", "micardis", "avapro", "dolo", "calpol", "crocin", "glycomet",
  "amaryl", "telmikind", "amlong", "losar", "pantocid", "levocet", "montair", "ecosprin",
  "clopilet", "thyronorm", "forxiga", "januvia", "galvus"
];

export default function MedicineSearchPage() {
  const { id } = useParams();
  const router = useRouter();
  const [consult, setConsult] = useState<Consultation | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        // 1. Fetch consultation
        const res = await fetch(`/api/get-patient-consult-by-id?id=${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setConsult(data.consult);

        // 2. Extract medicines
        const prescriptionLower = data.consult.prescription.toLowerCase();
        const extracted = MEDICINE_LIST
          .filter(med => prescriptionLower.includes(med))
          .map(med => med.charAt(0).toUpperCase() + med.slice(1));
        const uniqueQueries = [...new Set(extracted)];

        console.log("Sending to /search_bulk → queries:", uniqueQueries);

        if (uniqueQueries.length === 0) {
          setLoading(false);
          return;
        }

        // 3. Search backend
        const priceRes = await fetch("http://127.0.0.1:8000/search_bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queries: uniqueQueries }),
        });

        if (!priceRes.ok) throw new Error("Backend error");
        const rawResults: SearchResult[] = await priceRes.json();

        // 4. Clean results
        const cleanResults = rawResults
          .map(result => {
            const validOffers = result.offers
              .filter(offer => {
                const title = offer.title.toLowerCase();
                return title.includes(result.query.toLowerCase()) ||
                       title.includes("mg") ||
                       title.includes("tab") ||
                       title.includes("tablet");
              })
              .slice(0, 6);

            const best = validOffers.length > 0
              ? validOffers.reduce((a, b) => a.price < b.price ? a : b)
              : result.best_offer;

            return { ...result, offers: validOffers, best_offer: best };
          })
          .filter(r => r.best_offer || r.offers.length > 0);

        setResults(cleanResults);
      } catch (err: any) {
        setError("Backend not running on port 8000");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-sky-500 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-600">Finding your medicines...</p>
        </div>
      </div>
    );
  }

  if (!consult) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Consultation not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 lg:p-10">
      <div className="max-w-6xl mx-auto">
        {/* header like dashboard */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 20s-6-4.35-9-7.5A6 6 0 0112 4a6 6 0 019 8.5C18 15.65 12 20 12 20z" fill="#ef4444"/>
              </svg>
              Patient Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-full shadow-sm bg-white hover:bg-gray-50 text-sm px-3 py-2"
              onClick={() => router.push("/dashboard/patient")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>

            <div className="flex items-center gap-3">
              <button className="rounded-full bg-sky-50 text-sky-700 px-3 py-2 text-sm border border-sky-100">View Profile</button>
              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white font-semibold">A</div>
              <button className="rounded-full border px-3 py-2 text-sm bg-white hover:bg-gray-50">Sign Out</button>
            </div>
          </div>
        </div>

        {/* hero / small */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="col-span-2 p-4 shadow-sm border rounded-xl bg-white border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100">
                <IndianRupee className="h-8 w-8 text-sky-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Cheapest Medicines in India</h1>
                <p className="text-xs text-gray-600">Compare prices across 1mg • Netmeds • PharmEasy • Apollo</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-sm border rounded-xl bg-white border-gray-100 flex flex-col justify-center items-start">
            <div className="text-sm text-gray-700 font-medium">Quick Actions</div>
            <div className="mt-3 flex gap-2 w-full">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 py-2 text-sm"
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
              >
                <svg className="h-4 w-4 mr-2 inline" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20" stroke="white" strokeWidth="2"/></svg>
                Find Medicines
              </Button>
              <Button size="sm" variant="outline" className="rounded-full px-3 py-2 text-sm">Track BP</Button>
            </div>
          </Card>
        </div>

        {/* prescription */}
        <Card className="mb-6 shadow-sm rounded-xl border border-gray-100 bg-white">
          <div className="bg-white p-4 rounded-t-xl flex items-start justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-sky-50 border border-sky-100">
                <FileText className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Doctor's Prescription</div>
                <div className="text-xs text-gray-500">{format(new Date(consult.completedAt), "dd MMM yyyy • hh:mm a")}</div>
              </div>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-2 py-1">Completed</Badge>
          </div>

          <div className="p-4">
            <pre className="whitespace-pre-wrap font-medium text-sm text-gray-800 font-mono bg-gray-50 p-3 rounded-md border border-gray-100">
{consult.prescription}
            </pre>
          </div>
        </Card>

        {error && (
          <Card className="mb-6 p-3 bg-red-50 border border-red-100 text-center rounded-xl">
            <AlertCircle className="h-6 w-6 mx-auto text-red-600 mb-1" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-1">Ensure your backend is running at <code className="bg-gray-100 px-1 rounded">127.0.0.1:8000</code></p>
          </Card>
        )}

        {/* results */}
        <div className="space-y-4">
          {results.map((result, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-sky-600 text-white p-3 flex items-center justify-between">
                <div className="text-sm font-semibold">{result.query}</div>
                {result.best_offer && (
                  <div className="text-xs bg-white/10 px-2 py-1 rounded text-white">
                    Best: {result.best_offer.currency === "INR" ? "₹" : result.best_offer.currency}{result.best_offer.price.toFixed(2)}
                  </div>
                )}
              </div>

              {result.best_offer && (
                <div className="p-3 border-b border-gray-100 bg-emerald-50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xl font-semibold text-emerald-700">
                        {result.best_offer.currency === "INR" ? "₹" : result.best_offer.currency}{result.best_offer.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-800 mt-1">{result.best_offer.seller}</div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">{result.best_offer.title}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-3 py-2 text-sm"
                        onClick={() => window.open(result.best_offer.link, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" /> Buy
                      </Button>
                      <a
                        className="text-xs text-gray-500 underline hover:text-gray-700"
                        href={result.best_offer.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Visit
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3">
                <div className="text-xs font-semibold text-gray-800 mb-2">Top Sellers</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.offers.map((offer, j) => (
                    <Card key={j} className="p-2 border rounded-md border-gray-100 shadow-none">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm font-semibold text-sky-700">{offer.currency === "INR" ? "₹" : offer.currency}{offer.price.toFixed(2)}</div>
                          <div className="text-xs text-gray-700">{offer.seller}</div>
                        </div>
                        <div className="text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded">#{j + 1}</div>
                      </div>
                      <div className="text-xs text-gray-600 mb-2 line-clamp-2">{offer.title}</div>
                      <Button
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs py-2 rounded"
                        onClick={() => window.open(offer.link, "_blank")}
                      >
                        View Deal
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && !loading && !error && (
          <Card className="p-3 mt-4 border rounded-xl bg-yellow-50 border-yellow-100 text-center">
            <Pill className="h-6 w-6 mx-auto text-yellow-600 mb-1" />
            <div className="text-sm font-semibold text-yellow-800">No medicines found</div>
          </Card>
        )}
      </div>
    </div>
  );
}
