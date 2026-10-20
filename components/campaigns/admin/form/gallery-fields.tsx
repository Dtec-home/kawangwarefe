/**
 * Gallery links (images or YouTube videos) for a campaign
 * (Fundraising S1, ticket 1.10). Images are URLs; there is no upload.
 */

"use client";

import { Controller, useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { CampaignFormValues } from "./campaign-form-schema";
import { FieldError } from "./field-error";

interface GalleryFieldsProps {
  control: Control<CampaignFormValues>;
  register: UseFormRegister<CampaignFormValues>;
  errors: FieldErrors<CampaignFormValues>;
}

export function GalleryFields({ control, register, errors }: GalleryFieldsProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "gallery" });

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Gallery</legend>
      <p className="text-xs text-muted-foreground">Links to photos or YouTube videos shown on the public page.</p>
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <Controller
            control={control}
            name={`gallery.${index}.kind`}
            render={({ field: kind }) => (
              <Select name={`gallery.${index}.kind`} value={kind.value} onValueChange={kind.onChange}>
                <SelectTrigger className="sm:w-36" aria-label={`Item ${index + 1} type`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <div className="flex-1 space-y-1">
            <Label htmlFor={`campaign-gallery-${index}`} className="sr-only">
              Item {index + 1} link
            </Label>
            <Input
              id={`campaign-gallery-${index}`}
              type="url"
              placeholder="https://"
              aria-invalid={errors.gallery?.[index]?.url ? true : undefined}
              {...register(`gallery.${index}.url`)}
            />
            <FieldError message={errors.gallery?.[index]?.url?.message} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove item ${index + 1}`}
            onClick={() => remove(index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ kind: "image", url: "" })}>
        <Plus className="size-4" /> Add photo or video
      </Button>
    </fieldset>
  );
}
