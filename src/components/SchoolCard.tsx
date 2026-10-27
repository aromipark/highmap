import React from 'react';
import type { School } from '../types/school';
import { Star, MapPinOff, ArrowRight, Scale, Check } from 'lucide-react';

interface SchoolCardProps {
  school: School;
  isSelected: boolean;
  isFavorite: boolean;
  isInCompare: boolean;
  onSelect: (school: School) => void;
  onToggleFavorite: (schoolCode: string, e: React.MouseEvent) => void;
  onToggleCompare: (school: School, e: React.MouseEvent) => void;
}

export const SchoolCard: React.FC<SchoolCardProps> = ({
  school,
  isSelected,
  isFavorite,
  isInCompare,
  onSelect,
  onToggleFavorite,
  onToggleCompare,
}) => {
  return (
    <div
      onClick={() => onSelect(school)}
      className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-300'
          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Top Metadata Row */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
            {school.schoolType}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600 font-medium">{school.district}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600">{school.genderType}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{school.foundationType}</span>
        </div>

        {/* Favorite & Compare Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => onToggleCompare(school, e)}
            title={isInCompare ? '비교함에서 제거' : '비교함에 추가 (최대 4개)'}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isInCompare
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isInCompare ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => onToggleFavorite(school.schoolCode, e)}
            title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 저장'}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isFavorite
                ? 'text-amber-500 fill-amber-500'
                : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* School Name */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
          {school.schoolName}
        </h3>
        {!school.hasLocation && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded shrink-0">
            <MapPinOff className="w-3 h-3" />
            위치정보 없음
          </span>
        )}
      </div>

      {/* Quick Statistics or Hint */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div>
          {school.studentCount ? (
            <span className="tabular-nums font-medium text-slate-700">
              총 학생 {school.studentCount.toLocaleString()}명
              {school.studentsPerClass ? ` · 학급당 ${school.studentsPerClass}명` : ''}
            </span>
          ) : (
            <span className="text-slate-400">상세정보 확인</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform text-[11px]">
          <span>자세히</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
