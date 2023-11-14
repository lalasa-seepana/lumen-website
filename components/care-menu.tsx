import Image from "next/image";
import { Arrow, Sun } from "@/components/icons";
import { experiences, formatInr } from "@/lib/content";
import type { Catalog, Category } from "@/lib/types";

export function CareMenu({
  catalog,
  loading,
  onChoose,
  onReload,
}: {
  catalog: Catalog | null;
  loading: boolean;
  onChoose: (category: Category, serviceId?: string) => void;
  onReload: () => void;
}) {
  return (
    <section id="rituals" className="section-shell" aria-labelledby="rituals-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE CARE MENU</p>
          <h2 id="rituals-title">Beauty, body and <em>skin.</em></h2>
        </div>
        <p>Choose the kind of care you need. A treatment, or a gentle conversation to help you decide.</p>
      </div>
      {catalog?.services.length ? (
        <div className="ritual-grid">
          {experiences.map((experience) => {
            const services = catalog.services.filter((service) => service.category === experience.category);
            if (!services.length) return null;
            return (
              <article className="ritual-card" key={experience.category}>
                <div className="ritual-image">
                  <Image src={experience.image} alt={experience.alt} fill sizes="(max-width: 760px) 90vw, 31vw" />
                  <span className="ritual-image-label">{experience.eyebrow}</span>
                </div>
                <h3>{experience.category}</h3>
                <p className="ritual-description">{experience.description}</p>
                <ul className="service-menu">
                  {services.map((service) => (
                    <li key={service.id}>
                      <a
                        href="#consultation"
                        onClick={() => onChoose(service.category, service.id)}
                        aria-label={`Enquire about ${service.name}, ${formatInr(service.price_paise)}`}
                      >
                        <span>{service.name}</span>
                        <span className="service-price">
                          {formatInr(service.price_paise)} <Arrow diagonal />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <a href="#consultation" className="guide-link" onClick={() => onChoose(experience.category)}>
                  Help me choose my care <Arrow />
                </a>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="catalog-unavailable" role="status">
          <Sun />
          <h3>The care menu is resting.</h3>
          <p>We couldn’t load current treatments and prices. Please try again in a moment.</p>
          <button type="button" className="button button-dark" onClick={onReload} disabled={loading}>
            {loading ? "Loading the menu…" : "Try again"}
            <Arrow />
          </button>
        </div>
      )}
      <p className="menu-note">Prices in INR. An enquiry is a request for care — it does not confirm an appointment.</p>
    </section>
  );
}
