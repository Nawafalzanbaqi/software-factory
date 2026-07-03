"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { payloadCatalogApi } from "../api/payloadCatalogApi";
import {
  localizedText,
  type CatalogCollectionConfig,
  type CatalogDoc,
} from "../types";

/**
 * Interactive catalog manager (client module): lists the vertical's catalog
 * collection through Payload REST with the session's Payload JWT and edits
 * docs in a dialog (react-hook-form + zod). The collection (products vs
 * menuItems) is decided server-side by getSiteType() and passed down.
 */

const editSchema = z.object({
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  price: z.coerce.number().min(0),
  available: z.boolean(),
});

type EditValues = z.infer<typeof editSchema>;

export function CatalogManager({
  collection,
  currency,
  payloadToken,
}: {
  collection: CatalogCollectionConfig;
  currency: string;
  payloadToken: string;
}) {
  const t = useTranslations("dashboardCatalog");
  const locale = useLocale();
  const [docs, setDocs] = useState<CatalogDoc[] | null>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<CatalogDoc | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<EditValues>({ resolver: zodResolver(editSchema) });

  // Refetch by bumping refreshKey — the effect owns the only fetch path.
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await payloadCatalogApi.list(collection.slug, payloadToken);
        if (!cancelled) {
          setDocs(res.docs ?? []);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setDocs([]);
          setError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collection.slug, payloadToken, refreshKey]);

  function openEdit(doc: CatalogDoc) {
    setEditing(doc);
    form.reset({
      nameEn: localizedText(doc.name, "en"),
      nameAr: localizedText(doc.name, "ar"),
      price: doc.price ?? 0,
      available: Boolean(doc[collection.availabilityField]),
    });
  }

  async function onSubmit(values: EditValues) {
    if (!editing) return;
    setSaving(true);
    try {
      await payloadCatalogApi.update(collection.slug, editing.id, payloadToken, {
        nameEn: values.nameEn,
        nameAr: values.nameAr,
        price: values.price,
        availabilityField: collection.availabilityField,
        available: values.available,
      });
      toast.success(t("saved"));
      setEditing(null);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  if (docs === null) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t("loadError")}
        </p>
      )}

      {docs.length === 0 && !error ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[36rem] text-sm" data-testid="catalog-table">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t("colName")}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t("colPrice")}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t("colAvailability")}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-medium">
                  <span className="sr-only">{t("colActions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const available = Boolean(doc[collection.availabilityField]);
                const name =
                  localizedText(doc.name, locale === "ar" ? "ar" : "en") ||
                  localizedText(doc.name, "en");
                return (
                  <tr key={String(doc.id)} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-medium" data-testid="catalog-item-name">
                      {name}
                      <span className="ms-2 text-xs text-muted-foreground">{doc.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      {formatPrice(doc.price ?? 0, currency, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={available ? "default" : "destructive"}>
                        {available ? t("available") : t("unavailable")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(doc)}
                        data-testid={`catalog-edit-${doc.slug}`}
                      >
                        {t("edit")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
            <DialogDescription>{t("editSubtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="nameEn">{t("nameEn")}</Label>
              <Input id="nameEn" {...form.register("nameEn")} data-testid="catalog-name-en" />
              {form.formState.errors.nameEn && (
                <p role="alert" className="text-sm text-destructive">
                  {t("required")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nameAr">{t("nameAr")}</Label>
              <Input id="nameAr" dir="rtl" {...form.register("nameAr")} data-testid="catalog-name-ar" />
              {form.formState.errors.nameAr && (
                <p role="alert" className="text-sm text-destructive">
                  {t("required")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">{t("price")}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                {...form.register("price")}
                data-testid="catalog-price"
              />
              {form.formState.errors.price && (
                <p role="alert" className="text-sm text-destructive">
                  {t("invalidPrice")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="available"
                type="checkbox"
                className="size-4 accent-accent"
                {...form.register("available")}
              />
              <Label htmlFor="available">{t("availableLabel")}</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={saving} data-testid="catalog-save">
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
