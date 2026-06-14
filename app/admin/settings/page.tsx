import { requireAdmin } from "@/lib/auth/admin";
import {
  getDeliveryFee,
  getPromoConfig,
  getContactInfo,
  getInstagram,
} from "@/lib/data/settings";
import { listAdmins } from "@/lib/data/admin-settings";
import DeliveryFeeForm from "@/components/admin/settings/DeliveryFeeForm";
import PromoForm from "@/components/admin/settings/PromoForm";
import ContactForm from "@/components/admin/settings/ContactForm";
import InstagramManager from "@/components/admin/settings/InstagramManager";
import AdminsManager from "@/components/admin/settings/AdminsManager";

// Admin Settings. The parent layout already enforced requireAdmin(); we call it
// again to be self-contained and to get the current admin's id (needed so they
// can't remove their own admin access in the Admins section).
export default async function AdminSettingsPage() {
  const user = await requireAdmin();

  const [deliveryFee, promo, contact, instagram, admins] = await Promise.all([
    getDeliveryFee(),
    getPromoConfig(),
    getContactInfo(),
    getInstagram(),
    listAdmins(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
        Settings
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Manage store-wide settings. Changes apply to the live storefront.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <DeliveryFeeForm initialFee={deliveryFee} />
        <PromoForm initial={promo} />
        <ContactForm initial={contact} />
        <InstagramManager initial={instagram} />
        <AdminsManager admins={admins} currentUserId={user.id} />
      </div>
    </div>
  );
}
