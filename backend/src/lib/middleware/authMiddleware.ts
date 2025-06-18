import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

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
      // Method 1: Standard NextAuth session (works with cookies)
      const session = await getServerSession(req, res, authOptions);
      
      if (session?.user?.email) {
        (req as AuthenticatedRequest).user = {
          email: session.user.email,
          id: session.user.id,
        };
        return handler(req as AuthenticatedRequest, res);
      }

      // Method 2: NextAuth JWT token from cookies
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET 
      });
      
      if (token?.email) {
        (req as AuthenticatedRequest).user = {
          email: token.email,
          id: token.sub,
        };
        return handler(req as AuthenticatedRequest, res);
      }

      // Method 3: Handle Authorization header by extracting and setting as cookie
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const jwtToken = authHeader.split(" ")[1];
        
        // Temporarily set the token as a cookie for NextAuth's getToken to work
        const originalSessionToken = req.cookies['next-auth.session-token'];
        const originalSecureToken = req.cookies['__Secure-next-auth.session-token'];
        
        // Set the token in cookies temporarily
        req.cookies['next-auth.session-token'] = jwtToken;
        
        try {
          const decodedToken = await getToken({ 
            req,
            secret: process.env.NEXTAUTH_SECRET 
          });
          
          console.log("✅ Token decoded from Authorization header:", !!decodedToken);
          
          if (decodedToken?.email) {
            (req as AuthenticatedRequest).user = {
              email: decodedToken.email,
              id: decodedToken.sub,
            };
            return handler(req as AuthenticatedRequest, res);
          }
        } catch (tokenError) {
          console.error("❌ Token verification failed:", tokenError);
        } finally {
          // Restore original cookies
          if (originalSessionToken) {
            req.cookies['next-auth.session-token'] = originalSessionToken;
          } else {
            delete req.cookies['next-auth.session-token'];
          }
          
          if (originalSecureToken) {
            req.cookies['__Secure-next-auth.session-token'] = originalSecureToken;
          }
        }
      }

      // Auth failed
      return res.status(401).json({ error: "Unauthorized" });
      
    } catch (error) {
      console.error("❌ Auth middleware error:", error);
      return res.status(500).json({ error: "Authentication error" });
    }
  };
}