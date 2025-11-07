// src/app/chatbot/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, MessageCircle, Send, Loader2 } from "lucide-react";
import Link from "next/link";

interface BPReading {
  date: string;
  systolic: number;
  diastolic: number;
  time: string;
}

interface ConsultRequest {
  _id: string;
  reason: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface Profile {
  [key: string]: any; // Full profile
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotPage() {
  const { user, isLoaded } = useUser();
  const [bpReadings, setBpReadings] = useState<BPReading[]>([]);
  const [consults, setConsults] = useState<ConsultRequest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch ALL patient data
  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    const fetchAllData = async () => {
      try {
        const res = await fetch(`/api/get-patient-full-data?clerkId=${user.id}`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        setProfile(data.profile);
        setBpReadings(data.bpReadings);
        setConsults(data.consults);

        // Welcome message
        setMessages([
          {
            role: "assistant",
            content: `Hello ${data.profile?.name || "Patient"}! I'm your AI Blood Pressure Doctor. I have your complete health history. Ask me anything!`,
          },
        ]);
      } catch (err: any) {
        setError(err.message || "Failed to load your full health data");
      }
    };

    fetchAllData();
  }, [user, isLoaded]);

  // Send message + LOG FULL DATA
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Full context
      const context = {
        profile,
        bpSummary: {
          allReadings: bpReadings,
          recent5: bpReadings.slice(0, 5),
        },
        consultHistory: consults,
      };

      // FULL LOG
      console.log("SENDING TO GEMINI 1.5 FLASH:", {
        context,
        messageHistory: messages,
        currentInput: input,
        fullPrompt: [
          {
            role: "system",
            content: `You are a senior blood pressure specialist. Use the patient's FULL health data below to give precise, caring, and practical advice.
            Always recommend seeing a doctor for serious concerns.
            Use simple English and bullet points.

            COMPLETE PATIENT DATA:
            ${JSON.stringify(context, null, 2)}
            `,
          },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: input },
        ],
      });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_KEY}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "BP Health AI",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a senior blood pressure specialist. Use the patient's FULL health data below to give precise, caring, and practical advice.
              Always recommend seeing a doctor for serious concerns.
              Use simple English and bullet points.
              Summarize your response but give the exact answer which is asked.

              COMPLETE PATIENT DATA:
              ${JSON.stringify(context, null, 2)}
              `,
            },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: input },
          ],
          temperature: 0.7,
          max_tokens: 600,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Gemini Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't connect. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div
      className="min-h-screen p-6 flex flex-col"
      style={{
        background: `
          linear-gradient(to bottom, 
            rgba(255,255,255,0.7) 0%, 
            rgba(255,255,255,0.9) 70%, 
            #f9fafb 100%
          ),
          url('/pod.jpg') center top / cover no-repeat fixed
        `,
      }}
    >
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
            <MessageCircle className="h-8 w-8 text-red-900" />
            AI Health Assistant
          </h1>
          <Link href="/dashboard/patient">
            <Button variant="outline" size="sm" className="border-red-300 text-red-900 hover:bg-red-50">
              Back
            </Button>
          </Link>
        </div>

        {/* Error */}
        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-2 text-red-700 pt-4">
              <AlertCircle className="h-5 w-5" />
              {error}
            </CardContent>
          </Card>
        )}

        {/* Chat */}
        <Card className="flex-1 shadow-2xl border-red-100 flex flex-col">
          <CardHeader className="bg-red-50 border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-red-900" />
              Chat with Your AI Doctor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                      m.role === "user"
                        ? "bg-red-900 text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-red-900" />
                    <span className="text-gray-600">Analyzing your full health history...</span>
                  </div>
                </div>
              )}
            </ScrollArea>
            <div className="border-t p-4 bg-gray-50">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about your BP trends, risk, or medications..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={loading}
                  className="flex-1 text-base"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-red-900 hover:bg-red-800 text-white px-6"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}