"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  payloadSettingsApi,
  type LocalizedValue,
} from "../api/payloadSettingsApi";

/**
 * Site settings form (client module): edits the Payload `siteSettings` global
 * through REST with the session's Payload JWT. Both locales edited side by
 * side so ar never lags en.
 */

const settingsSchema = z.object({
  taglineEn: z.string(),
  taglineAr: z.string(),
  announcementEn: z.string(),
  announcementAr: z.string(),
  supportEmail: z.string().email().or(z.literal("")),
  supportPhone: z.string(),
  twitter: z.string(),
  instagram: z.string(),
  tiktok: z.string(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

function pick(value: string | LocalizedValue | null | undefined, locale: "en" | "ar"): string {
  if (value && typeof value === "object") return value[locale] ?? "";
  return typeof value === "string" ? value : "";
}

export function SettingsForm({ payloadToken }: { payloadToken: string }) {
  const t = useTranslations("dashboardSettings");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema) });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await payloadSettingsApi.get(payloadToken);
        if (cancelled) return;
        form.reset({
          taglineEn: pick(settings.tagline, "en"),
          taglineAr: pick(settings.tagline, "ar"),
          announcementEn: pick(settings.announcement, "en"),
          announcementAr: pick(settings.announcement, "ar"),
          supportEmail: settings.supportEmail ?? "",
          supportPhone: settings.supportPhone ?? "",
          twitter: settings.social?.twitter ?? "",
          instagram: settings.social?.instagram ?? "",
          tiktok: settings.social?.tiktok ?? "",
        });
      } catch {
        // First run: the global may not exist yet — start blank.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form, payloadToken]);

  async function onSubmit(values: SettingsValues) {
    setSaving(true);
    try {
      await payloadSettingsApi.update(payloadToken, values);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="taglineEn">{t("taglineEn")}</Label>
          <Input id="taglineEn" {...form.register("taglineEn")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="taglineAr">{t("taglineAr")}</Label>
          <Input id="taglineAr" dir="rtl" {...form.register("taglineAr")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="announcementEn">{t("announcementEn")}</Label>
          <Input id="announcementEn" {...form.register("announcementEn")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="announcementAr">{t("announcementAr")}</Label>
          <Input id="announcementAr" dir="rtl" {...form.register("announcementAr")} />
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="supportEmail">{t("supportEmail")}</Label>
          <Input id="supportEmail" type="email" dir="ltr" {...form.register("supportEmail")} />
          {form.formState.errors.supportEmail && (
            <p role="alert" className="text-sm text-destructive">
              {t("invalidEmail")}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supportPhone">{t("supportPhone")}</Label>
          <Input id="supportPhone" dir="ltr" {...form.register("supportPhone")} />
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="twitter">{t("twitter")}</Label>
          <Input id="twitter" dir="ltr" {...form.register("twitter")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="instagram">{t("instagram")}</Label>
          <Input id="instagram" dir="ltr" {...form.register("instagram")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tiktok">{t("tiktok")}</Label>
          <Input id="tiktok" dir="ltr" {...form.register("tiktok")} />
        </div>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
