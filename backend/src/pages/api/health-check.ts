import { connectDB } from "@/lib/config/db";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  connectDB()
  .then(()=>{
    res.status(200).json({ message: "server is running fine👍" });
  })
  .catch(()=>{
    res.status(400).json({ message: "Errors while connecting to database" });
  })
}
