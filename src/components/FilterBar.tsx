import React from 'react';
import type { FilterState, School } from '../types/school';
import { SEOUL_DISTRICTS } from '../../server/schoolinfo';
import { Search, RotateCcw, X, Star } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  allSchools: School[];
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
}

const SCHOOL_TYPES = ['전체', '일반고', '자사고', '특목고', '영재고', '특성화고', '학력인정고', '기타'];
const GENDER_TYPES = ['전체', '남학교', '여학교', '남녀공학'];
const FOUNDATION_TYPES = ['전체', '공립', '사립', '국립', '기타'];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  allSchools,
  onFilterChange,
  onResetFilters,
}) => {
  // Compute dynamic counts per district from real fetched data
  const districtCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of SEOUL_DISTRICTS) {
      counts[d.name] = 0;
    }
    for (const s of allSchools) {
      if (s.district && counts[s.district] !== undefined) {
        counts[s.district]++;
      }
    }
    return counts;
  }, [allSchools]);

  // Check if any filter is active
  const isFiltered =
    filters.searchQuery.trim() !== '' ||
    filters.district !== '전체' ||
    filters.schoolType !== '전체' ||
    filters.genderType !== '전체' ||
    filters.foundationType !== '전체' ||
    filters.onlyFavorites;

  return (
    <div className="bg-white border-b border-slate-200/90 p-4 space-y-3">
      {/* Search Input Row */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
          placeholder="학교명 검색 (예: 경희, 서울과학, 대원...)"
          className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* District Select */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">지역(구)</label>
          <select
            value={filters.district}
            onChange={(e) => onFilterChange({ ...filters, district: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium text-slate-700"
          >
            <option value="전체">서울 전체 (25개구)</option>
            {SEOUL_DISTRICTS.map((d) => (
              <option key={d.code} value={d.name}>
                {d.name} {districtCounts[d.name] !== undefined ? `(${districtCounts[d.name]}개교)` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* School Type Select */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">학교 유형</label>
          <select
            value={filters.schoolType}
            onChange={(e) => onFilterChange({ ...filters, schoolType: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium text-slate-700"
          >
            {SCHOOL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Gender Select */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">남녀 구분</label>
          <select
            value={filters.genderType}
            onChange={(e) => onFilterChange({ ...filters, genderType: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium text-slate-700"
          >
            {GENDER_TYPES.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </div>

        {/* Foundation Select */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">설립 구분</label>
          <select
            value={filters.foundationType}
            onChange={(e) => onFilterChange({ ...filters, foundationType: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium text-slate-700"
          >
            {FOUNDATION_TYPES.map((found) => (
              <option key={found} value={found}>
                {found}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applied Filters & Quick Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onFilterChange({ ...filters, onlyFavorites: !filters.onlyFavorites })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs font-medium ${
              filters.onlyFavorites
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-transparent'
            }`}
          >
            <Star className={`w-3 h-3 ${filters.onlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
            <span>즐겨찾기만</span>
          </button>

          {/* Active condition tags */}
          {filters.district !== '전체' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs">
              {filters.district}
              <button onClick={() => onFilterChange({ ...filters, district: '전체' })}>
                <X className="w-3 h-3 hover:text-blue-900 cursor-pointer" />
              </button>
            </span>
          )}
          {filters.schoolType !== '전체' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs">
              {filters.schoolType}
              <button onClick={() => onFilterChange({ ...filters, schoolType: '전체' })}>
                <X className="w-3 h-3 hover:text-blue-900 cursor-pointer" />
              </button>
            </span>
          )}
          {filters.genderType !== '전체' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs">
              {filters.genderType}
              <button onClick={() => onFilterChange({ ...filters, genderType: '전체' })}>
                <X className="w-3 h-3 hover:text-blue-900 cursor-pointer" />
              </button>
            </span>
          )}
          {filters.foundationType !== '전체' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs">
              {filters.foundationType}
              <button onClick={() => onFilterChange({ ...filters, foundationType: '전체' })}>
                <X className="w-3 h-3 hover:text-blue-900 cursor-pointer" />
              </button>
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>필터 초기화</span>
          </button>
        )}
      </div>
    </div>
  );
};
