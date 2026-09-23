import React from 'react';

// Brand Logo Component that renders clean brand icon or fetched CDN logo
interface BrandLogoProps {
  brandName?: string;
  className?: string;
  showName?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  brandName = 'Outros',
  className = 'w-4 h-4',
  showName = true,
}) => {
  const normalized = brandName.trim().toLowerCase();

  // Mapping known tech & accessory brands to clear SVG / Logo URLs
  const getBrandContent = () => {
    if (normalized.includes('apple')) {
      return (
        <span className="flex items-center gap-1.5 font-bold text-slate-100">
          <svg className={`${className} fill-current text-slate-100`} viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.9-14.38-6.08-3.48-2.82-7.39-7.53-11.73-14.13-6.52-9.9-11.58-20.98-15.18-33.24-3.6-12.26-5.41-23.78-5.41-34.56 0-14.5 3.51-26.25 10.53-35.25 7.02-9 15.75-13.62 26.19-13.88 4.23 0 9.14 1.13 14.73 3.38 5.59 2.25 9.4 3.38 11.43 3.38 1.83 0 5.72-1.19 11.67-3.57 5.95-2.38 10.74-3.51 14.37-3.38 10.12.5 18.6 4.88 25.43 13.13-9 5.48-13.38 13.13-13.13 22.95.25 8.12 3.4 14.88 9.45 20.25 6.05 5.38 13.25 8.5 21.6 9.38-2.38 7.25-5.63 14.5-9.75 21.75zM119.22 31.88c0-6.75 2.5-13.25 7.5-19.5 5-6.25 11.25-10.38 18.75-12.38.38 1.13.56 2.13.56 3 0 6.88-2.63 13.5-7.88 19.88-5.25 6.38-11.5 10.38-18.75 12-0.12-1-.18-2-.18-3z" />
          </svg>
          {showName && <span>Apple</span>}
        </span>
      );
    }

    if (normalized.includes('samsung')) {
      return (
        <span className="flex items-center gap-1.5 font-bold text-blue-400">
          <span className="bg-blue-600 text-white px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-widest">SAMSUNG</span>
          {showName && <span>Samsung</span>}
        </span>
      );
    }

    if (normalized.includes('xiaomi') || normalized.includes('redmi') || normalized.includes('poco')) {
      return (
        <span className="flex items-center gap-1.5 font-bold text-orange-400">
          <span className="bg-orange-600 text-white w-4 h-4 rounded flex items-center justify-center font-black text-[9px]">mi</span>
          {showName && <span>{brandName}</span>}
        </span>
      );
    }

    if (normalized.includes('kingston')) {
      return (
        <span className="flex items-center gap-1.5 font-bold text-red-400">
          <span className="bg-red-600 text-white px-1 rounded text-[9px] font-black">K</span>
          {showName && <span>Kingston</span>}
        </span>
      );
    }

    if (normalized.includes('baseus')) {
      return (
        <span className="flex items-center gap-1.5 font-bold text-yellow-300">
          <span className="bg-yellow-500 text-slate-950 px-1 rounded text-[9px] font-black uppercase">Baseus</span>
          {showName && <span>Baseus</span>}
        </span>
      );
    }

    if (normalized.includes('spigen')) {
      return (
        <span className="flex items-center gap-1.5 font-bold text-amber-400">
          <span className="bg-amber-600 text-white w-4 h-4 rounded flex items-center justify-center font-black text-[9px]">S</span>
          {showName && <span>Spigen</span>}
        </span>
      );
    }

    if (normalized.includes('redragon')) {
      return (
        <span className="flex items-center gap-1.5 font-bold text-rose-500">
          <span className="bg-rose-700 text-white w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px]">🐲</span>
          {showName && <span>Redragon</span>}
        </span>
      );
    }

    if (normalized.includes('dell')) {
      return (
        <span className="flex items-center gap-1.5 font-bold text-blue-300">
          <span className="border border-blue-400 rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black">DELL</span>
          {showName && <span>Dell</span>}
        </span>
      );
    }

    if (normalized.includes('motorola') || normalized.includes('moto')) {
      return (
        <span className="flex items-center gap-1.5 font-bold text-cyan-400">
          <span className="bg-cyan-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">M</span>
          {showName && <span>Motorola</span>}
        </span>
      );
    }

    if (normalized.includes('jbl')) {
      return (
        <span className="flex items-center gap-1.5 font-bold text-orange-500">
          <span className="bg-orange-600 text-white px-1 rounded text-[9px] font-black">JBL</span>
          {showName && <span>JBL</span>}
        </span>
      );
    }

    if (normalized.includes('genérica') || normalized.includes('generica') || normalized.includes('oem')) {
      return (
        <span className="flex items-center gap-1.5 font-medium text-slate-400">
          <span className="bg-slate-800 text-slate-300 px-1 rounded text-[9px] font-bold">GEN</span>
          {showName && <span>Genérica</span>}
        </span>
      );
    }

    // Default Brand Badge
    return (
      <span className="flex items-center gap-1.5 font-bold text-cyan-300">
        <span className="bg-blue-900 border border-cyan-500/50 text-cyan-200 px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider">
          {brandName.substring(0, 3)}
        </span>
        {showName && <span>{brandName}</span>}
      </span>
    );
  };

  return getBrandContent();
};
