import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import ChatWidget from "@/components/chatbot/ChatWidget";
import { PublicChrome } from '@/components/layout/public-chrome';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1680px] px-3 py-3 text-[#2c1d18] sm:px-5 sm:py-5">
      <div className="overflow-clip rounded-[2rem] border border-[#eadbd3] bg-[#fdf7f5] shadow-[0_28px_90px_-45px_rgba(70,43,32,0.28)] sm:rounded-[2.5rem]">
        <PublicChrome><Navbar /></PublicChrome>
        <main>
          {children}
          <ChatWidget />
        </main>
        <PublicChrome><Footer /></PublicChrome>
      </div>
    </div>
  );
}