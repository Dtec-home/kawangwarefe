"use client";

/**
 * TemplateManager — create, edit, toggle, and delete message templates.
 * Single responsibility: template lifecycle only.
 */

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GET_MESSAGE_TEMPLATES,
  CREATE_MESSAGE_TEMPLATE,
  UPDATE_MESSAGE_TEMPLATE,
  DELETE_MESSAGE_TEMPLATE,
} from "@/lib/graphql/messaging-mutations";

interface Template {
  id: string;
  name: string;
  body: string;
  isActive: boolean;
}

export function TemplateManager() {
  const { data, refetch } = useQuery<{ messageTemplates: Template[] }>(
    GET_MESSAGE_TEMPLATES
  );
  const templates = data?.messageTemplates ?? [];

  const [createTpl] = useMutation<{ createMessageTemplate: { success: boolean; message: string; template: Template | null } }>(CREATE_MESSAGE_TEMPLATE);
  const [updateTpl] = useMutation<{ updateMessageTemplate: { success: boolean; message: string; template: Template | null } }>(UPDATE_MESSAGE_TEMPLATE);
  const [deleteTpl] = useMutation<{ deleteMessageTemplate: { success: boolean; message: string } }>(DELETE_MESSAGE_TEMPLATE);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Template | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setName(""); setBody(""); setShowCreate(true);
  };

  const openEdit = (t: Template) => {
    setEditTarget(t); setName(t.name); setBody(t.body);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) {
        const { data: d } = await updateTpl({
          variables: { templateId: editTarget.id, name: name.trim(), body },
        });
        const res = d?.updateMessageTemplate;
        if (res?.success) { toast.success(res.message); setEditTarget(null); await refetch(); }
        else toast.error(res?.message || "Update failed");
      } else {
        const { data: d } = await createTpl({
          variables: { name: name.trim(), body },
        });
        const res = d?.createMessageTemplate;
        if (res?.success) { toast.success(res.message); setShowCreate(false); await refetch(); }
        else toast.error(res?.message || "Create failed");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (t: Template) => {
    try {
      const { data: d } = await updateTpl({
        variables: { templateId: t.id, isActive: !t.isActive },
      });
      const res = d?.updateMessageTemplate;
      if (res?.success) { await refetch(); }
      else toast.error(res?.message || "Toggle failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unexpected error");
    }
  };

  const handleDelete = async (t: Template) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    try {
      const { data: d } = await deleteTpl({ variables: { templateId: t.id } });
      const res = d?.deleteMessageTemplate;
      if (res?.success) { toast.success(res.message); await refetch(); }
      else toast.error(res?.message || "Delete failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unexpected error");
    }
  };

  const TemplateForm = (
    <div className="space-y-3">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <Label>Body</Label>
        <p className="text-xs text-muted-foreground mb-1">
          Tokens: <code>{"{{first_name}}"}</code> <code>{"{{last_name}}"}</code> <code>{"{{full_name}}"}</code>
        </p>
        <Textarea rows={4} value={body} onChange={e => setBody(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !name.trim() || !body.trim()}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          variant="outline"
          onClick={() => { setShowCreate(false); setEditTarget(null); }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{templates.length} template(s)</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New Template
        </Button>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <div className="border rounded-lg p-4 bg-muted/30">{TemplateForm}</div>
      )}

      {templates.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground">No templates yet. Create one above.</p>
      )}

      <ul className="divide-y divide-border">
        {templates.map(t => (
          <li key={t.id} className="py-3">
            {editTarget?.id === t.id ? (
              <div className="border rounded-lg p-4 bg-muted/30">{TemplateForm}</div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{t.name}</p>
                    <Badge variant={t.isActive ? "default" : "secondary"} className="text-xs">
                      {t.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap line-clamp-2">
                    {t.body}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    title={t.isActive ? "Deactivate" : "Activate"}
                    onClick={() => handleToggle(t)}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Edit"
                    onClick={() => openEdit(t)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Delete"
                    onClick={() => handleDelete(t)}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
