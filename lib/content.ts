import type { Category } from "./types.ts";

type Experience = {
  category: Category;
  eyebrow: string;
  description: string;
  image: string;
  alt: string;
};

export const experiences: Experience[] = [
  {
    category: "Heal Your Mind",
    eyebrow: "01 / QUIET THE MIND",
    description: "Massage rituals that soften the day and settle the nervous system.",
    image: "/images/massage.jpg",
    alt: "Warm massage oil being poured during a spa ritual",
  },
  {
    category: "Heal Your Body",
    eyebrow: "02 / TEND THE BODY",
    description: "Warm oils, stones and traditional body care to restore ease.",
    image: "/images/body-ritual.webp",
    alt: "Natural textures and warm sunlight in a peaceful spa",
  },
  {
    category: "Skin & Body Rituals",
    eyebrow: "03 / GLOW THE SKIN",
    description: "Facials, wraps and polishes for skin that feels tended, not treated.",
    image: "/images/facial.jpg",
    alt: "A gentle facial treatment in a calm spa setting",
  },
];

export function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
