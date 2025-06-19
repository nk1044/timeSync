import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import { jwtVerify } from "jose";

interface AuthenticatedRequest extends NextApiRequest {
  user: {
    email: string;
    id: string;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<any>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // 1️⃣ Check standard NextAuth session via cookies
      const session = await getServerSession(req, res, authOptions);
      if (session?.user?.email && session.user.id) {
        (req as AuthenticatedRequest).user = {
          email: session.user.email,
          id: session.user.id,
        };
        return handler(req as AuthenticatedRequest, res);
      }

      // 2️⃣ Check Bearer token in Authorization header (e.g. from mobile apps)
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) throw new Error("NEXTAUTH_SECRET not defined");

        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(secret)
        );

        if (payload.email && payload.sub) {
          (req as AuthenticatedRequest).user = {
            email: payload.email as string,
            id: payload.sub as string,
          };
          return handler(req as AuthenticatedRequest, res);
        }
      }

      // ❌ If all auth methods fail
      return res.status(401).json({ error: "Unauthorized" });
    } catch (error) {
      console.error("❌ Auth middleware error:", error);
      return res.status(500).json({ error: "Authentication error" });
    }
  };
}
