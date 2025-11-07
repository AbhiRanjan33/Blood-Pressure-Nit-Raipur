"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Heart, Stethoscope, Shield, Brain, Smartphone, CheckCircle } from "lucide-react";
import { motion, useScroll } from "framer-motion";
import Image from "next/image";

export default function LandingPage() {
  const [hasScrolled, setHasScrolled] = useState(false);
  const { scrollY } = useScroll();

  // Detect first scroll
  useEffect(() => {
    const unsubscribe = scrollY.on("change", (y) => {
      if (y > 10 && !hasScrolled) {
        setHasScrolled(true);
      }
    });

    return () => unsubscribe();
  }, [scrollY, hasScrolled]);

  return (
    <>
      {/* Full-Screen GIF Splash – Only hides on scroll */}
      <motion.div
        className="fixed inset-0 z-50 bg-white flex items-center justify-center overflow-hidden"
        initial={{ opacity: 1 }}
        animate={{ opacity: hasScrolled ? 0 : 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ pointerEvents: hasScrolled ? "none" : "auto" }}
      >
        <Image
          src="/doc.gif"
          alt="BP Health AI"
          fill
          className="object-cover"
          unoptimized
          priority
        />
      </motion.div>

      {/* Main Content – Appears only after scroll + pod.png background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hasScrolled ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative min-h-screen"
        style={{
          backgroundImage: `url('/pod.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed', // Parallax effect
        }}
      >
        {/* Semi-transparent overlay for text readability */}
        <div className="absolute inset-0 bg-white/45  z-0" />

        {/* All content sits on top of background */}
        <div className="relative z-10">
          {/* Navbar */}
          <header className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-8 w-8 text-red-900" />
                  <span className="text-2xl font-bold text-red-900">BP Health AI</span>
                </div>
                <NavigationMenu>
                  <NavigationMenuList className="flex gap-6">
                    <NavigationMenuItem>
                      <NavigationMenuLink href="#features" className="text-gray-700 hover:text-red-600 transition">
                        Features
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink href="#how-it-works" className="text-gray-700 hover:text-red-600 transition">
                        How It Works
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <Button size="lg" className="bg-red-800 hover:bg-red-900" asChild>
                        <a href="/sign-up">
                          <Smartphone className="mr-2 h-5 w-5" /> Get Started
                        </a>
                      </Button>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </nav>
            </div>
          </header>

          {/* Hero Section */}
          <section className="container mx-auto px-4 py-16 md:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Badge className="mb-4" variant="secondary">
                <Brain className="w-4 h-4 mr-1" /> AI-Powered Hypertension Care
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Take Control of Your <span className="text-red-700">Blood Pressure</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                An intelligent, doctor-supervised AI platform that monitors your BP, learns your health history, 
                and suggests personalized, affordable treatments — with full medical oversight.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-red-600 hover:bg-red-700">
                  <Smartphone className="mr-2 h-5 w-5" /> Start Monitoring
                </Button>
                <Button size="lg" variant="outline">
                  <Stethoscope className="mr-2 h-5 w-5" /> For Doctors
                </Button>
              </div>
            </motion.div>
          </section>

          <Separator className="container mx-auto bg-gray-300" />

          {/* Features Section */}
          <section id="features" className="container mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">Smart Features for Smarter Care</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Heart className="h-10 w-10 text-red-500" />,
                  title: "Real-Time BP Tracking",
                  desc: "Connect IoT devices or enter readings manually. AI detects trends early."
                },
                {
                  icon: <Brain className="h-10 w-10 text-red-600" />,
                  title: "AI-Powered Suggestions",
                  desc: "Dynamic medication plans based on your history, region, and drug costs."
                },
                {
                  icon: <Shield className="h-10 w-10 text-green-600" />,
                  title: "Doctor-in-the-Loop",
                  desc: "Every AI suggestion is reviewed and approved by a licensed physician."
                },
                {
                  icon: <Stethoscope className="h-10 w-10 text-purple-600" />,
                  title: "Secure Medical History",
                  desc: "Encrypted storage of your full health profile with consent-based access."
                },
                {
                  icon: <CheckCircle className="h-10 w-10 text-teal-600" />,
                  title: "Explainable AI",
                  desc: "Clear reasoning behind every recommendation. No black boxes."
                },
                {
                  icon: <Smartphone className="h-10 w-10 text-orange-600" />,
                  title: "Chatbot Assistant",
                  desc: "Ask questions, get reminders, and track adherence via natural conversation."
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="p-6 h-full bg-white/95 backdrop-blur-sm hover:shadow-xl transition-shadow border border-gray-200">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="py-16 bg-gradient-to-b from-transparent to-white/50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
              <div className="grid md:grid-cols-4 gap-6 text-center">
                {[
                  { step: "1", title: "Connect & Track", desc: "Link BP monitor or enter readings" },
                  { step: "2", title: "AI Analyzes", desc: "Full history + regional data" },
                  { step: "3", title: "Doctor Reviews", desc: "Human validation required" },
                  { step: "4", title: "You Receive", desc: "Safe, affordable prescription" }
                ].map((item, i) => (
                  <div key={i} className="relative">
                    <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-red-900 border-4 border-red-200 shadow-md">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-lg mb-1 text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                    {i < 3 && (
                      <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-red-200 -z-10"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="container mx-auto px-4 py-16 text-center">
            <Card className="bg-gradient-to-r from-red-600 to-red-800 text-white p-10 md:p-16 rounded-2xl shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Hypertension Care?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands managing blood pressure with AI + human expertise.
              </p>
              <Button size="lg" variant="secondary" className="text-red-700 font-semibold hover:scale-105 transition">
                Launch App Now
              </Button>
            </Card>
          </section>

          {/* Footer */}
          <footer className="bg-gray-900 text-gray-300 py-12">
            <div className="container mx-auto px-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Heart className="h-6 w-6 text-red-500" />
                <span className="text-xl font-bold text-white">BP Health AI</span>
              </div>
              <p className="text-sm">
                © 2025 BP Health AI. Built for patient safety and medical excellence.
              </p>
              <p className="text-xs mt-2 opacity-70">
                AI suggestions require mandatory doctor approval. Not a substitute for medical advice.
              </p>
            </div>
          </footer>
        </div>
      </motion.div>
    </>
  );
}