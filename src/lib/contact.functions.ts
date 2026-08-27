import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactInput = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(120, "الاسم طويل جداً"),
  email: z.string().email("البريد الإلكتروني غير صحيح").max(255, "البريد طويل جداً"),
  subject: z.string().min(1, "الموضوع مطلوب").max(200, "الموضوع طويل جداً"),
  message: z.string().min(1, "الرسالة مطلوبة").max(5000, "الرسالة طويلة جداً"),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("contact_submissions").insert({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    });

    if (error) {
      console.error("[contact] insert failed", error.message);
      throw new Error("ما قدرنا نستقبل رسالتك. جرّب مرة ثانية.");
    }

    return { ok: true };
  });
