"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import {
  ANIMAL_CONFIGS_DATA_TAG,
  createAnimalConfigRecord,
  deleteAnimalConfigRecord,
  updateAnimalConfigRecord,
} from "@/lib/services/animal-config";
import {
  createAnimalConfigFormSchema,
  deleteAnimalConfigFormSchema,
  updateAnimalConfigFormSchema,
} from "@/lib/validations/animal-config";

const TYPES_PATH = "/admin/season/animal-types";
const POOLS_PATH = "/admin/season/pools";

function revalidateAnimalConfigSurfaces() {
  revalidateTag(ANIMAL_CONFIGS_DATA_TAG, "max");
  revalidatePath(TYPES_PATH);
  revalidatePath(POOLS_PATH);
}

export type AnimalConfigActionResult = { ok: true } | { ok: false; error: string };

export async function createAnimalConfigAction(formData: FormData): Promise<AnimalConfigActionResult> {
  await requireAdmin();

  const parsed = createAnimalConfigFormSchema.safeParse({
    code: formData.get("code"),
    label: formData.get("label"),
    portionsPerAnimal: formData.get("portionsPerAnimal"),
    payasPerAnimal: formData.get("payasPerAnimal"),
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createAnimalConfigRecord(parsed.data);
  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  revalidateAnimalConfigSurfaces();
  return { ok: true };
}

export async function updateAnimalConfigAction(formData: FormData): Promise<AnimalConfigActionResult> {
  await requireAdmin();

  const parsed = updateAnimalConfigFormSchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    portionsPerAnimal: formData.get("portionsPerAnimal"),
    payasPerAnimal: formData.get("payasPerAnimal"),
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateAnimalConfigRecord(parsed.data);
  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  revalidateAnimalConfigSurfaces();
  return { ok: true };
}

export async function deleteAnimalConfigAction(formData: FormData): Promise<AnimalConfigActionResult> {
  await requireAdmin();

  const parsed = deleteAnimalConfigFormSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const result = await deleteAnimalConfigRecord(parsed.data.id);
  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  revalidateAnimalConfigSurfaces();
  return { ok: true };
}
