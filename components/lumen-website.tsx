"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CareMenu } from "@/components/care-menu";
import { ConsultationForm } from "@/components/consultation-form";
import { Hero } from "@/components/hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ApiError, challengeNeedsRefresh, getFormChallenge, getLumenCatalog, submitConsultation, waitForChallenge } from "@/lib/api";
import type { Catalog, Category, Receipt } from "@/lib/types";

export function LumenWebsite({ initialCatalog }: { initialCatalog: Catalog | null }) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [category, setCategory] = useState<Category>("Heal Your Mind");
  const [serviceId, setServiceId] = useState("");
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const inFlight = useRef(false);
  const tokenIssued = useRef(0);

  async function refreshToken() {
    setTokenError(false);
    try {
      const challenge = await getFormChallenge();
      setToken(challenge.token);
      tokenIssued.current = challenge.receivedAt;
      return challenge.token;
    } catch {
      setTokenError(true);
      setToken("");
      return "";
    }
  }

  useEffect(() => {
    let active = true;
    getFormChallenge()
      .then((challenge) => {
        if (active) {
          setToken(challenge.token);
          tokenIssued.current = challenge.receivedAt;
        }
      })
      .catch(() => {
        if (active) setTokenError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (receipt) successRef.current?.focus();
    else if (formError) errorRef.current?.focus();
  }, [receipt, formError]);

  async function reloadCatalog() {
    setCatalogLoading(true);
    try {
      const nextCatalog = await getLumenCatalog();
      const nextCategory = nextCatalog.services.some((service) => service.category === category)
        ? category
        : nextCatalog.services[0]?.category || category;
      setCatalog(nextCatalog);
      setCategory(nextCategory);
      setServiceId((current) =>
        nextCatalog.services.some((service) => service.id === current && service.category === nextCategory) ? current : "",
      );
    } catch {
      setCatalog(null);
    } finally {
      setCatalogLoading(false);
    }
  }

  function chooseService(chosenCategory: Category, id = "") {
    setCategory(chosenCategory);
    setServiceId(id);
    setReceipt(null);
    setFormError("");
    if (receipt) void refreshToken();
    window.setTimeout(() => document.getElementById("full-name")?.focus({ preventScroll: true }), 100);
  }

  async function sendEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !catalog?.services.length) return;
    inFlight.current = true;
    setSubmitting(true);
    setFormError("");
    const data = new FormData(event.currentTarget);
    try {
      let currentToken = token;
      if (!currentToken || challengeNeedsRefresh(tokenIssued.current)) currentToken = await refreshToken();
      if (!currentToken) throw new Error("form unavailable");
      await waitForChallenge(tokenIssued.current);
      const result = await submitConsultation({
        full_name: String(data.get("full_name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        category,
        service_id: serviceId || null,
        ai_call_consent: data.get("ai_call_consent") === "on",
        website: String(data.get("website") || ""),
        form_token: currentToken,
      });
      setReceipt(result);
      formRef.current?.reset();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "form_expired" || error.code === "submission_conflict") await refreshToken();
        if (error.code === "service_unavailable") void reloadCatalog();
        setFormError(
          error.code === "rate_limited"
            ? "A few too many enquiries have been sent. Please try again in an hour. Your details are still here."
            : error.message,
        );
      } else {
        setFormError("We couldn’t confirm your enquiry. Please check your connection and try again. Retrying the same enquiry won’t create a duplicate.");
      }
    } finally {
      setSubmitting(false);
      inFlight.current = false;
    }
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <CareMenu catalog={catalog} loading={catalogLoading} onChoose={chooseService} onReload={() => void reloadCatalog()} />
        <ConsultationForm
          catalog={catalog}
          category={category}
          serviceId={serviceId}
          token={token}
          tokenError={tokenError}
          submitting={submitting}
          formError={formError}
          receipt={receipt}
          formRef={formRef}
          successRef={successRef}
          errorRef={errorRef}
          onSubmit={(event) => void sendEnquiry(event)}
          onCategoryChange={(nextCategory) => {
            setCategory(nextCategory);
            setServiceId("");
          }}
          onServiceChange={setServiceId}
          onRefreshToken={() => void refreshToken()}
          onSendAnother={() => {
            setReceipt(null);
            setServiceId("");
            void refreshToken();
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
