import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import {getClientConfig} from '../config/client-config';

export interface CustomerConsentData {
  name: string;
  phone: string;
  email: string;
  address: string;
  planName: string;
  validity: string;
  monthlyAmount: string;
  routerInfo: string;
  installationCharges: string;
  routerCharges: string;
  idProof: string;
  idDocumentNumber: string;
  addressProof: string;
  addressDocumentNumber: string;
}

const NA = 'N/A';

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text && text.toUpperCase() !== 'N/A' && text.toUpperCase() !== 'NA') {
      return text;
    }
  }
  return '';
};

export const formatConsentPhone = (number?: string | null): string => {
  if (!number) return NA;

  const raw = String(number).trim();
  if (!raw || raw.toUpperCase() === NA) return NA;

  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2)}`;
  }
  if (raw.startsWith('+')) {
    return raw;
  }
  return raw;
};

export const buildConsentFullName = (auth: any): string => {
  return pickString(
    auth?.full_name,
    auth?.customer_name,
    auth?.user_full_name,
    auth?.display_name,
    `${auth?.first_name || ''} ${auth?.last_name || ''}`.trim(),
    auth?.name,
    auth?.username,
  );
};

export const buildConsentAddress = (auth: any): string => {
  const singleLine = pickString(
    auth?.installation_address,
    auth?.install_address,
    auth?.full_address,
    auth?.address,
  );
  if (singleLine) {
    return singleLine;
  }

  const parts: string[] = [];
  if (auth?.flat_no) parts.push(String(auth.flat_no));
  if (auth?.address1) parts.push(String(auth.address1));
  if (auth?.address2) parts.push(String(auth.address2));
  if (auth?.area_name) parts.push(String(auth.area_name));
  if (auth?.city_name) parts.push(String(auth.city_name));

  const pincode = auth?.pincode ? String(auth.pincode).trim() : '';
  if (pincode) {
    parts.push(pincode.startsWith('-') ? pincode : `-${pincode}`);
  }
  if (auth?.state) parts.push(String(auth.state));
  if (auth?.country) parts.push(String(auth.country));

  return parts.filter(Boolean).join(', ') || '';
};

const formatCurrency = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) {
    return String(value).trim();
  }
  return `₹${amount}`;
};

const buildPlanName = (auth: any): string => {
  return pickString(
    auth?.current_plan,
    auth?.currentPlan,
    auth?.plan_name,
    auth?.usage_details?.[0]?.plan_name,
    auth?.usage_details?.[0]?.current_plan,
    auth?.sales_details?.plan_name,
    auth?.sales_details?.selected_plan,
  );
};

const buildValidity = (auth: any): string => {
  const days = pickString(
    auth?.total_days,
    auth?.usage_details?.[0]?.plan_days,
    auth?.usage_details?.[0]?.days,
    auth?.usage_details?.[0]?.validity,
    auth?.sales_details?.plan_days,
    auth?.sales_details?.validity,
  );
  if (!days) return '';
  if (/day|दिन|दिवस/i.test(days)) return days;
  return `${days} Days`;
};

const buildMonthlyAmount = (auth: any): string => {
  const raw = pickString(
    auth?.plan_amount,
    auth?.plan_mrp,
    auth?.mrp,
    auth?.usage_details?.[0]?.plan_amount,
    auth?.usage_details?.[0]?.mrp,
    auth?.sales_details?.plan_amount,
    auth?.sales_details?.monthly_amount,
    auth?.sales_details?.mrp,
  );
  return raw ? formatCurrency(raw) || raw : '';
};

const buildRouterInfo = (auth: any): string => {
  return pickString(
    auth?.router_info,
    auth?.router_information,
    auth?.router_name,
    auth?.cpe_model,
    auth?.modem_model,
    auth?.sales_details?.router_info,
    auth?.sales_details?.router_name,
    auth?.company_details?.router_info,
  );
};

const buildInstallationCharges = (auth: any): string => {
  const raw = pickString(
    auth?.installation_charges,
    auth?.installation_charge,
    auth?.install_charges,
    auth?.sales_details?.installation_charges,
    auth?.sales_details?.installation_charge,
    auth?.company_details?.installation_charges,
  );
  return raw ? formatCurrency(raw) || raw : '';
};

const buildRouterCharges = (auth: any): string => {
  const raw = pickString(
    auth?.router_charges,
    auth?.router_charge,
    auth?.sales_details?.router_charges,
    auth?.sales_details?.router_charge,
    auth?.company_details?.router_charges,
  );
  return raw ? formatCurrency(raw) || raw : '';
};

const findKycDoc = (kycList: any[], docType: string) => {
  if (!Array.isArray(kycList)) return null;
  return kycList.find(
    (doc: any) => String(doc?.doc_type || '').toLowerCase() === docType.toLowerCase(),
  );
};

const mapKycDocLabel = (doc: any, fallback: string): string => {
  return pickString(doc?.doc_name, doc?.document_name, fallback);
};

export const mapAuthAndKycToConsentData = (
  auth: any,
  kycList: any[] | null | undefined,
  fallbacks: CustomerConsentData,
): CustomerConsentData => {
  const idDoc = findKycDoc(kycList || [], 'id_proof');
  const addressDoc = findKycDoc(kycList || [], 'address_proof');

  return {
    name: buildConsentFullName(auth) || fallbacks.name,
    phone: formatConsentPhone(auth?.primary_mobile || auth?.mobile || auth?.phone) || fallbacks.phone,
    email: pickString(auth?.primary_email, auth?.email) || fallbacks.email,
    address: buildConsentAddress(auth) || fallbacks.address,
    planName: buildPlanName(auth) || fallbacks.planName,
    validity: buildValidity(auth) || fallbacks.validity,
    monthlyAmount: buildMonthlyAmount(auth) || fallbacks.monthlyAmount,
    routerInfo: buildRouterInfo(auth) || fallbacks.routerInfo,
    installationCharges: buildInstallationCharges(auth) || fallbacks.installationCharges,
    routerCharges: buildRouterCharges(auth) || fallbacks.routerCharges,
    idProof: mapKycDocLabel(idDoc, fallbacks.idProof),
    idDocumentNumber: pickString(idDoc?.doc_id, idDoc?.document_id) || fallbacks.idDocumentNumber,
    addressProof: mapKycDocLabel(addressDoc, fallbacks.addressProof),
    addressDocumentNumber:
      pickString(addressDoc?.doc_id, addressDoc?.document_id) || fallbacks.addressDocumentNumber,
  };
};

export const getTranslationFallbacks = (
  t: (key: string) => string,
): CustomerConsentData => ({
  name: t('customerConsent.data.name'),
  phone: t('customerConsent.data.phone'),
  email: t('customerConsent.data.email'),
  address: t('customerConsent.data.address'),
  planName: t('customerConsent.data.planName'),
  validity: t('customerConsent.data.validity'),
  monthlyAmount: t('customerConsent.data.monthlyAmount'),
  routerInfo: t('customerConsent.data.routerInfo'),
  installationCharges: t('customerConsent.data.installationCharges'),
  routerCharges: t('customerConsent.data.routerCharges'),
  idProof: t('customerConsent.data.idProof'),
  idDocumentNumber: t('customerConsent.data.idDocumentNumber'),
  addressProof: t('customerConsent.data.addressProof'),
  addressDocumentNumber: t('customerConsent.data.addressDocumentNumber'),
});

export const fetchCustomerConsentData = async (
  t: (key: string) => string,
): Promise<CustomerConsentData> => {
  const fallbacks = getTranslationFallbacks(t);
  const session = await sessionManager.getCurrentSession();
  const username = session?.username;

  if (!username) {
    throw new Error('No user session found. Please login again.');
  }

  const authResponse = await apiService.authUser(username);
  let kycList: any[] | null = null;

  try {
    const clientConfig = getClientConfig();
    kycList = await apiService.viewUserKyc(username, clientConfig.clientId);
  } catch {
    kycList = null;
  }

  return mapAuthAndKycToConsentData(authResponse, kycList, fallbacks);
};
