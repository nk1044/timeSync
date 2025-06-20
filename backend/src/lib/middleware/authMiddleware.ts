import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import { jwtVerify } from "jose";
import { logger } from "../config/logger";

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
    logger.info("🔒 Auth middleware triggered");
    try {
      // 1️⃣ Check standard NextAuth session via cookies
      const session = await getServerSession(req, res, authOptions);
      logger.info("🔍 Checking session");
      if (session?.user?.email && session.user.id) {
        (req as AuthenticatedRequest).user = {
          email: session.user.email,
          id: session.user.id,
        };
        logger.info(`✅ Session found for user: ${session.user.email}`);
        return handler(req as AuthenticatedRequest, res);
      }

      // 2️⃣ Check Bearer token in Authorization header (e.g. from mobile apps)
      const authHeader = req.headers.authorization;
      // console.log("🔍 Authorization header:", authHeader);
      logger.info("🔍 Checking Authorization header");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        logger.info("🔍 Bearer token found in Authorization header");
        if (!token) {
          logger.warn("❌ No Bearer token found in Authorization header");
          return res.status(401).json({ error: "Unauthorized" });
        }
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) throw new Error("NEXTAUTH_SECRET not defined");
        logger.info("🔍 Verifying Bearer token with secret");
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(secret)
        );
        logger.info(`✅ Bearer token verified for user: ${payload.email}`);
        if (payload.email && payload.sub) {
          (req as AuthenticatedRequest).user = {
            email: payload.email as string,
            id: payload.sub as string,
          };
          logger.info("✅ User authenticated via Bearer token");
          return handler(req as AuthenticatedRequest, res);
        }
      }
      logger.info("🔍 No valid session or Bearer token found");
      // ❌ If all auth methods fail
      return res.status(401).json({ error: "Unauthorized" });
    } catch (error) {
      logger.error(`❌ Auth middleware error: ${error}`);
      return res.status(500).json({ error: "Authentication error" });
    }
  };
}
