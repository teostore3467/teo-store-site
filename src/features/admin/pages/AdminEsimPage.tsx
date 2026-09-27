import { useCallback, useEffect, useMemo, useState, } from 'react';
import { supabase, } from '../../../lib/supabase';
import { esimCountries, } from '../../digital-commerce/data/esimCatalog';
type CountrySettingRow = {
    country_slug: string;
    image_path: string | null;
    active: boolean;
    updated_at: string;
};
type PlanSettingRow = {
    country_slug: string;
    plan_id: string;
    price: number;
    active: boolean;
    popular: boolean;
    updated_at: string;
};
type CountrySettingMap = Record<string, CountrySettingRow>;
type PlanSettingMap = Record<string, PlanSettingRow>;
type ToastState = {
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
};
type EditingPlan = {
    countrySlug: string;
    countryName: string;
    planId: string;
    planLabel: string;
    originalPrice: number;
    currentPrice: number;
    currency: string;
    originalPopular: boolean;
} | null;
type PriceValue = string | number;
const COUNTRY_IMAGES_BUCKET = 'esim-country-images';
function getPlanKey(countrySlug: string, planId: string) {
    return `${countrySlug}::${planId}`;
}
function parsePrice(value: PriceValue) {
    if (typeof value ===
        'number') {
        return Number.isFinite(value)
            ? value
            : 0;
    }
    const normalized = value
        .replace(/\s/g, '')
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed)
        ? parsed
        : 0;
}
function getImageExtension(file: File) {
    const fromName = file.name
        .split('.')
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 8);
    if (fromName) {
        return fromName;
    }
    if (file.type ===
        'image/webp') {
        return 'webp';
    }
    if (file.type ===
        'image/png') {
        return 'png';
    }
    return 'jpg';
}
function AdminEsimPage() {
    const locale = 'fr-FR-u-nu-latn';
    const [searchQuery, setSearchQuery,] = useState('');
    const [countrySettings, setCountrySettings,] = useState<CountrySettingMap>({});
    const [planSettings, setPlanSettings,] = useState<PlanSettingMap>({});
    const [isLoading, setIsLoading,] = useState(true);
    const [isRefreshing, setIsRefreshing,] = useState(false);
    const [savingPlanKey, setSavingPlanKey,] = useState<string | null>(null);
    const [uploadingCountry, setUploadingCountry,] = useState<string | null>(null);
    const [togglingCountry, setTogglingCountry,] = useState<string | null>(null);
    const [editingPlan, setEditingPlan,] = useState<EditingPlan>(null);
    const [priceInput, setPriceInput,] = useState('');
    const [editActive, setEditActive,] = useState(true);
    const [editPopular, setEditPopular,] = useState(false);
    const [toast, setToast,] = useState<ToastState | null>(null);
    const [loadError, setLoadError,] = useState<string | null>(null);
    const showToast = useCallback((nextToast: ToastState) => {
        setToast(nextToast);
        window.setTimeout(() => {
            setToast(null);
        }, 4200);
    }, []);
    const loadSettings = useCallback(async (refresh = false) => {
        if (refresh) {
            setIsRefreshing(true);
        }
        else {
            setIsLoading(true);
        }
        setLoadError(null);
        const [countryResult, planResult,] = await Promise.all([
            supabase
                .from('esim_country_settings')
                .select('country_slug, image_path, active, updated_at'),
            supabase
                .from('esim_plan_settings')
                .select('country_slug, plan_id, price, active, popular, updated_at'),
        ]);
        if (countryResult.error ||
            planResult.error) {
            const message = countryResult.error?.message ??
                planResult.error?.message ??
                'Erreur inconnue';
            console.error('Unable to load eSIM settings:', message);
            setLoadError(`Impossible de charger la configuration eSIM. ${message}`);
            setIsLoading(false);
            setIsRefreshing(false);
            return;
        }
        const nextCountries: CountrySettingMap = {};
        (countryResult.data ??
            []).forEach((row) => {
            const value = row as CountrySettingRow;
            nextCountries[value.country_slug] =
                value;
        });
        const nextPlans: PlanSettingMap = {};
        (planResult.data ??
            []).forEach((row) => {
            const value = row as PlanSettingRow;
            nextPlans[getPlanKey(value.country_slug, value.plan_id)] =
                value;
        });
        setCountrySettings(nextCountries);
        setPlanSettings(nextPlans);
        setIsLoading(false);
        setIsRefreshing(false);
    }, [
    ]);
    useEffect(() => {
        void loadSettings();
        const channel = supabase
            .channel(`admin-esim-${Date.now()}`)
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'esim_country_settings',
        }, () => {
            void loadSettings(true);
        })
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'esim_plan_settings',
        }, () => {
            void loadSettings(true);
        })
            .subscribe();
        return () => {
            void supabase.removeChannel(channel);
        };
    }, [
        loadSettings,
    ]);
    const getCountryActive = (slug: string) => countrySettings[slug]?.active ??
        true;
    const getCountryImageUrl = (slug: string) => {
        const path = countrySettings[slug]?.image_path;
        if (!path) {
            return null;
        }
        const { data, } = supabase.storage
            .from(COUNTRY_IMAGES_BUCKET)
            .getPublicUrl(path);
        return data.publicUrl;
    };
    const getPlanSetting = (countrySlug: string, planId: string) => planSettings[getPlanKey(countrySlug, planId)];
    const filteredCountries = useMemo(() => {
        const normalizedQuery = searchQuery
            .trim()
            .toLowerCase();
        if (!normalizedQuery) {
            return esimCountries;
        }
        return esimCountries.filter((country) => country.slug
            .toLowerCase()
            .includes(normalizedQuery) ||
            country.code
                .toLowerCase()
                .includes(normalizedQuery) ||
            country.name.fr
                .toLowerCase()
                .includes(normalizedQuery) ||
            country.name.ar.includes(searchQuery.trim()));
    }, [
        searchQuery,
    ]);
    const stats = useMemo(() => {
        let totalPlans = 0;
        let activePlans = 0;
        let popularPlans = 0;
        let imageCount = 0;
        esimCountries.forEach((country) => {
            if (countrySettings[country.slug]?.image_path) {
                imageCount +=
                    1;
            }
            country.plans.forEach((plan) => {
                totalPlans +=
                    1;
                const setting = planSettings[getPlanKey(country.slug, plan.id)];
                const active = setting?.active ??
                    true;
                const popular = setting?.popular ??
                    Boolean(plan.popular);
                if (active) {
                    activePlans +=
                        1;
                }
                if (popular) {
                    popularPlans +=
                        1;
                }
            });
        });
        const activeCountries = esimCountries.filter((country) => getCountryActive(country.slug)).length;
        return {
            countries: esimCountries.length,
            activeCountries,
            totalPlans,
            activePlans,
            popularPlans,
            imageCount,
        };
    }, [
        countrySettings,
        planSettings,
    ]);
    const handleCountryImageUpload = async (countrySlug: string, countryName: string, file?: File) => {
        if (!file) {
            return;
        }
        if (![
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
        ].includes(file.type)) {
            showToast({
                type: 'error',
                title: 'Format non accepté',
                message: 'Utilisez JPG, PNG ou WEBP.',
            });
            return;
        }
        if (file.size >
            5 *
                1024 *
                1024) {
            showToast({
                type: 'error',
                title: 'Image trop volumineuse',
                message: 'La taille maximale est de 5 MB.',
            });
            return;
        }
        setUploadingCountry(countrySlug);
        try {
            const oldPath = countrySettings[countrySlug]?.image_path;
            const extension = getImageExtension(file);
            const newPath = `${countrySlug}/cover-${Date.now()}.${extension}`;
            const { error: uploadError, } = await supabase.storage
                .from(COUNTRY_IMAGES_BUCKET)
                .upload(newPath, file, {
                upsert: false,
                cacheControl: '3600',
                contentType: file.type,
            });
            if (uploadError) {
                throw uploadError;
            }
            const { error: databaseError, } = await supabase
                .from('esim_country_settings')
                .upsert({
                country_slug: countrySlug,
                image_path: newPath,
                active: getCountryActive(countrySlug),
                updated_at: new Date()
                    .toISOString(),
            }, {
                onConflict: 'country_slug',
            });
            if (databaseError) {
                await supabase.storage
                    .from(COUNTRY_IMAGES_BUCKET)
                    .remove([
                    newPath,
                ]);
                throw databaseError;
            }
            if (oldPath &&
                oldPath !==
                    newPath) {
                const { error: removeError, } = await supabase.storage
                    .from(COUNTRY_IMAGES_BUCKET)
                    .remove([
                    oldPath,
                ]);
                if (removeError) {
                    console.warn('Unable to remove previous eSIM image:', removeError);
                }
            }
            await loadSettings(true);
            showToast({
                type: 'success',
                title: 'Image enregistrée',
                message: `La nouvelle image de ${countryName} a été enregistrée.`,
            });
        }
        catch (error) {
            console.error('Unable to upload eSIM country image:', error);
            showToast({
                type: 'error',
                title: 'Envoi impossible',
                message: error instanceof
                    Error
                    ? error.message
                    :
                        'Erreur inconnue',
            });
        }
        finally {
            setUploadingCountry(null);
        }
    };
    const handleToggleCountry = async (countrySlug: string, countryName: string) => {
        if (togglingCountry) {
            return;
        }
        setTogglingCountry(countrySlug);
        try {
            const nextActive = !getCountryActive(countrySlug);
            const { error, } = await supabase
                .from('esim_country_settings')
                .upsert({
                country_slug: countrySlug,
                image_path: countrySettings[countrySlug]?.image_path ??
                    null,
                active: nextActive,
                updated_at: new Date()
                    .toISOString(),
            }, {
                onConflict: 'country_slug',
            });
            if (error) {
                throw error;
            }
            await loadSettings(true);
            showToast({
                type: 'success',
                title: nextActive
                    ?
                        'Destination activée'
                    :
                        'Destination désactivée',
                message: countryName,
            });
        }
        catch (error) {
            console.error('Unable to toggle country:', error);
            showToast({
                type: 'error',
                title: 'Modification impossible',
                message: error instanceof
                    Error
                    ? error.message
                    :
                        'Erreur inconnue',
            });
        }
        finally {
            setTogglingCountry(null);
        }
    };
    const openPlanEditor = (countrySlug: string, countryName: string, planId: string, planLabel: string, originalPrice: PriceValue, currency: string, originalPopular: boolean) => {
        const setting = getPlanSetting(countrySlug, planId);
        const catalogPrice = parsePrice(originalPrice);
        const currentPrice = Number(setting?.price ??
            catalogPrice);
        setEditingPlan({
            countrySlug,
            countryName,
            planId,
            planLabel,
            originalPrice: catalogPrice,
            currentPrice,
            currency,
            originalPopular,
        });
        setPriceInput(String(currentPrice));
        setEditActive(setting?.active ??
            true);
        setEditPopular(setting?.popular ??
            originalPopular);
    };
    const closePlanEditor = () => {
        if (savingPlanKey) {
            return;
        }
        setEditingPlan(null);
        setPriceInput('');
    };
    const parsedPrice = parsePrice(priceInput);
    const priceInputValid = priceInput
        .trim()
        .length >
        0 &&
        Number.isFinite(parsedPrice) &&
        parsedPrice >=
            0;
    const canSavePlan = Boolean(editingPlan) &&
        priceInputValid &&
        !savingPlanKey;
    const handleSavePlan = async () => {
        if (!editingPlan ||
            !canSavePlan) {
            return;
        }
        const key = getPlanKey(editingPlan.countrySlug, editingPlan.planId);
        setSavingPlanKey(key);
        try {
            const { error, } = await supabase
                .from('esim_plan_settings')
                .upsert({
                country_slug: editingPlan.countrySlug,
                plan_id: editingPlan.planId,
                price: parsedPrice,
                active: editActive,
                popular: editPopular,
                updated_at: new Date()
                    .toISOString(),
            }, {
                onConflict: 'country_slug,plan_id',
            });
            if (error) {
                throw error;
            }
            const label = editingPlan.planLabel;
            setEditingPlan(null);
            setPriceInput('');
            await loadSettings(true);
            showToast({
                type: 'success',
                title: 'Forfait mis à jour',
                message: `${label} a été enregistré.`,
            });
        }
        catch (error) {
            console.error('Unable to save eSIM plan:', error);
            showToast({
                type: 'error',
                title: 'Enregistrement impossible',
                message: error instanceof
                    Error
                    ? error.message
                    :
                        'Erreur inconnue',
            });
        }
        finally {
            setSavingPlanKey(null);
        }
    };
    const formatNumber = (value: number, maximumFractionDigits = 0) => new Intl.NumberFormat(locale, {
        numberingSystem: 'latn',
        maximumFractionDigits,
    }).format(Number(value));
    const formatCurrencyLabel = (currency: string) => {
        if (currency
            .trim()
            .toUpperCase() ===
            'MRU') {
            return 'MRU';
        }
        return currency;
    };
    const formatAmount = (value: PriceValue, currency = 'MRU') => `${formatNumber(parsePrice(value), 2)} ${formatCurrencyLabel(currency)}`;
    return (<div dir={'ltr'} className="min-w-0 overflow-x-hidden pb-10">
      {toast && (<div className={[
                'fixed inset-x-3 top-3 z-[250] sm:w-full sm:max-w-sm',
                'sm:left-auto sm:right-4',
            ].join(' ')}>
          <div className={[
                'rounded-[18px] border bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.20)]',
                toast.type ===
                    'success'
                    ? 'border-emerald-100'
                    : toast.type ===
                        'error'
                        ? 'border-rose-100'
                        : 'border-blue-100',
            ].join(' ')}>
            <div className="flex items-start gap-3">
              <div className={[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] font-black',
                toast.type ===
                    'success'
                    ? 'bg-emerald-50 text-emerald-600'
                    : toast.type ===
                        'error'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-blue-50 text-blue-600',
            ].join(' ')}>
                {toast.type ===
                'success'
                ? '✓'
                : toast.type ===
                    'error'
                    ? '!'
                    : 'i'}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950">
                  {toast.title}
                </p>

                {toast.message && (<p className="mt-1 break-words text-xs leading-5 text-slate-500">
                    {toast.message}
                  </p>)}
              </div>

              <button type="button" onClick={() => setToast(null)} className="text-lg font-black text-slate-300 hover:text-slate-600" aria-label={'Fermer'}>
                ×
              </button>
            </div>
          </div>
        </div>)}

      <section className="relative overflow-hidden rounded-[26px] border border-slate-800/40 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.17)] sm:rounded-[30px] sm:p-7" style={{
            background: 'linear-gradient(135deg,#020617 0%,#0d1b3e 48%,#312e81 100%)',
        }}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-[90px]"/>

        <div className="pointer-events-none absolute -bottom-28 left-[30%] h-64 w-64 rounded-full bg-violet-500/15 blur-[90px]"/>

        <div className="relative">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400"/>

                <span className="text-xs font-black uppercase tracking-[0.14em] text-white/65">
                  eSIM CONTROL CENTER
                </span>
              </div>

              <h1 className="mt-5 text-[30px] font-black tracking-[-0.045em] sm:text-4xl">
                {'Destinations eSIM'}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                {'Gérez les destinations, leurs visuels, les forfaits et les prix directement depuis TEO STORE.'}
              </p>
            </div>

            <button type="button" onClick={() => void loadSettings(true)} disabled={isRefreshing ||
            isLoading} className="flex min-h-[52px] items-center justify-center gap-2 rounded-[15px] border border-white/10 bg-white/[0.08] px-5 text-sm font-black text-white transition hover:bg-white/[0.13] disabled:opacity-50">
              <span className={isRefreshing
            ? 'animate-spin'
            : ''}>
                ↻
              </span>

              {isRefreshing
            ?
                'Actualisation...'
            :
                'Actualiser'}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-6">
            {[
            {
                label: 'Pays',
                value: stats.countries,
                className: 'border-white/10 bg-white/[0.05]',
                labelClass: 'text-white/35',
            },
            {
                label: 'Pays actifs',
                value: stats.activeCountries,
                className: 'border-emerald-400/15 bg-emerald-400/[0.08]',
                labelClass: 'text-emerald-200',
            },
            {
                label: 'Forfaits',
                value: stats.totalPlans,
                className: 'border-white/10 bg-white/[0.05]',
                labelClass: 'text-white/35',
            },
            {
                label: 'Actifs',
                value: stats.activePlans,
                className: 'border-blue-400/15 bg-blue-400/[0.08]',
                labelClass: 'text-blue-200',
            },
            {
                label: 'Populaires',
                value: stats.popularPlans,
                className: 'border-violet-400/15 bg-violet-400/[0.08]',
                labelClass: 'text-violet-200',
            },
            {
                label: 'Images',
                value: stats.imageCount,
                className: 'border-cyan-400/15 bg-cyan-400/[0.08]',
                labelClass: 'text-cyan-200',
            },
        ].map((item) => (<div key={item.label} className={[
                'rounded-[17px] border p-3.5',
                item.className,
            ].join(' ')}>
                  <p className={[
                'text-xs font-black uppercase',
                item.labelClass,
            ].join(' ')}>
                    {item.label}
                  </p>

                  <p dir="ltr" className="mt-2 text-2xl font-black">
                    {formatNumber(item.value)}
                  </p>
                </div>))}
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[20px] border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white font-black text-blue-600 shadow-sm">
            i
          </div>

          <div className="min-w-0">
            <p className="text-sm font-black text-blue-900">
              {'Gestion eSIM connectée à Supabase'}
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              {'Les prix, états, mises en avant et images personnalisées sont enregistrés dans Supabase. Les caractéristiques de base restent actuellement chargées depuis esimCatalog.ts.'}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label htmlFor="esim-search" className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
          {'Recherche'}
        </label>

        <div className="relative mt-2">
          <input id="esim-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={'Pays, code ou slug...'} className={[
            'h-12 w-full min-w-0 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white',
            'pr-10',
        ].join(' ')}/>

          {searchQuery && (<button type="button" onClick={() => setSearchQuery('')} className={[
                'absolute top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-slate-200 text-sm font-black text-slate-500',
                'right-3',
            ].join(' ')} aria-label={'Effacer la recherche'}>
              ×
            </button>)}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-bold text-slate-400">
            <span dir="ltr">
              {formatNumber(filteredCountries.length)}
            </span>{' '}
            {'destination(s) sur'}{' '}
            <span dir="ltr">
              {formatNumber(esimCountries.length)}
            </span>
          </p>
        </div>
      </section>

      {loadError && (<div className="mt-5 rounded-[18px] border border-rose-100 bg-rose-50 p-4">
          <p className="text-sm font-black text-rose-700">
            {'Configuration indisponible'}
          </p>

          <p dir="ltr" className="mt-1 break-words text-left text-xs leading-5 text-rose-500">
            {loadError}
          </p>
        </div>)}

      {isLoading ? (<div className="mt-6 flex min-h-[260px] items-center justify-center rounded-[24px] border border-slate-200 bg-white">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"/>

            <p className="mt-4 text-sm font-bold text-slate-500">
              {'Chargement de la configuration eSIM...'}
            </p>
          </div>
        </div>) : filteredCountries.length >
            0 ? (<div className="mt-6 grid min-w-0 gap-4 xl:grid-cols-2">
          {filteredCountries.map((country) => {
                const countryActive = getCountryActive(country.slug);
                const countryImage = getCountryImageUrl(country.slug);
                const uploading = uploadingCountry ===
                    country.slug;
                const toggling = togglingCountry ===
                    country.slug;
                const countryDisplayName = country.name.fr;
                return (<article key={country.slug} className={[
                        'min-w-0 overflow-hidden rounded-[24px] border bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]',
                        countryActive
                            ? 'border-slate-200'
                            : 'border-slate-200 opacity-75',
                    ].join(' ')}>
                  <div className="relative min-h-[210px] overflow-hidden bg-slate-950">
                    {countryImage ? (<img src={countryImage} alt={countryDisplayName} className="absolute inset-0 h-full w-full object-cover"/>) : (<div className="absolute inset-0" style={{
                            background: 'linear-gradient(145deg,#07111f 0%,#102250 55%,#1d4ed8 100%)',
                        }}/>)}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/10"/>

                    <div className="relative flex min-h-[210px] flex-col justify-between p-5 text-white">
                      <div className="flex items-start justify-between gap-4">
                        <span className={[
                        'rounded-full border px-3 py-1.5 text-xs font-black uppercase backdrop-blur',
                        countryActive
                            ? 'border-emerald-300/30 bg-emerald-500/20 text-emerald-100'
                            : 'border-white/10 bg-white/10 text-white/50',
                    ].join(' ')}>
                          {countryActive
                        ?
                            'Active'
                        :
                            'Désactivée'}
                        </span>

                        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/15 bg-white/10 text-2xl backdrop-blur">
                          {country.flag}
                        </div>
                      </div>

                      <div>
                        <p dir="ltr" className="text-xs font-black uppercase tracking-[0.14em] text-blue-200">
                          {country.code}
                        </p>

                        <h2 className="mt-1 text-2xl font-black">
                          {countryDisplayName}
                        </h2>

                        <p className="mt-1 text-sm font-bold text-white/60">
                          {country.name.ar}
                        </p>

                        <p dir="ltr" className="mt-3 text-left text-xs font-semibold text-white/40">
                          /esim/
                          {country.slug}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-2 gap-2">
                      <label className={[
                        'flex min-h-[46px] cursor-pointer items-center justify-center rounded-[13px] bg-slate-950 px-3 text-center text-sm font-black text-white transition',
                        uploading
                            ? 'pointer-events-none opacity-50'
                            : 'hover:bg-slate-800',
                    ].join(' ')}>
                        {uploading
                        ?
                            'Envoi image...'
                        : countryImage
                            ?
                                'Changer image'
                            :
                                'Ajouter image'}

                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(event) => {
                        void handleCountryImageUpload(country.slug, countryDisplayName, event.target.files?.[0]);
                        event.target.value =
                            '';
                    }}/>
                      </label>

                      <button type="button" disabled={toggling} onClick={() => void handleToggleCountry(country.slug, countryDisplayName)} className={[
                        'min-h-[46px] rounded-[13px] border px-3 text-sm font-black transition disabled:opacity-50',
                        countryActive
                            ? 'border-rose-100 bg-rose-50 text-rose-600'
                            : 'border-emerald-100 bg-emerald-50 text-emerald-700',
                    ].join(' ')}>
                        {toggling
                        ?
                            'Mise à jour...'
                        : countryActive
                            ?
                                'Désactiver pays'
                            :
                                'Activer pays'}
                      </button>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          {'Forfaits'}
                        </p>

                        <p dir="ltr" className="mt-1 text-lg font-black text-slate-950">
                          {formatNumber(country.plans.length)}
                        </p>
                      </div>

                      {countryImage && (<span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-700">
                          {'Image configurée'}
                        </span>)}
                    </div>

                    <div className="mt-4 space-y-2">
                      {country.plans.map((plan) => {
                        const setting = getPlanSetting(country.slug, plan.id);
                        const catalogPrice = parsePrice(plan.price);
                        const price = Number(setting?.price ??
                            catalogPrice);
                        const active = setting?.active ??
                            true;
                        const popular = setting?.popular ??
                            Boolean(plan.popular);
                        const key = getPlanKey(country.slug, plan.id);
                        const currency = (plan as {
                            currency?: string;
                        }).currency ??
                            'MRU';
                        const planLabel = plan.data.fr;
                        const durationLabel = plan.duration.fr;
                        const speedLabel = plan.speed
                            ?
                                plan.speed.fr
                            : '';
                        return (<button key={plan.id} type="button" onClick={() => openPlanEditor(country.slug, countryDisplayName, plan.id, planLabel, plan.price, currency, Boolean(plan.popular))} className={[
                                'block w-full min-w-0 rounded-[17px] border p-3 transition',
                                'text-left',
                                active
                                    ? 'border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/40'
                                    : 'border-slate-200 bg-slate-100 opacity-60',
                            ].join(' ')}>
                              <div className="flex min-w-0 items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-black text-slate-800">
                                      {planLabel}
                                    </p>

                                    {popular && (<span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-black uppercase text-violet-700">
                                        {'Populaire'}
                                      </span>)}

                                    {!active && (<span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-black uppercase text-slate-600">
                                        {'Désactivé'}
                                      </span>)}
                                  </div>

                                  <p className="mt-1 text-xs font-semibold text-slate-400">
                                    {durationLabel}

                                    {speedLabel
                                ? ` · ${speedLabel}`
                                : ''}
                                  </p>
                                </div>

                                <div className={[
                                'shrink-0',
                                'text-right',
                            ].join(' ')}>
                                  <p dir="ltr" className="text-sm font-black text-slate-950">
                                    {formatAmount(price, currency)}
                                  </p>

                                  <p className="mt-1 text-xs font-black text-blue-600">
                                    {savingPlanKey ===
                                key
                                ? '...'
                                :
                                    'Modifier →'}
                                  </p>
                                </div>
                              </div>
                            </button>);
                    })}
                    </div>
                  </div>
                </article>);
            })}
        </div>) : (<div className="mt-6 rounded-[22px] border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-black text-slate-700">
            {'Aucune destination trouvée'}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {'Essayez une autre recherche.'}
          </p>

          <button type="button" onClick={() => setSearchQuery('')} className="mt-4 rounded-[11px] bg-slate-950 px-4 py-2.5 text-sm font-black text-white">
            {'Réinitialiser'}
          </button>
        </div>)}

      {editingPlan && (<div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[28px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                  {'Configuration forfait'}
                </p>

                <h3 className="mt-2 text-xl font-black text-slate-950">
                  {editingPlan.planLabel}
                </h3>

                <p className="mt-1 text-xs font-bold text-slate-400">
                  {editingPlan.countryName}
                </p>
              </div>

              <button type="button" onClick={closePlanEditor} disabled={Boolean(savingPlanKey)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500 disabled:opacity-40" aria-label={'Fermer'}>
                ×
              </button>
            </div>

            <div className="mt-5 rounded-[16px] border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-400">
                {'Prix catalogue original'}
              </p>

              <p dir="ltr" className="mt-1 text-left text-sm font-black text-slate-700">
                {formatAmount(editingPlan.originalPrice, editingPlan.currency)}
              </p>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-black text-slate-700">
                {'Prix client'}
              </span>

              <div className="mt-2 flex min-w-0 overflow-hidden rounded-[14px] border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white">
                <input dir="ltr" type="number" min="0" step="0.01" value={priceInput} onChange={(event) => setPriceInput(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent px-4 text-left text-sm font-black text-slate-950 outline-none"/>

                <div className="flex items-center border-l border-slate-200 px-4 text-sm font-black text-slate-400">
                  {editingPlan.currency}
                </div>
              </div>
            </label>

            <div className="mt-5 space-y-2">
              <button type="button" onClick={() => setEditActive((current) => !current)} className={[
                'flex w-full items-center justify-between rounded-[15px] border p-4 transition',
                'text-left',
                editActive
                    ? 'border-emerald-100 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50',
            ].join(' ')}>
                <div>
                  <p className="text-sm font-black text-slate-900">
                    {'Forfait actif'}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {'Autoriser ce forfait dans le catalogue.'}
                  </p>
                </div>

                <div dir="ltr" className={[
                'relative h-6 w-11 shrink-0 rounded-full transition',
                editActive
                    ? 'bg-emerald-500'
                    : 'bg-slate-300',
            ].join(' ')}>
                  <span className={[
                'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition',
                editActive
                    ? 'left-6'
                    : 'left-1',
            ].join(' ')}/>
                </div>
              </button>

              <button type="button" onClick={() => setEditPopular((current) => !current)} className={[
                'flex w-full items-center justify-between rounded-[15px] border p-4 transition',
                'text-left',
                editPopular
                    ? 'border-violet-100 bg-violet-50'
                    : 'border-slate-200 bg-slate-50',
            ].join(' ')}>
                <div>
                  <p className="text-sm font-black text-slate-900">
                    {'Mettre en avant'}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {'Marquer ce forfait comme populaire.'}
                  </p>
                </div>

                <div dir="ltr" className={[
                'relative h-6 w-11 shrink-0 rounded-full transition',
                editPopular
                    ? 'bg-violet-500'
                    : 'bg-slate-300',
            ].join(' ')}>
                  <span className={[
                'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition',
                editPopular
                    ? 'left-6'
                    : 'left-1',
            ].join(' ')}/>
                </div>
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button type="button" onClick={closePlanEditor} disabled={Boolean(savingPlanKey)} className="min-h-[48px] rounded-[14px] border border-slate-200 text-sm font-black text-slate-700 disabled:opacity-40">
                {'Annuler'}
              </button>

              <button type="button" onClick={() => void handleSavePlan()} disabled={!canSavePlan} className="min-h-[48px] rounded-[14px] bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
                {savingPlanKey
                ?
                    'Enregistrement...'
                :
                    'Enregistrer'}
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
export default AdminEsimPage;
