"use client";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import JobBoard from "@/components/JobBoard";

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <Hero />
      <JobBoard />
    </div>
  );
}
