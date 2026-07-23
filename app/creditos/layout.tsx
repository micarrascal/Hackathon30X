import Tracker from "@/components/Tracker";
import ChatWidget from "@/components/ChatWidget";

export default function CreditosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Tracker />
      {children}
      <ChatWidget />
    </>
  );
}
