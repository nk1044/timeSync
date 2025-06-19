import { useSession, signOut } from "next-auth/react";
import { useUserStore } from "@/store/useUserStore";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Clock, Calendar, CheckSquare, Bell, ArrowRight, Menu, X, Github } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-white">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Smart Reminders",
      description: "Intelligent notifications that adapt to your schedule"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Weekly Scheduler",
      description: "Visual planning tools for better time management"
    },
    {
      icon: <CheckSquare className="w-6 h-6" />,
      title: "Task Prioritization",
      description: "AI-powered priority suggestions for maximum productivity"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Time Tracking",
      description: "Monitor your productivity patterns and optimize workflows"
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_50%)] pointer-events-none"></div>
      
      {/* Navbar */}
      <header className="relative z-50 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-neutral-900" />
              </div>
              <h1 className="text-xl font-semibold text-white">timeSync</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.image || "/default-avatar.png"}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full border border-neutral-700"
                    />
                    <span className="text-sm text-neutral-300">{user.name}</span>
                  </div>
                  <button 
                    onClick={() => signOut()}
                    className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white border border-neutral-700 rounded-lg hover:border-neutral-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="text-sm text-neutral-400">Loading user...</div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-neutral-400 hover:text-white"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div ref={menuRef} className="md:hidden border-t border-neutral-800 bg-neutral-900">
            <div className="px-6 py-4 space-y-4">
              {user && (
                <div className="flex items-center space-x-3 pb-4 border-b border-neutral-800">
                  <img
                    src={user.image || "/default-avatar.png"}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full border border-neutral-700"
                  />
                  <span className="text-sm text-neutral-300">{user.name}</span>
                </div>
              )}
              <button 
                onClick={() => signOut()}
                className="w-full px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white border border-neutral-700 rounded-lg hover:border-neutral-600 transition-colors text-left"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 lg:px-8 pt-20 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Professional Time
            <span className="block text-neutral-400">Management</span>
          </h2>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Streamline your workflow with intelligent scheduling, task prioritization, and productivity insights designed for modern professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group cursor-pointer bg-white text-neutral-900 px-8 py-3 rounded-lg font-medium hover:bg-neutral-100 transition-all duration-200 flex items-center space-x-2"
              onClick={() => router.push("/dashboard")}>
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-3 cursor-pointer text-neutral-300 hover:text-white border border-neutral-700 rounded-lg hover:border-neutral-600 transition-colors"
              onClick={() => window.open("https://github.com/nk1044/timesync", "_blank")}>
              <Github className="inline-block w-5 h-5 mr-2" />
              Github
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              Everything you need to stay productive
            </h3>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              Powerful features designed to help you manage time more effectively and achieve your goals with clarity.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 bg-neutral-800/50 border border-neutral-700 rounded-xl hover:bg-neutral-800/70 hover:border-neutral-600 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-neutral-700 rounded-lg flex items-center justify-center mb-4 group-hover:bg-neutral-600 transition-colors">
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h4 className="text-lg font-medium text-white mb-2">{feature.title}</h4>
                <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-neutral-800/30 border border-neutral-700 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              Ready to transform your productivity?
            </h3>
            <p className="text-neutral-400 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have already streamlined their workflow with timeSync.
            </p>
            <button className="group bg-white text-neutral-900 px-8 py-3 rounded-lg font-medium hover:bg-neutral-100 transition-all duration-200 flex items-center space-x-2 mx-auto">
              <span>Start Your Free Trial</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-800 bg-neutral-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                <Clock className="w-4 h-4 text-neutral-900" />
              </div>
              <span className="font-semibold text-white">timeSync</span>
            </div>
            <p className="text-sm text-neutral-400">
              &copy; {new Date().getFullYear()} timeSync. Professional time management made simple.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}