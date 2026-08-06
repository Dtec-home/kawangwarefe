"use client";

/**
 * Help Center (foundation shell).
 *
 * Reads from the static registry in lib/help-content/index.ts — this page
 * intentionally has zero hardcoded article content. Content authors add one
 * file per article under lib/help-content/articles/ and register it in
 * HELP_ARTICLES; nothing here needs to change when that happens.
 *
 * Role-awareness: a plain member only sees articles tagged 'member'; anyone
 * who can access the admin panel (per useUserRole().canAccessAdmin) also
 * sees articles tagged 'admin'. This mirrors the same admin-detection the
 * rest of the app already uses (see MemberLayout's "Admin Panel" shortcut).
 */

import { useMemo, useState } from "react";
import { LifeBuoy, Search, MessageCircle, Mail, ChevronRight } from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MemberLayout } from "@/components/layouts/member-layout";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { HELP_ARTICLES, searchArticles } from "@/lib/help-content";
import type { HelpArticle } from "@/lib/help-content/types";
import { HELP_WHATSAPP_URL, HELP_EMAIL_URL, HELP_EMAIL_ADDRESS } from "@/components/help/HelpButton";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";

function HelpCenterContent() {
  const { canAccessAdmin } = useUserRole();
  const [query, setQuery] = useState("");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const visibleArticles = useMemo(() => {
    const allowedRoles: HelpArticle["roles"][number][] = canAccessAdmin
      ? ["member", "admin"]
      : ["member"];
    return HELP_ARTICLES.filter((article) =>
      article.roles.some((role) => allowedRoles.includes(role))
    );
  }, [canAccessAdmin]);

  const filteredArticles = useMemo(
    () => searchArticles(query, visibleArticles),
    [query, visibleArticles]
  );

  const categories = useMemo(() => {
    const map = new Map<string, HelpArticle[]>();
    for (const article of filteredArticles) {
      const list = map.get(article.category) ?? [];
      list.push(article);
      map.set(article.category, list);
    }
    return Array.from(map.entries());
  }, [filteredArticles]);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <PageHeader
        title="Help Center"
        description="Answers to common questions about giving, your account, and church programs."
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles…"
          className="pl-9"
          aria-label="Search help articles"
        />
      </div>

      {categories.length === 0 ? (
        <Empty
          icon={LifeBuoy}
          title={query ? "No matching articles" : "Help articles are coming soon"}
          description={
            query
              ? "Try a different search term, or contact us directly below."
              : "We're still writing up guides for this section. In the meantime, reach out to us directly below."
          }
        />
      ) : (
        <div className="space-y-6">
          {categories.map(([category, articles]) => (
            <div key={category} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {articles.map((article) => {
                  const isExpanded = expandedSlug === article.slug;
                  return (
                    <Card
                      key={article.slug}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      className="cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setExpandedSlug(isExpanded ? null : article.slug)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExpandedSlug(isExpanded ? null : article.slug);
                        }
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{article.title}</CardTitle>
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                        {!isExpanded && (
                          <CardDescription className="line-clamp-2">
                            {article.body}
                          </CardDescription>
                        )}
                      </CardHeader>
                      {isExpanded && (
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {article.body}
                          </p>
                          {article.roles.includes("admin") && (
                            <Badge variant="outline" className="mt-3">
                              Admin
                            </Badge>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Still need help?</CardTitle>
          <CardDescription>Reach the church office directly.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a
            href={HELP_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp us
          </a>
          <a
            href={HELP_EMAIL_URL}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Mail className="h-4 w-4" />
            {HELP_EMAIL_ADDRESS}
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HelpCenterPage() {
  return (
    <ProtectedRoute>
      <MemberLayout>
        <HelpCenterContent />
      </MemberLayout>
    </ProtectedRoute>
  );
}
