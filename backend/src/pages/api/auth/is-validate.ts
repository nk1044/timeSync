import { jwtVerify } from "jose";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No Bearer token provided" });
    }
    const tokenString = authHeader.replace("Bearer ", "").trim();
    if (!tokenString) {
        return res.status(401).json({ error: "Token is empty" });
    }
    // console.log("🔍 Validating token:", tokenString);
    try {
        const { payload } = await jwtVerify(
            tokenString,
            new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
        );
        // console.log("✅ Token payload:", payload);
        console.log("✅ Token is valid:", payload?.email);
        res.status(200).json({ valid: true, token: payload });
    } catch (error) {
        console.error("❌ Invalid token", error);
        res.status(401).json({ error: "Invalid or expired token" });
    }
}
