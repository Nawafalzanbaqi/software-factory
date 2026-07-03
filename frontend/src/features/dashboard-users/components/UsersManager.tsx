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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { payloadUsersApi } from "../api/payloadUsersApi";
import { ASSIGNABLE_ROLES, type AssignableRole, type DashboardUser } from "../types";

/**
 * Owner-only user management (client module): list team members, invite a new
 * owner/staff account, switch owner<->staff, remove accounts. The Payload
 * users collection enforces the same rules server-side (field access +
 * privilege-escalation validate) — this UI is convenience, not the gate.
 */

const inviteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ASSIGNABLE_ROLES),
});

type InviteValues = z.infer<typeof inviteSchema>;

export function UsersManager({
  payloadToken,
  currentUserId,
}: {
  payloadToken: string;
  currentUserId: string;
}) {
  const t = useTranslations("dashboardUsers");
  const [users, setUsers] = useState<DashboardUser[] | null>(null);
  const [error, setError] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "staff" },
  });

  // Refetch by bumping refreshKey — the effect owns the only fetch path.
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await payloadUsersApi.list(payloadToken);
        if (!cancelled) {
          setUsers(res.docs ?? []);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setUsers([]);
          setError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payloadToken, refreshKey]);
  const refresh = () => setRefreshKey((k) => k + 1);

  async function onInvite(values: InviteValues) {
    setBusy(true);
    try {
      await payloadUsersApi.create(payloadToken, values);
      toast.success(t("invited"));
      setInviteOpen(false);
      form.reset({ role: "staff", name: "", email: "", password: "" });
      refresh();
    } catch {
      toast.error(t("actionError"));
    } finally {
      setBusy(false);
    }
  }

  async function onRoleChange(user: DashboardUser, role: AssignableRole) {
    setBusy(true);
    try {
      await payloadUsersApi.updateRole(payloadToken, user.id, role);
      toast.success(t("roleUpdated"));
      refresh();
    } catch {
      toast.error(t("actionError"));
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(user: DashboardUser) {
    setBusy(true);
    try {
      await payloadUsersApi.remove(payloadToken, user.id);
      toast.success(t("removed"));
      refresh();
    } catch {
      toast.error(t("actionError"));
    } finally {
      setBusy(false);
    }
  }

  if (users === null) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)} data-testid="users-invite">
          {t("invite")}
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t("loadError")}
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t("colUser")}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t("colRole")}
              </th>
              <th scope="col" className="px-4 py-3 text-end font-medium">
                <span className="sr-only">{t("colActions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = String(user.id) === currentUserId;
              const isAdmin = user.role === "admin";
              return (
                <tr key={String(user.id)} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-muted-foreground" dir="ltr">
                      {user.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin || isSelf ? (
                      <Badge variant={isAdmin ? "accent" : "secondary"}>
                        {t(`roles.${user.role ?? "staff"}`)}
                      </Badge>
                    ) : (
                      <div className="space-y-1">
                        <Label htmlFor={`role-${user.id}`} className="sr-only">
                          {t("colRole")}
                        </Label>
                        <select
                          id={`role-${user.id}`}
                          value={user.role ?? "staff"}
                          disabled={busy}
                          onChange={(e) => onRoleChange(user, e.target.value as AssignableRole)}
                          className="flex h-8 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {ASSIGNABLE_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {t(`roles.${role}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    {!isAdmin && !isSelf && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => onRemove(user)}
                      >
                        {t("remove")}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("inviteTitle")}</DialogTitle>
            <DialogDescription>{t("inviteSubtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onInvite)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">{t("name")}</Label>
              <Input id="invite-name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p role="alert" className="text-sm text-destructive">
                  {t("required")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">{t("email")}</Label>
              <Input id="invite-email" type="email" autoComplete="off" {...form.register("email")} />
              {form.formState.errors.email && (
                <p role="alert" className="text-sm text-destructive">
                  {t("invalidEmail")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-password">{t("password")}</Label>
              <Input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p role="alert" className="text-sm text-destructive">
                  {t("weakPassword")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">{t("colRole")}</Label>
              <select
                id="invite-role"
                {...form.register("role")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {ASSIGNABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? t("saving") : t("inviteSubmit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
