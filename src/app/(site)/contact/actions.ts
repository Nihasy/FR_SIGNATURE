"use server";

import { publicClient } from "@/lib/supabase/public";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  fields?: Record<string, string>;
  errors?: Partial<Record<"name" | "email" | "message", string>>;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const fields = {
    name: get("name"),
    email: get("email"),
    phone: get("phone"),
    company: get("company"),
    service: get("service"),
    message: get("message"),
  };

  // Champ piège invisible : les robots le remplissent, pas les humains.
  if (get("website")) return { status: "success", message: "Merci, votre message a bien été envoyé." };

  const errors: ContactState["errors"] = {};
  if (!fields.name || fields.name.length > 120) errors.name = "Indiquez votre nom.";
  if (!EMAIL_RE.test(fields.email) || fields.email.length > 200) errors.email = "Adresse e-mail invalide.";
  if (fields.message.length < 10) errors.message = "Votre message doit contenir au moins 10 caractères.";
  if (fields.message.length > 5000) errors.message = "Votre message est trop long (5000 caractères max).";
  if (Object.keys(errors).length) {
    return { status: "error", message: "Merci de corriger les champs indiqués.", errors, fields };
  }

  const { error } = await publicClient()
    .from("messages")
    .insert({
      name: fields.name,
      email: fields.email,
      phone: fields.phone.slice(0, 40) || null,
      company: fields.company.slice(0, 120) || null,
      service: fields.service.slice(0, 120) || null,
      message: fields.message,
    });

  if (error) {
    const throttled = error.message.includes("too_many_messages");
    return {
      status: "error",
      message: throttled
        ? "Vous avez envoyé plusieurs messages récemment. Merci de réessayer dans quelques minutes."
        : "L'envoi a échoué. Réessayez ou écrivez-moi directement par e-mail.",
      fields,
    };
  }
  return { status: "success", message: "Merci, votre message a bien été envoyé. Je vous réponds au plus vite." };
}
