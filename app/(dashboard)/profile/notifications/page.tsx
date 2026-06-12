/**
 * Notification Preferences Page (Wave 1 / member parity).
 *
 * Per-channel notification toggles — the web counterpart of the mobile app's
 * notification settings. No member-preferences mutation exists in
 * lib/graphql/, so preferences persist to localStorage via
 * `useNotificationPreferences`. The form is driven by react-hook-form with a
 * Zod resolver over the shared schema.
 */

"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MemberLayout } from "@/components/layouts/member-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNotificationPreferences } from "@/lib/hooks/use-notification-preferences";
import {
  NOTIFICATION_CHANNELS,
  NotificationPreferences,
  notificationPreferencesSchema,
} from "@/lib/notifications/notification-preferences-schema";

function NotificationPreferencesContent() {
  const { preferences, save } = useNotificationPreferences();

  // The hook reads stored prefs via a lazy initialiser, so `preferences` is
  // already correct on first client render — seed the form directly.
  const { control, handleSubmit, formState } = useForm<NotificationPreferences>(
    {
      resolver: zodResolver(notificationPreferencesSchema),
      defaultValues: preferences,
    }
  );

  const onSubmit = (values: NotificationPreferences) => {
    save(values);
    toast.success("Notification preferences saved");
  };

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose which updates you&apos;d like to receive. Saved on this
            device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <ul className="divide-y divide-border">
              {NOTIFICATION_CHANNELS.map((channel) => (
                <li
                  key={channel.key}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={`pref-${channel.key}`}>
                      {channel.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {channel.description}
                    </p>
                  </div>
                  <Controller
                    control={control}
                    name={channel.key}
                    render={({ field }) => (
                      <Switch
                        id={`pref-${channel.key}`}
                        aria-label={channel.label}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </li>
              ))}
            </ul>

            <div className="flex justify-end">
              <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? "Saving…" : "Save preferences"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NotificationPreferencesPage() {
  return (
    <ProtectedRoute>
      <MemberLayout>
        <NotificationPreferencesContent />
      </MemberLayout>
    </ProtectedRoute>
  );
}
