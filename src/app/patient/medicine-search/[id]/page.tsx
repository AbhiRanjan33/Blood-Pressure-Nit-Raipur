// src/app/patient/medicine-search/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pill, ExternalLink, Loader2, AlertCircle, IndianRupee, FileText, Calendar, Clock } from "lucide-react";
import Link from "next/link";
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

// 1MG-STYLE EXTRACTION — ONLY REAL MEDICINES
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

        // 2. EXACT 1MG EXTRACTION — ONLY REAL MEDICINES
        const prescriptionLower = data.consult.prescription.toLowerCase();
        const extracted = MEDICINE_LIST
          .filter(med => prescriptionLower.includes(med))
          .map(med => med.charAt(0).toUpperCase() + med.slice(1));

        const uniqueQueries = [...new Set(extracted)];

        // CONSOLE LOG — EXACTLY WHAT IS SENT
        console.log("Sending to /search_bulk → queries:", uniqueQueries);

        if (uniqueQueries.length === 0) {
          setLoading(false);
          return;
        }

        // 3. Search only real medicines
        const priceRes = await fetch("http://127.0.0.1:8000/search_bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queries: uniqueQueries }),
        });

        if (!priceRes.ok) throw new Error("Backend error");
        const rawResults: SearchResult[] = await priceRes.json();

        // 4. Show only valid results
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-20 w-20 animate-spin text-indigo-600 mx-auto mb-6" />
          <p className="text-2xl font-bold text-indigo-800">Finding your medicines...</p>
        </div>
      </div>
    );
  }

  if (!consult) {
    return <div className="min-h-screen flex items-center justify-center">Consultation not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* HERO */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-white/20 backdrop-blur-md rounded-full p-8">
              <IndianRupee className="h-32 w-32" />
            </div>
          </div>
          <h1 className="text-6xl font-bold mb-6">Cheapest Medicines in India</h1>
          <p className="text-2xl opacity-90">1mg • Netmeds • PharmEasy • Apollo</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 -mt-16 relative z-10">
        <Link href="/dashboard/patient">
          <Button variant="outline" size="lg" className="mb-8">
            <ArrowLeft className="h-6 w-6 mr-3" /> Back
          </Button>
        </Link>

        {/* PRESCRIPTION */}
        <Card className="mb-12 shadow-2xl border-4 border-indigo-300">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-10 rounded-t-2xl">
            <h2 className="text-4xl font-bold flex items-center gap-4">
              <FileText className="h-12 w-12" />
              Doctor's Prescription
            </h2>
            <div className="flex gap-8 mt-6 text-indigo-100 text-lg">
              <span><Calendar className="inline h-6 w-6" /> {format(new Date(consult.completedAt), "dd MMMM yyyy")}</span>
              <span><Clock className="inline h-6 w-6" /> {format(new Date(consult.completedAt), "hh:mm a")}</span>
            </div>
          </div>
          <div className="p-10 bg-white">
            <pre className="whitespace-pre-wrap font-medium text-2xl text-gray-800 font-mono bg-gray-50 p-10 rounded-2xl border-4 border-gray-200">
              {consult.prescription}
            </pre>
          </div>
        </Card>

        {error && (
          <Card className="mb-12 p-10 bg-red-50 border-4 border-red-300 text-center">
            <AlertCircle className="h-20 w-20 mx-auto text-red-600 mb-4" />
            <p className="text-2xl font-bold text-red-700">{error}</p>
          </Card>
        )}

        <div className="space-y-16">
          {results.map((result, i) => (
            <div key={i} className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-indigo-200">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-10">
                <h3 className="text-4xl font-bold">{result.query}</h3>
              </div>

              {result.best_offer && (
                <div className="p-10 bg-gradient-to-r from-green-50 to-emerald-50 border-b-4 border-green-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-5xl font-bold text-green-700">
                        {result.best_offer.currency === "INR" ? "₹" : result.best_offer.currency}
                        {result.best_offer.price.toFixed(2)}
                      </p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{result.best_offer.seller}</p>
                      <p className="text-xl text-gray-700 mt-3">{result.best_offer.title}</p>
                    </div>
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white text-2xl px-16 py-10"
                      onClick={() => window.open(result.best_offer.link, "_blank")}
                    >
                      <ExternalLink className="h-10 w-10 mr-4" />
                      Buy Now
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-10">
                <h4 className="text-2xl font-bold text-gray-800 mb-8">Top 6 Sellers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {result.offers.map((offer, j) => (
                    <Card key={j} className="p-6 hover:shadow-2xl transition-all border-2 border-gray-200 hover:border-indigo-500">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-2xl font-bold text-indigo-700">
                            {offer.currency === "INR" ? "₹" : offer.currency}
                            {offer.price.toFixed(2)}
                          </p>
                          <p className="text-lg font-semibold text-gray-800">{offer.seller}</p>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-800">#{j + 1}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-6 line-clamp-2">{offer.title}</p>
                      <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => window.open(offer.link, "_blank")}
                      >
                        <ExternalLink className="h-5 w-5 mr-2" />
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
          <Card className="p-20 text-center bg-yellow-50 border-4 border-yellow-300">
            <Pill className="h-24 w-24 mx-auto text-yellow-600 mb-6" />
            <p className="text-3xl font-bold text-yellow-800">No medicines found</p>
          </Card>
        )}
      </div>
    </div>
  );
}