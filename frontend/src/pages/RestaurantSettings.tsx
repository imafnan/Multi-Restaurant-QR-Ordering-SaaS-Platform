import React, { useState, useEffect } from 'react';
import api from '../api';
import { Upload, Store, Image as ImageIcon, Percent, CheckCircle } from 'lucide-react';

export const RestaurantSettings: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [vatPercentage, setVatPercentage] = useState('0');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/restaurant/settings');
      setLogoUrl(res.data.logo || '');
      setBannerUrl(res.data.banner || '');
      setVatPercentage((res.data.vatPercentage || 0).toString());
    } catch (err) {
      console.error('Failed to load branding settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('vatPercentage', vatPercentage);
    if (logoFile) formData.append('logo', logoFile);
    if (bannerFile) formData.append('banner', bannerFile);

    try {
      const res = await api.put('/restaurant/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLogoUrl(res.data.settings.logo || '');
      setBannerUrl(res.data.settings.banner || '');
      setVatPercentage((res.data.settings.vatPercentage || 0).toString());

      setLogoFile(null);
      setLogoPreview('');
      setBannerFile(null);
      setBannerPreview('');

      setSuccessMsg('Branding settings updated successfully! Changes are instantly live.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branding Images Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col items-center gap-4 relative overflow-hidden backdrop-blur-xl">
            <h4 className="font-bold text-slate-300 text-xs tracking-wider uppercase self-start">
              Restaurant Logo
            </h4>
            
            <div className="relative w-32 h-32 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : logoUrl ? (
                <img src={`http://localhost:5000${logoUrl}`} alt="Current Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-12 h-12 text-slate-700" />
              )}
            </div>

            <label className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-semibold py-2 px-5 rounded-xl text-xs cursor-pointer transition-all hover:border-slate-750">
              <Upload className="w-4 h-4" />
              <span>{logoUrl || logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans text-center max-w-[200px]">
              Displayed in Portal sidebar, header, POS, Kitchen & Order receipts. Square PNG/WEBP recommended.
            </p>
          </div>

          {/* Banner Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col items-center gap-4 relative overflow-hidden backdrop-blur-xl">
            <h4 className="font-bold text-slate-300 text-xs tracking-wider uppercase self-start">
              Restaurant Banner
            </h4>
            
            <div className="relative w-full h-32 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : bannerUrl ? (
                <img src={`http://localhost:5000${bannerUrl}`} alt="Current Banner" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-10 h-10 text-slate-700" />
              )}
            </div>

            <label className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-semibold py-2 px-5 rounded-xl text-xs cursor-pointer transition-all hover:border-slate-750">
              <Upload className="w-4 h-4" />
              <span>{bannerUrl || bannerPreview ? 'Change Banner' : 'Upload Banner'}</span>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleBannerChange}
                className="hidden"
              />
            </label>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans text-center max-w-[220px]">
              Displayed at the top of your Restaurant QR Menu portal page. Landscape orientation recommended.
            </p>
          </div>
        </div>

        {/* VAT Tax Card */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
          <div className="space-y-4">
            <h4 className="font-bold text-slate-300 text-xs tracking-wider uppercase">
              VAT Percentage (%)
            </h4>
            
            <div className="relative max-w-sm">
              <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="e.g. 10"
                value={vatPercentage}
                onChange={(e) => setVatPercentage(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-sans font-mono"
              />
            </div>
            
            <p className="text-slate-500 text-xs leading-relaxed font-sans max-w-lg">
              This tax percentage is applied automatically to all customer orders. Calculated during cart checkout and printed on all receipts (POS, Kitchen).
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveLoading}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-amber-500/10 text-xs"
          >
            {saveLoading && <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
            <span>Save Branding Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
