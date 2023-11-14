export type Category = "Heal Your Mind" | "Heal Your Body" | "Skin & Body Rituals";

export type Service = {
  id: string;
  name: string;
  category: Category;
  price_paise: number;
};

export type Catalog = {
  phone: string;
  services: Service[];
};

export type Challenge = { token: string; expires_in: number };

export type Consultation = {
  full_name: string;
  email: string;
  phone: string | null;
  category: Category;
  service_id: string | null;
  ai_call_consent: boolean;
  form_token: string;
  website: string;
};

export type Receipt = { id: string; status: "enquiry_received"; created_at: string };

export const CATEGORIES = ["Heal Your Mind", "Heal Your Body", "Skin & Body Rituals"] as const;

export const CONSENT_TEXT = "I agree to receive calls from Lumen's AI receptionist about my enquiry.";
export const CONSENT_VERSION = "lumen-ai-calls-v1";

export const PUBLIC_PHONE = "1234567890";
