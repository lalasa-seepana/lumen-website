import Image from "next/image";
import { Arrow, Sun } from "@/components/icons";

export function Hero() {
  return (
    <section className="hero" id="welcome" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="small-line" /> BEAUTY &amp; CARE
        </p>
        <h1 id="hero-title">
          Glow, softened.
          <br />
          Care, <em>considered.</em>
        </h1>
        <p className="hero-description">
          Massage, skin rituals and body care — chosen slowly, for how you want to feel. Browse the menu, then tell us where your care should begin.
        </p>
        <div className="hero-actions">
          <a href="#rituals" className="button button-dark">
            Explore the care menu <Arrow />
          </a>
          <a href="#consultation" className="text-link">
            Request a consultation <Arrow diagonal />
          </a>
        </div>
        <div className="hero-footnote">
          <Sun />
          <p>
            Skin, body, quiet.
            <br />
            <span>Beauty as a way of being cared for.</span>
          </p>
        </div>
      </div>
      <div className="hero-visual">
        <Image
          src="/images/lumen-sanctuary.webp"
          alt="Sunlight falling through an arch in a serene, cream-toned spa interior"
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(max-width: 760px) 100vw, 55vw"
          className="hero-image"
        />
        <div className="image-tag">
          <span className="tiny-sun">✳︎</span> A SPACE TO SIMPLY BE
        </div>
        <span className="hero-caption">LUMEN · A DEMONSTRATION</span>
      </div>
    </section>
  );
}
