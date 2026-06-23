"use client";

import { ChatInterface } from "@/components/chat/ChatInterface";
import { GenerativeUIContainer } from "@/components/generative-ui/GenerativeUIContainer";
import { ChatProvider } from "@/components/chat/ChatContext";

export default function Home() {
  return (
    <ChatProvider>
      <main className="flex h-screen w-full overflow-hidden">
        {/* Left Column - 50% Width for Sticky AI Chat */}
        <section className="w-1/2 h-full flex-shrink-0 z-10 shadow-xl relative">
          <ChatInterface />
        </section>

        {/* Right Column - 50% Width for Generative UI */}
        <section className="w-1/2 h-full">
          <GenerativeUIContainer />
        </section>
      </main>
    </ChatProvider>
  );
}
