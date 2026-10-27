import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { School, FilterState } from './types/school';
import { SchoolMap } from './components/SchoolMap';
import { SchoolCard } from './components/SchoolCard';
import { FilterBar } from './components/FilterBar';
import { SchoolDetailDrawer } from './components/SchoolDetailDrawer';
import { CompareModal } from './components/CompareModal';
import {
  Map,
  List,
  Scale,
  RefreshCw,
  KeyRound,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles
} from 'lucide-react';

export function App() {
  // Raw school data from API
  const [schools, setSchools] = useState<School[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [failedDistricts, setFailedDistricts] = useState<string[]>([]);
  const [showFailedDistricts, setShowFailedDistricts] = useState<boolean>(false);

  // Selected school & comparison
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [compareSchools, setCompareSchools] = useState<School[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('seoul_high_schools_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    district: '전체',
    schoolType: '전체',
    genderType: '전체',
    foundationType: '전체',
    onlyFavorites: false,
  });

  // Toast message for coordinate-less schools
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const schoolListContainerRef = useRef<HTMLDivElement>(null);

  // Mobile Tab State ('map' | 'list')
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('seoul_high_schools_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.warn('Could not save favorites to localStorage', e);
    }
  }, [favorites]);

  // Fetch schools on mount
  const fetchSchools = () => {
    setDataLoading(true);
    setApiError(null);
    setApiKeyMissing(false);
    setFailedDistricts([]);

    fetch('/api/schools')
      .then(async (res) => {
        if (res.status === 503) {
          const errData = await res.json().catch(() => ({}));
          if (errData.error === 'SCHOOLINFO_API_KEY_MISSING') {
            setApiKeyMissing(true);
            return null;
          }
        }
        if (!res.ok) {
          throw new Error(`학교알리미 API 호출 실패 (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data.schools)) {
          setSchools(data.schools);
          if (Array.isArray(data.failedDistricts) && data.failedDistricts.length > 0) {
            setFailedDistricts(data.failedDistricts);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load schools:', err);
        setApiError('학교알리미 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
      })
      .finally(() => {
        setDataLoading(false);
      });
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  // Filtered schools
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      // Search Query
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.trim().toLowerCase();
        const matchName = school.schoolName.toLowerCase().includes(query);
        const matchAddress = school.address.toLowerCase().includes(query);
        if (!matchName && !matchAddress) return false;
      }

      // District
      if (filters.district !== '전체' && school.district !== filters.district) {
        return false;
      }

      // School Type
      if (filters.schoolType !== '전체' && school.schoolType !== filters.schoolType) {
        return false;
      }

      // Gender
      if (filters.genderType !== '전체' && school.genderType !== filters.genderType) {
        return false;
      }

      // Foundation
      if (filters.foundationType !== '전체' && school.foundationType !== filters.foundationType) {
        return false;
      }

      // Only Favorites
      if (filters.onlyFavorites && !favorites.includes(school.schoolCode)) {
        return false;
      }

      return true;
    });
  }, [schools, filters, favorites]);

  // Handle selecting a school
  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
    setIsDetailOpen(true);

    if (!school.hasLocation) {
      showToast('이 학교는 위치정보가 없어 지도에 표시되지 않습니다');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Toggle favorite
  const handleToggleFavorite = (schoolCode: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(schoolCode)
        ? prev.filter((id) => id !== schoolCode)
        : [...prev, schoolCode]
    );
  };

  // Toggle compare
  const handleToggleCompare = (school: School, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompareSchools((prev) => {
      const exists = prev.some((s) => s.schoolCode === school.schoolCode);
      if (exists) {
        return prev.filter((s) => s.schoolCode !== school.schoolCode);
      }
      if (prev.length >= 4) {
        showToast('비교함에는 최대 4개 고등학교까지 담을 수 있습니다.');
        return prev;
      }
      return [...prev, school];
    });
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      district: '전체',
      schoolType: '전체',
      genderType: '전체',
      foundationType: '전체',
      onlyFavorites: false,
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[2000] bg-slate-900/90 text-white text-xs px-4 py-2.5 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Info className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 z-30 shadow-xs">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                서울 고교 지도
              </h1>
              {/* Dynamic Status Badge */}
              {dataLoading ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                  <span>서울 고등학교 조회 중</span>
                </span>
              ) : apiKeyMissing ? (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  인증키 설정 필요
                </span>
              ) : apiError ? (
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  학교알리미 연결 실패
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md tabular-nums">
                  서울 고등학교 {schools.length}개교
                  {failedDistricts.length > 0 && ` · 일부 실패 (${failedDistricts.length})`}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              지도에서 찾고, 공시정보로 비교하는 서울 고등학교 안내
            </p>
          </div>
        </div>

        {/* Right Action Zone */}
        <div className="flex items-center gap-2">
          {/* Mobile Tab Switcher */}
          <div className="flex sm:hidden items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setMobileTab('map')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                mobileTab === 'map' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>지도</span>
            </button>
            <button
              onClick={() => setMobileTab('list')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                mobileTab === 'list' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>목록 ({filteredSchools.length})</span>
            </button>
          </div>

          {/* Compare Button */}
          <button
            onClick={() => setIsCompareOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
              compareSchools.length > 0
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs hover:bg-blue-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>비교함</span>
            <span
              className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                compareSchools.length > 0 ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {compareSchools.length}
            </span>
          </button>
        </div>
      </header>

      {/* Main Body: Two Columns (Left: ~35% List, Right: ~65% Map) */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Column: School List & Filters */}
        <section
          className={`w-full sm:w-[380px] lg:w-[420px] xl:w-[460px] h-full flex flex-col bg-slate-50 border-r border-slate-200 z-10 shrink-0 ${
            mobileTab === 'list' ? 'flex' : 'hidden sm:flex'
          }`}
        >
          {/* Multi-criteria Filter Bar */}
          <FilterBar
            filters={filters}
            allSchools={schools}
            onFilterChange={setFilters}
            onResetFilters={handleResetFilters}
          />

          {/* List Status Kicker Bar */}
          <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              조건에 맞는 학교{' '}
              <strong className="text-blue-700 tabular-nums">{filteredSchools.length}</strong>개교
            </span>
            {failedDistricts.length > 0 && (
              <button
                onClick={() => setShowFailedDistricts(!showFailedDistricts)}
                className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 cursor-pointer"
              >
                <span>일부 구 실패 ({failedDistricts.length})</span>
                {showFailedDistricts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Expandable Failed Districts Notice */}
          {showFailedDistricts && failedDistricts.length > 0 && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>조회 실패 자치구 ({failedDistricts.length}개)</span>
              </div>
              <p className="text-[11px] text-amber-800">
                {failedDistricts.join(', ')}의 공시정보 연결이 지연되었습니다.
              </p>
              <button
                onClick={fetchSchools}
                className="mt-1 text-xs text-blue-700 font-semibold hover:underline cursor-pointer"
              >
                해당 자치구 다시 시도
              </button>
            </div>
          )}

          {/* School Card Scroll Area */}
          <div ref={schoolListContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {/* Condition 3: Missing API Key Message */}
            {apiKeyMissing && (
              <div className="my-8 mx-2 p-5 bg-white border border-amber-200 rounded-xl shadow-xs text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  학교알리미 인증키 설정 안내
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  학교알리미 인증키(<strong>SCHOOLINFO_API_KEY</strong>)가 설정되지 않았습니다.
                  <br />
                  AI Studio의 Settings &gt; Secrets(또는 배포 사이트의 환경변수)에 키를 추가하면 서울 고등학교 목록이 나타납니다.
                </p>
                <button
                  onClick={fetchSchools}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>설정 후 새로고침</span>
                </button>
              </div>
            )}

            {/* Condition 6: Total Error Message */}
            {!apiKeyMissing && apiError && (
              <div className="my-8 mx-2 p-5 bg-white border border-rose-200 rounded-xl shadow-xs text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">학교알리미 연결 실패</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{apiError}</p>
                <button
                  onClick={fetchSchools}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>다시 시도</span>
                </button>
              </div>
            )}

            {/* Condition 4: Loading State */}
            {dataLoading && (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                <div className="text-xs font-medium">서울 25개 자치구 고등학교 조회 중…</div>
              </div>
            )}

            {/* Condition 7: Normal fetch, but 0 filter matches */}
            {!dataLoading && !apiKeyMissing && !apiError && filteredSchools.length === 0 && (
              <div className="my-12 mx-2 p-6 bg-white border border-slate-200 rounded-xl text-center space-y-2">
                <p className="text-sm font-semibold text-slate-800">
                  조건에 맞는 학교가 없습니다.
                </p>
                <p className="text-xs text-slate-500">
                  필터를 줄이거나 초기화해 보세요.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  필터 초기화하기
                </button>
              </div>
            )}

            {/* Render School Cards */}
            {!dataLoading &&
              !apiKeyMissing &&
              filteredSchools.map((school) => (
                <SchoolCard
                  key={school.schoolCode}
                  school={school}
                  isSelected={selectedSchool?.schoolCode === school.schoolCode}
                  isFavorite={favorites.includes(school.schoolCode)}
                  isInCompare={compareSchools.some((s) => s.schoolCode === school.schoolCode)}
                  onSelect={handleSelectSchool}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleCompare={handleToggleCompare}
                />
              ))}
          </div>
        </section>

        {/* Right Column: Leaflet Map */}
        <section
          className={`flex-1 h-full relative ${
            mobileTab === 'map' ? 'flex' : 'hidden sm:flex'
          }`}
        >
          <SchoolMap
            schools={filteredSchools}
            selectedSchoolCode={selectedSchool?.schoolCode || null}
            selectedDistrict={filters.district}
            onSelectSchool={handleSelectSchool}
            onSelectDistrict={(district) => setFilters((prev) => ({ ...prev, district }))}
            isMapTabActive={mobileTab === 'map'}
          />
        </section>
      </main>

      {/* School Detail Tabbed Drawer */}
      <SchoolDetailDrawer
        school={selectedSchool}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        isFavorite={Boolean(selectedSchool && favorites.includes(selectedSchool.schoolCode))}
        isInCompare={Boolean(selectedSchool && compareSchools.some((s) => s.schoolCode === selectedSchool.schoolCode))}
        onToggleFavorite={(code) => handleToggleFavorite(code)}
        onToggleCompare={(sch) => handleToggleCompare(sch)}
      />

      {/* Side-by-Side Compare Modal */}
      <CompareModal
        schools={compareSchools}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onRemoveSchool={(code) =>
          setCompareSchools((prev) => prev.filter((s) => s.schoolCode !== code))
        }
        onClearAll={() => setCompareSchools([])}
      />
    </div>
  );
}

export default App;
