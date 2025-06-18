import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUserStore } from "@/store/useUserStore";
import { Clock, ArrowRight, Shield, Users, Zap } from "lucide-react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setUser({
        name: session.user.name || "",
        email: session.user.email || "",
        image: session.user.image || "",
      });
      router.push("/");
    }
  }, [session]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google");
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Shield className="w-5 h-5" />,
      text: "Secure & Private"
    },
    {
      icon: <Users className="w-5 h-5" />,
      text: "Team Collaboration"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      text: "Lightning Fast"
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_50%)]"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-neutral-900" />
            </div>
            <h1 className="text-2xl font-semibold text-white">timeSync</h1>
          </div>
          <p className="text-neutral-400 text-sm">
            Professional time management made simple
          </p>
        </div>

        {/* Main card */}
        <div className="bg-neutral-800/50 backdrop-blur-xl border border-neutral-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Welcome back
            </h2>
            <p className="text-neutral-400 text-sm">
              Sign in to access your productivity dashboard
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={isLoading || status === "loading"}
            className="group w-full bg-white hover:bg-neutral-50 text-neutral-900 font-medium py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 border border-neutral-200 hover:border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || status === "loading" ? (
              <div className="w-5 h-5 border-2 border-neutral-400 border-t-neutral-900 rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-neutral-700">
            <div className="grid grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-8 h-8 bg-neutral-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <div className="text-neutral-300">
                      {feature.icon}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">
              By signing in, you agree to our{" "}
              <button className="text-neutral-300 hover:text-white underline underline-offset-2">
                Terms of Service
              </button>{" "}
              and{" "}
              <button className="text-neutral-300 hover:text-white underline underline-offset-2">
                Privacy Policy
              </button>
            </p>
          </div>
        </div>

        {/* Bottom info */}
        <div className="mt-8 text-center">
          <p className="text-neutral-500 text-sm">
            New to timeSync?{" "}
            <span className="text-neutral-300">Get started in seconds with Google</span>
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-white/10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-32 right-16 w-1 h-1 bg-white/10 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-white/10 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
    </div>
  );
}