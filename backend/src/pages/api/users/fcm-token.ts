import { connectDB } from "@/lib/config/db";
import { withAuth } from "@/lib/middleware/authMiddleware";
import type { NextApiResponse } from "next";
import type { AuthenticatedRequest } from "@/lib/models/user.model";
import { User } from "@/lib/models/user.model";

export default withAuth(
    async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
        const userEmail = req.user?.email;
        if (!userEmail) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userId = user._id;
        const { token } = req.body;
        console.log('✅token:', token);
        
        if (!token || !userId) {
            return res.status(400).json({ message: 'Missing token or userId' });
        }

        try {
            await connectDB();

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { fcmToken: token },
                { new: true } // return updated doc
            );

            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({ message: '✅ FCM token saved'});
        } catch (err) {
            console.error('❌ Error saving FCM token:', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);
