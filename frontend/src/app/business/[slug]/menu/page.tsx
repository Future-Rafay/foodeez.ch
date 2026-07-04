import { extractBusinessId } from "@/lib/utils/genSlug";
import {
  getBusinessMenuOnly,
  getBusinessMenuWithProducts,
} from "@/services/MenuPageService";
import MenuPageClient from "@/components/menu/MenuPageClient";

export default async function MenuPage({
  params,
}: {
  params: { slug: string };
}) {
  const businessId = extractBusinessId(params.slug);
  const [menuCards, products] = businessId
    ? await Promise.all([
        getBusinessMenuOnly(businessId),
        getBusinessMenuWithProducts(businessId),
      ])
    : [[], []];
  const business = menuCards[0] ?? null;

  if (!business) {
    return (
      <div className="text-center py-12 text-lg text-text-muted">
        <h2 className="text-2xl font-bold mb-2">
          No menu is available right now.
        </h2>
      </div>
    );
  }

  return (
    <MenuPageClient
      business={business}
      menuCards={menuCards}
      products={products}
    />
  );
}
