/**
 * إعدادات Paddle.js للعميل — من الخادم.
 *
 * client-side token عام (مخصص للمتصفح) لكن نقرأه من الخادم عشان يبقى
 * مكان واحد للإعداد ولا يُثبّت داخل الحزمة.
 */
import { createServerFn } from "@tanstack/react-start";

export interface PaddleClientConfig {
  token: string | null;
  environment: "sandbox" | "production";
}

export const getPaddleClientConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<PaddleClientConfig> => {
    const token = process.env["PADDLE_CLIENT_TOKEN"] ?? null;
    const env = process.env["PADDLE_ENV"] === "live" ? "production" : "sandbox";
    return { token, environment: env };
  },
);
