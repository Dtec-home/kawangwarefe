"use client";

import { MessageSquare, Zap } from "lucide-react";

import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignComposer } from "@/components/messaging/CampaignComposer";
import { TemplateManager } from "@/components/messaging/TemplateManager";
import { CampaignHistory } from "@/components/messaging/CampaignHistory";
import { QuickSendComposer } from "@/components/messaging/QuickSendComposer";

function MessagingContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Messaging</h1>
      </div>

      <Tabs defaultValue="quick">
        <TabsList>
          <TabsTrigger value="quick" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Quick Send
          </TabsTrigger>
          <TabsTrigger value="compose">New Campaign</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Quick Send — write once, pick recipients, send */}
        <TabsContent value="quick">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Send
              </CardTitle>
              <CardDescription>
                Write a message, select or type recipients, and send immediately.
                No template needed — messages are scheduled and delivered in the background.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickSendComposer />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Full campaign composer with template + audience targeting */}
        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>New Campaign</CardTitle>
              <CardDescription>
                Target a specific audience by department, group, or role, then send a
                saved template. Best for scheduled announcements to large groups.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignComposer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Campaign History</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MessagingPage() {
  return (
    <AdminProtectedRoute requiredAccess="messaging">
      <AdminLayout>
        <MessagingContent />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
