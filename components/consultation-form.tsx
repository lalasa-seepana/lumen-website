"use client";

import { useState, type FormEvent, type RefObject } from "react";
import { Arrow, Sun } from "@/components/icons";
import { experiences, formatInr } from "@/lib/content";
import { PUBLIC_PHONE, type Catalog, type Category, type Receipt } from "@/lib/types";

export function ConsultationForm({
  catalog,
  category,
  serviceId,
  token,
  tokenError,
  submitting,
  formError,
  receipt,
  formRef,
  successRef,
  errorRef,
  onSubmit,
  onCategoryChange,
  onServiceChange,
  onRefreshToken,
  onSendAnother,
}: {
  catalog: Catalog | null;
  category: Category;
  serviceId: string;
  token: string;
  tokenError: boolean;
  submitting: boolean;
  formError: string;
  receipt: Receipt | null;
  formRef: RefObject<HTMLFormElement | null>;
  successRef: RefObject<HTMLDivElement | null>;
  errorRef: RefObject<HTMLParagraphElement | null>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCategoryChange: (category: Category) => void;
  onServiceChange: (serviceId: string) => void;
  onRefreshToken: () => void;
  onSendAnother: () => void;
}) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const phone = catalog?.phone || PUBLIC_PHONE;
  const availableCategories = experiences.filter((item) => catalog?.services.some((service) => service.category === item.category));

  return (
    <section id="consultation" className="consultation-section section-shell" aria-labelledby="consultation-title">
      <div className="consultation-copy">
        <p className="eyebrow">YOUR CONSULTATION</p>
        <h2 id="consultation-title">Tell us how you’d like to be <em>cared for.</em></h2>
        <p>Share a little about yourself and the care you have in mind. We save the enquiry. This page does not book a time or place a call.</p>
        <div className="consultation-note">
          <Sun />
          <p>A quiet first step toward your ritual.</p>
        </div>
        <div className="demo-disclosure">
          <span className="demo-dot" />
          <p>
            <strong>Demonstration</strong>
            Demo records here were created for this project. Submissions are stored for the demo only — no appointment or call is created.
          </p>
        </div>
      </div>
      <div className="form-panel">
        {receipt ? (
          <div className="success-state" role="status" tabIndex={-1} ref={successRef}>
            <span className="success-icon">✓</span>
            <p className="eyebrow">ENQUIRY RECEIVED</p>
            <h3>
              Your enquiry
              <br />
              <em>is saved.</em>
            </h3>
            <p>Thank you. Your interest in {category.toLowerCase()} and your consent choice have been recorded.</p>
            <p className="success-note">No appointment has been confirmed and no automated call will be placed.</p>
            <span className="receipt-reference">REFERENCE · {receipt.id.slice(0, 8).toUpperCase()}</span>
            <button type="button" className="text-link" onClick={onSendAnother}>
              Send another enquiry <Arrow />
            </button>
          </div>
        ) : (
          <form ref={formRef} onSubmit={onSubmit} aria-label="Consultation enquiry" aria-busy={submitting}>
            <div className="form-topline">
              <h3>Your care details</h3>
              <span>CONSULTATION</span>
            </div>
            <fieldset disabled={submitting} className="form-fields">
              <legend className="sr-only">Your consultation details</legend>
              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="full-name">
                    Full name <span aria-hidden="true">*</span>
                  </label>
                  <input id="full-name" name="full_name" placeholder="Your full name" autoComplete="name" required minLength={2} maxLength={120} />
                </div>
                <div className="input-group">
                  <label htmlFor="email">
                    Email address <span aria-hidden="true">*</span>
                  </label>
                  <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required maxLength={254} />
                </div>
              </div>
              <div className="input-group phone-field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" inputMode="tel" placeholder="Optional phone number" autoComplete="tel" maxLength={20} />
              </div>
              <fieldset className="category-field">
                <legend>
                  The care you need <span aria-hidden="true">*</span>
                </legend>
                <div className="category-options">
                  {availableCategories.map((item) => (
                    <label key={item.category} className={category === item.category ? "category-option selected" : "category-option"}>
                      <input
                        type="radio"
                        name="category"
                        value={item.category}
                        checked={category === item.category}
                        onChange={() => onCategoryChange(item.category)}
                        required
                      />
                      <span>{item.category}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="input-group service-select">
                <label htmlFor="service-choice">Treatment</label>
                <select id="service-choice" name="service_id" value={serviceId} onChange={(event) => onServiceChange(event.target.value)}>
                  <option value="">Not yet decided — guide my care</option>
                  {catalog?.services
                    .filter((service) => service.category === category)
                    .map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} — {formatInr(service.price_paise)}
                      </option>
                    ))}
                </select>
              </div>
              <div className="honeypot" aria-hidden="true">
                <label htmlFor="website">Leave this field empty</label>
                <input id="website" name="website" autoComplete="off" tabIndex={-1} />
              </div>
              <label className="consent">
                <input name="ai_call_consent" type="checkbox" defaultChecked />
                <span>
                  I agree to receive calls from Lumen&apos;s AI receptionist about my enquiry.
                  <small>Optional. Uncheck to opt out. This demo records your choice; it does not place calls.</small>
                </span>
              </label>
            </fieldset>
            {formError ? (
              <p className="form-error" role="alert" tabIndex={-1} ref={errorRef}>
                {formError}
              </p>
            ) : null}
            {tokenError ? (
              <p className="form-error" role="alert">
                The form couldn’t connect.{" "}
                <button type="button" onClick={onRefreshToken}>
                  Reconnect and try again
                </button>
                .
              </p>
            ) : null}
            {!catalog?.services.length ? <p className="form-error">Please reload the service menu above before sending an enquiry.</p> : null}
            <button className="button button-dark submit-button" type="submit" disabled={submitting || !token || !catalog?.services.length}>
              {submitting ? "Sending your enquiry…" : "Request this care"}
              <Arrow />
            </button>
            <p className="form-fineprint">
              An enquiry only — no booking or payment.
              <br />
              Read{" "}
              <button type="button" onClick={() => setPrivacyOpen(!privacyOpen)} aria-expanded={privacyOpen} aria-controls="privacy-note">
                how we use your details
              </button>
              .
            </p>
            {privacyOpen ? (
              <div id="privacy-note" className="privacy-note">
                Your name, email, optional phone number, chosen category, optional service, consent choice and submission time are stored for this demonstration. No appointment or AI call is created. Please use demonstration details instead of sensitive medical information. Contact {phone} for enquiries about your submission.
              </div>
            ) : null}
          </form>
        )}
      </div>
    </section>
  );
}
