import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL || "postgresql://bytechat:bytechat@localhost:5432/bytechat",
};
