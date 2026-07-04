"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { IntakeCatalogDto, IntakeSiteTypeDto } from "@/lib/platform-api";
import {
  DESIGN_DIRECTION_LABELS,
  FEATURE_LABELS,
  INTEGRATION_LABELS,
  LANGUAGE_LABELS,
  PAYMENT_LABELS,
  SECTION_LABELS,
  SITE_TYPE_LABELS,
  labelFor,
  type BilingualLabel,
} from "./intake-labels";
import { createProjectAction, type NewProjectInput } from "./actions";

/**
 * Multi-step "New Project" intake form (client leaf — the whole flow is
 * interactive). Everything selectable is rendered FROM the platform's intake
 * catalog; the zod schema mirrors the platform rules for instant feedback, but
 * the platform's validation remains the source of truth (its 400 detail is
 * surfaced under the submit button).
 *
 * Labels are bilingual (en + ar) — Arabic fragments render RTL via dir="rtl";
 * the layout itself stays LTR like the rest of this internal dashboard.
 */

const baseSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required.").max(200),
  clientContact: z
    .string()
    .trim()
    .min(1, "Client contact (email or phone) is required.")
    .max(320),
  projectName: z.string().trim().min(1, "Project name is required.").max(200),
  siteType: z.string().min(1, "Choose a site type."),
  language: z.string().min(1, "Choose a language."),
  designDirection: z.string().min(1, "Choose a design direction."),
  sections: z.array(z.string()),
  payments: z.array(z.string()),
  integrations: z.array(z.string()),
  features: z.array(z.string()),
  notes: z.string().max(2000, "Notes must be at most 2000 characters."),
});

export type NewProjectFormValues = z.infer<typeof baseSchema>;

function buildSchema(catalog: IntakeCatalogDto) {
  return baseSchema.superRefine((values, ctx) => {
    const siteType = catalog.siteTypes.find((s) => s.siteType === values.siteType);
    if (values.siteType && !siteType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["siteType"],
        message: "Choose a valid site type.",
      });
    }
    if (values.language && !catalog.languages.includes(values.language)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["language"],
        message: "Choose a valid language.",
      });
    }
    if (
      values.designDirection &&
      !catalog.designDirections.includes(values.designDirection)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["designDirection"],
        message: "Choose a valid design direction.",
      });
    }
    if (siteType) {
      const allowed = new Set(siteType.sections.map((s) => s.key));
      const invalid = values.sections.filter((key) => !allowed.has(key));
      if (invalid.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sections"],
          message: `Not valid for this site type: ${invalid.join(", ")}.`,
        });
      }
      const missingCore = siteType.sections
        .filter((s) => s.core && !values.sections.includes(s.key))
        .map((s) => s.key);
      if (missingCore.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sections"],
          message: `Core sections are required: ${missingCore.join(", ")}.`,
        });
      }
    }
  });
}

const STEPS: { key: string; label: BilingualLabel }[] = [
  { key: "basics", label: { en: "Basics", ar: "الأساسيات" } },
  { key: "sections", label: { en: "Sections", ar: "الأقسام" } },
  { key: "addons", label: { en: "Add-ons", ar: "الإضافات" } },
  { key: "review", label: { en: "Review", ar: "المراجعة" } },
];

const STEP_FIELDS: (keyof NewProjectFormValues)[][] = [
  ["clientName", "clientContact", "projectName", "siteType", "language", "designDirection"],
  ["sections"],
  ["payments", "integrations", "features", "notes"],
  [],
];

function coreSections(siteType: IntakeSiteTypeDto | undefined): string[] {
  return siteType?.sections.filter((s) => s.core).map((s) => s.key) ?? [];
}

/** en + ar in one label; the Arabic fragment is explicitly RTL. */
function Bilingual({ label }: { label: BilingualLabel }) {
  return (
    <>
      <span>{label.en}</span>{" "}
      <span lang="ar" dir="rtl" className="text-muted-foreground">
        {label.ar}
      </span>
    </>
  );
}

export function NewProjectForm({ catalog }: { catalog: IntakeCatalogDto }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  const schema = useMemo(() => buildSchema(catalog), [catalog]);
  const defaultSiteType = catalog.siteTypes[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<NewProjectFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      clientName: "",
      clientContact: "",
      projectName: "",
      siteType: defaultSiteType?.siteType ?? "",
      language: "",
      designDirection: "",
      sections: coreSections(defaultSiteType),
      payments: [],
      integrations: [],
      features: [],
      notes: "",
    },
  });

  const values = watch();
  const selectedSiteType = catalog.siteTypes.find(
    (s) => s.siteType === values.siteType,
  );

  // Changing the site type changes the valid section set — reset the
  // selection to that site type's core (mandatory) sections.
  const siteTypeKey = values.siteType;
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const next = catalog.siteTypes.find((s) => s.siteType === siteTypeKey);
    setValue("sections", coreSections(next), { shouldValidate: false });
  }, [siteTypeKey, catalog, setValue]);

  // Move keyboard/screen-reader focus to the step heading on navigation.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  function toggle(
    field: "sections" | "payments" | "integrations" | "features",
    key: string,
  ) {
    const current = values[field];
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    setValue(field, next, { shouldValidate: true });
  }

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setServerError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  const onSubmit = handleSubmit((data) => {
    setServerError(null);
    startTransition(async () => {
      const input: NewProjectInput = {
        clientName: data.clientName,
        clientContact: data.clientContact,
        projectName: data.projectName,
        siteType: data.siteType,
        language: data.language,
        designDirection: data.designDirection,
        sections: data.sections,
        payments: data.payments,
        integrations: data.integrations,
        features: data.features,
        notes: data.notes,
      };
      const result = await createProjectAction(input);
      if (!result.ok || !result.projectId) {
        setServerError(result.error ?? "Something went wrong.");
        return;
      }
      router.push(`/projects/${result.projectId}`);
    });
  });

  const fieldError = (field: keyof NewProjectFormValues) =>
    errors[field]?.message as string | undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {/* Step indicator: done = green check, current = neon, upcoming = muted */}
      <div className="space-y-3">
        <ol className="flex flex-wrap gap-2" aria-label="Form steps">
          {STEPS.map((s, i) => (
            <li
              key={s.key}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                i === step &&
                  "border-primary/60 bg-primary/10 text-foreground shadow-glow-primary-sm",
                i < step && "border-success/40 bg-success/5 text-muted-foreground",
                i > step && "border-border text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full font-mono text-xs font-semibold",
                  i === step && "bg-primary text-primary-foreground",
                  i < step && "bg-success/20 text-success",
                  i > step && "bg-muted text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              <Bilingual label={s.label} />
            </li>
          ))}
        </ol>
        <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div
            className="h-full rounded-full bg-primary/70 motion-safe:transition-all motion-safe:duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          {/* CardTitle IS the heading element — nesting another heading inside
              it would be invalid HTML and break hydration. */}
          <CardTitle ref={headingRef} tabIndex={-1} className="focus:outline-none">
            <Bilingual label={STEPS[step]!.label} />
          </CardTitle>
          <CardDescription>
            {step === 0 && "Who the site is for and what kind of site it is."}
            {step === 1 &&
              "Sections shown on the site. Core sections are required and pre-selected."}
            {step === 2 &&
              "Optional payments, integrations and features. All can be added later."}
            {step === 3 && "Check everything, then register the project."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ---- Step 1: basics ---- */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="clientName">
                    <Bilingual label={{ en: "Client name", ar: "اسم العميل" }} />
                  </Label>
                  <Input
                    id="clientName"
                    {...register("clientName")}
                    aria-invalid={!!fieldError("clientName")}
                    aria-describedby={
                      fieldError("clientName") ? "clientName-error" : undefined
                    }
                  />
                  {fieldError("clientName") && (
                    <p id="clientName-error" role="alert" className="text-xs text-destructive">
                      {fieldError("clientName")}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clientContact">
                    <Bilingual
                      label={{ en: "Client contact", ar: "بيانات التواصل" }}
                    />
                  </Label>
                  <Input
                    id="clientContact"
                    placeholder="email or phone"
                    {...register("clientContact")}
                    aria-invalid={!!fieldError("clientContact")}
                    aria-describedby={
                      fieldError("clientContact") ? "clientContact-error" : undefined
                    }
                  />
                  {fieldError("clientContact") && (
                    <p id="clientContact-error" role="alert" className="text-xs text-destructive">
                      {fieldError("clientContact")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="projectName">
                  <Bilingual label={{ en: "Project name", ar: "اسم المشروع" }} />
                </Label>
                <Input
                  id="projectName"
                  {...register("projectName")}
                  aria-invalid={!!fieldError("projectName")}
                  aria-describedby={
                    fieldError("projectName") ? "projectName-error" : undefined
                  }
                />
                {fieldError("projectName") && (
                  <p id="projectName-error" role="alert" className="text-xs text-destructive">
                    {fieldError("projectName")}
                  </p>
                )}
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  <Bilingual label={{ en: "Site type", ar: "نوع الموقع" }} />
                </legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {catalog.siteTypes.map((s) => (
                    <label
                      key={s.siteType}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-input bg-background/40 p-3 text-sm transition-colors hover:border-primary/40 has-[:checked]:border-primary/60 has-[:checked]:bg-primary/[0.06] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                    >
                      <input
                        type="radio"
                        value={s.siteType}
                        {...register("siteType")}
                        className="size-4 accent-primary"
                      />
                      <span>
                        <Bilingual label={labelFor(SITE_TYPE_LABELS, s.siteType)} />
                      </span>
                    </label>
                  ))}
                </div>
                {fieldError("siteType") && (
                  <p role="alert" className="text-xs text-destructive">
                    {fieldError("siteType")}
                  </p>
                )}
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  <Bilingual label={{ en: "Language", ar: "اللغة" }} />
                </legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {catalog.languages.map((lang) => (
                    <label
                      key={lang}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-input bg-background/40 p-3 text-sm transition-colors hover:border-primary/40 has-[:checked]:border-primary/60 has-[:checked]:bg-primary/[0.06] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                    >
                      <input
                        type="radio"
                        value={lang}
                        {...register("language")}
                        className="size-4 accent-primary"
                      />
                      <span>
                        <Bilingual label={labelFor(LANGUAGE_LABELS, lang)} />
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Direction is derived: Arabic builds default to RTL, English-only to LTR.
                </p>
                {fieldError("language") && (
                  <p role="alert" className="text-xs text-destructive">
                    {fieldError("language")}
                  </p>
                )}
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  <Bilingual
                    label={{ en: "Design direction", ar: "التوجه التصميمي" }}
                  />
                </legend>
                <div className="grid gap-2 sm:grid-cols-4">
                  {catalog.designDirections.map((d) => (
                    <label
                      key={d}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-input bg-background/40 p-3 text-sm transition-colors hover:border-primary/40 has-[:checked]:border-primary/60 has-[:checked]:bg-primary/[0.06] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                    >
                      <input
                        type="radio"
                        value={d}
                        {...register("designDirection")}
                        className="size-4 accent-primary"
                      />
                      <span>
                        <Bilingual label={labelFor(DESIGN_DIRECTION_LABELS, d)} />
                      </span>
                    </label>
                  ))}
                </div>
                {fieldError("designDirection") && (
                  <p role="alert" className="text-xs text-destructive">
                    {fieldError("designDirection")}
                  </p>
                )}
              </fieldset>
            </div>
          )}

          {/* ---- Step 2: sections (per siteType, from the platform catalog) ---- */}
          {step === 1 && selectedSiteType && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                <Bilingual
                  label={{
                    en: `Sections for ${labelFor(SITE_TYPE_LABELS, selectedSiteType.siteType).en}`,
                    ar: "أقسام الموقع",
                  }}
                />
              </legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {selectedSiteType.sections.map((section) => {
                  const checked = values.sections.includes(section.key);
                  return (
                    <label
                      key={section.key}
                      className={cn(
                        "flex items-center gap-3 rounded-md border border-input bg-background/40 p-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                        section.core
                          ? "cursor-not-allowed opacity-90"
                          : "cursor-pointer hover:border-primary/40",
                        checked && "border-primary/60 bg-primary/[0.06]",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={section.core}
                        onChange={() => toggle("sections", section.key)}
                        className="size-4 accent-primary"
                        aria-label={`${labelFor(SECTION_LABELS, section.key).en}${section.core ? " (required)" : ""}`}
                      />
                      <span className="flex-1">
                        <Bilingual label={labelFor(SECTION_LABELS, section.key)} />
                      </span>
                      {section.core && <Badge variant="secondary">Required</Badge>}
                    </label>
                  );
                })}
              </div>
              {fieldError("sections") && (
                <p role="alert" className="text-xs text-destructive">
                  {fieldError("sections")}
                </p>
              )}
            </fieldset>
          )}

          {/* ---- Step 3: optional add-ons ---- */}
          {step === 2 && (
            <div className="space-y-6">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  <Bilingual label={{ en: "Payments (optional)", ar: "المدفوعات (اختياري)" }} />
                </legend>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {catalog.payments.map((key) => (
                    <label
                      key={key}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md border border-input bg-background/40 p-3 text-sm transition-colors hover:border-primary/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                        values.payments.includes(key) &&
                          "border-primary/60 bg-primary/[0.06]",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={values.payments.includes(key)}
                        onChange={() => toggle("payments", key)}
                        className="size-4 accent-primary"
                      />
                      <span>
                        <Bilingual label={labelFor(PAYMENT_LABELS, key)} />
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  <Bilingual
                    label={{ en: "Integrations (optional)", ar: "التكاملات (اختياري)" }}
                  />
                </legend>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {catalog.integrations.map((key) => {
                    const recommended =
                      selectedSiteType?.recommendedIntegrations.includes(key) ?? false;
                    return (
                      <label
                        key={key}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-md border border-input bg-background/40 p-3 text-sm transition-colors hover:border-primary/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                          values.integrations.includes(key) &&
                            "border-primary/60 bg-primary/[0.06]",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={values.integrations.includes(key)}
                          onChange={() => toggle("integrations", key)}
                          className="size-4 accent-primary"
                        />
                        <span className="flex-1">
                          <Bilingual label={labelFor(INTEGRATION_LABELS, key)} />
                        </span>
                        {recommended && (
                          <Badge variant="success">
                            Recommended · {catalog.market}
                          </Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  <Bilingual label={{ en: "Features (optional)", ar: "المزايا (اختياري)" }} />
                </legend>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {catalog.features.map((key) => (
                    <label
                      key={key}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md border border-input bg-background/40 p-3 text-sm transition-colors hover:border-primary/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                        values.features.includes(key) &&
                          "border-primary/60 bg-primary/[0.06]",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={values.features.includes(key)}
                        onChange={() => toggle("features", key)}
                        className="size-4 accent-primary"
                      />
                      <span>
                        <Bilingual label={labelFor(FEATURE_LABELS, key)} />
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-1.5">
                <Label htmlFor="notes">
                  <Bilingual label={{ en: "Notes (optional)", ar: "ملاحظات (اختياري)" }} />
                </Label>
                <Textarea id="notes" {...register("notes")} />
                {fieldError("notes") && (
                  <p role="alert" className="text-xs text-destructive">
                    {fieldError("notes")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ---- Step 4: review ---- */}
          {step === 3 && (
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <ReviewRow label={{ en: "Client", ar: "العميل" }}>
                {values.clientName} · {values.clientContact}
              </ReviewRow>
              <ReviewRow label={{ en: "Project", ar: "المشروع" }}>
                {values.projectName}
              </ReviewRow>
              <ReviewRow label={{ en: "Site type", ar: "نوع الموقع" }}>
                <Bilingual label={labelFor(SITE_TYPE_LABELS, values.siteType)} />
              </ReviewRow>
              <ReviewRow label={{ en: "Language & direction", ar: "اللغة والاتجاه" }}>
                <Bilingual label={labelFor(LANGUAGE_LABELS, values.language)} />{" "}
                <Badge variant="secondary">
                  {values.language === "en" ? "LTR" : "RTL"}
                </Badge>
              </ReviewRow>
              <ReviewRow label={{ en: "Design direction", ar: "التوجه التصميمي" }}>
                <Bilingual
                  label={labelFor(DESIGN_DIRECTION_LABELS, values.designDirection)}
                />
              </ReviewRow>
              <ReviewRow label={{ en: "Sections", ar: "الأقسام" }}>
                {values.sections.map((key) => (
                  <Badge key={key} variant="secondary" className="me-1 mt-1">
                    {labelFor(SECTION_LABELS, key).en}
                  </Badge>
                ))}
              </ReviewRow>
              <ReviewRow label={{ en: "Payments", ar: "المدفوعات" }}>
                {values.payments.length === 0
                  ? "—"
                  : values.payments.map((k) => labelFor(PAYMENT_LABELS, k).en).join(", ")}
              </ReviewRow>
              <ReviewRow label={{ en: "Integrations", ar: "التكاملات" }}>
                {values.integrations.length === 0
                  ? "—"
                  : values.integrations
                      .map((k) => labelFor(INTEGRATION_LABELS, k).en)
                      .join(", ")}
              </ReviewRow>
              <ReviewRow label={{ en: "Features", ar: "المزايا" }}>
                {values.features.length === 0
                  ? "—"
                  : values.features.map((k) => labelFor(FEATURE_LABELS, k).en).join(", ")}
              </ReviewRow>
              {values.notes.trim() && (
                <ReviewRow label={{ en: "Notes", ar: "ملاحظات" }}>
                  {values.notes}
                </ReviewRow>
              )}
            </dl>
          )}

          {serverError && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {serverError}
            </p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={step === 0 || isPending}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              // Distinct keys force a remount between Next and Create project —
              // reusing one DOM node would swap type button→submit mid-click and
              // fire a premature submit (the classic React button-type race).
              <Button key="next" type="button" size="lg" onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button
                key="submit"
                type="submit"
                size="lg"
                disabled={isPending}
                data-testid="submit-project"
              >
                {isPending ? "Creating…" : "Create project"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function ReviewRow({
  label,
  children,
}: {
  label: BilingualLabel;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground">
        <Bilingual label={label} />
      </dt>
      <dd className="font-medium text-foreground">{children}</dd>
    </div>
  );
}
