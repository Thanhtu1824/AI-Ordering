"use client";

import { ChatInterface } from "@/components/chat/ChatInterface";
import { GenerativeUIContainer } from "@/components/generative-ui/GenerativeUIContainer";
import { ChatProvider } from "@/components/chat/ChatContext";

export default function Home() {
  return (
    <ChatProvider>
      <main className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-black overflow-hidden p-8">
        <div className="flex w-[90%] h-[92%] rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          {/* Left Column - 40% Width for Sticky AI Chat */}
          <section className="w-[40%] h-full flex-shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.05)] relative bg-zinc-50/50 dark:bg-zinc-900/50">
            <ChatInterface />
          </section>

          {/* Right Column - 60% Width for Generative UI */}
          <section className="w-[60%] h-full bg-white dark:bg-zinc-950">
            <GenerativeUIContainer />
          </section>
        </div>
      </main>
    </ChatProvider>
  );
}
