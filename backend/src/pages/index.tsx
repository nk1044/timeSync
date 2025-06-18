import { useSession, signOut } from "next-auth/react";
import { useUserStore } from "@/store/useUserStore";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

export default function HomePage() {
  const { data: session, status } = useSession();
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!session) router.push("/login");
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 text-neutral-700">
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e12] via-[#1a1b3a] to-[#0e0e12] text-white font-sans overflow-x-hidden">
      {/* Navbar */}
      <header className="flex justify-between items-center px-8 py-6 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight text-white">timeSync</h1>
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-2">
              <img
                src={user.image || "/default-avatar.png"}
                alt="User Avatar"
                className="w-8 h-8 rounded-full"
              />
              <span>{user.name}</span>
            </div>
          ) : (
            "Loading User"
          )}
        <button className="bg-violet-600 hover:bg-violet-500 text-white font-medium px-4 py-2 rounded-lg transition">
          Logout
        </button>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center py-28 px-4 md:px-16 relative z-10">
        <h2 className="text-5xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-violet-300 via-white to-violet-200 bg-clip-text text-transparent mb-6">
          Smarter Tasking. <br className="hidden md:block" />
          Seamless Planning.
        </h2>
        <p className="text-lg text-violet-200 max-w-xl mx-auto">
          Organize your week, manage your to-dos, and stay in flow with a time assistant that actually thinks with you.
        </p>
        <div className="mt-10">
          <button className="bg-violet-500 hover:bg-violet-400 text-white px-6 py-3 rounded-xl shadow-md transition">
            Start Planning Smarter
          </button>
        </div>
      </section>

      {/* Floating Feature Nodes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 left-[10%] bg-white/10 border border-white/20 backdrop-blur-lg p-4 rounded-xl text-sm text-violet-100 shadow-md">
          Smart Reminders
        </div>
        <div className="absolute bottom-40 right-[12%] bg-white/10 border border-white/20 backdrop-blur-lg p-4 rounded-xl text-sm text-violet-100 shadow-md">
          Weekly Scheduler
        </div>
        <div className="absolute bottom-[30%] left-[30%] bg-white/10 border border-white/20 backdrop-blur-lg p-4 rounded-xl text-sm text-violet-100 shadow-md">
          Timetable View
        </div>
        <div className="absolute top-[20%] right-[30%] bg-white/10 border border-white/20 backdrop-blur-lg p-4 rounded-xl text-sm text-violet-100 shadow-md">
          Task Prioritization
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-32 text-center text-sm text-violet-300 py-6 border-t border-white/10">
        &copy; {new Date().getFullYear()} TimeSmart – Plan Better. Live Smarter.
      </footer>
    </div>
  );
}

