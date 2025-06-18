import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useUserStore } from "@/store/useUserStore";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 transition-colors duration-300">
      <div className="w-full max-w-sm p-8 rounded-xl shadow-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
        <h1 className="text-3xl font-semibold text-center text-neutral-900 dark:text-neutral-100 mb-6">
          Sign in to Continue
        </h1>
        <p className="text-sm text-center text-neutral-500 dark:text-neutral-400 mb-8">
          Use your Google account to access the app
        </p>
        <button
          onClick={() => signIn("google")}
          className="w-full py-3 px-4 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-600 transition-all"
        >
          <img 
          className="inline-block mr-2 h-7 w-7"
          src="https://img.icons8.com/?size=100&id=YpTJTJYKapL1&format=png&color=000000" 
          alt="icon" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
