import { AnimalTypesManager } from "@/app/admin/(protected)/season/animal-types/animal-types-manager";
import { listAnimalConfigsForAdmin } from "@/lib/services/animal-config";

/**
 * Admin CRUD for `AnimalConfig`. New types = new `code` (UPPER_SNAKE_CASE); no Prisma migration.
 */
export default async function AdminAnimalTypesPage() {
  const configs = await listAnimalConfigsForAdmin();
  return <AnimalTypesManager initialConfigs={configs} />;
}
