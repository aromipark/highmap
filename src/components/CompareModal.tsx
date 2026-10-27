import React from 'react';
import type { School } from '../types/school';
import { X, Scale, Trash2 } from 'lucide-react';

interface CompareModalProps {
  schools: School[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveSchool: (schoolCode: string) => void;
  onClearAll: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  schools,
  isOpen,
  onClose,
  onRemoveSchool,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1300] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">학교 비교함</h2>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
              {schools.length} / 4개교
            </span>
          </div>
          <div className="flex items-center gap-2">
            {schools.length > 0 && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition-colors font-medium px-2 py-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>모두 비우기</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {schools.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Scale className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-base font-semibold text-slate-700 mb-1">
                비교함이 비어 있습니다
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                학교 목록 카드나 상세정보에서 [비교함 추가] 버튼을 눌러 최대 4개 고등학교를 비교해 보세요.
              </p>
            </div>
          ) : (
            <div className="min-w-[600px]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="p-3 text-left font-bold text-slate-700 bg-slate-50 w-28">
                      구분
                    </th>
                    {schools.map((school) => (
                      <th
                        key={school.schoolCode}
                        className="p-3 text-left font-bold text-slate-900 bg-blue-50/40 relative"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-sm font-extrabold text-blue-900 leading-snug">
                            {school.schoolName}
                          </span>
                          <button
                            onClick={() => onRemoveSchool(school.schoolCode)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            title="삭제"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal mt-1">
                          {school.schoolType} · {school.district}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50">학교 유형</td>
                    {schools.map((s) => (
                      <td key={s.schoolCode} className="p-3 font-medium text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {s.schoolType}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50">남녀 구분</td>
                    {schools.map((s) => (
                      <td key={s.schoolCode} className="p-3 font-medium text-slate-800">
                        {s.genderType}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50">설립 구분</td>
                    {schools.map((s) => (
                      <td key={s.schoolCode} className="p-3 font-medium text-slate-800">
                        {s.foundationType}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50">지역 (구)</td>
                    {schools.map((s) => (
                      <td key={s.schoolCode} className="p-3 text-slate-800">
                        {s.district}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50">교육지원청</td>
                    {schools.map((s) => (
                      <td key={s.schoolCode} className="p-3 text-slate-800">
                        {s.eduOffice || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50">총 학생 수</td>
                    {schools.map((s) => (
                      <td key={s.schoolCode} className="p-3 font-bold text-slate-900 tabular-nums">
                        {s.studentCount ? `${s.studentCount.toLocaleString()}명` : '공시 확인필요'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50">학급 수</td>
                    {schools.map((s) => (
                      <td key={s.schoolCode} className="p-3 text-slate-800 tabular-nums">
                        {s.classCount ? `${s.classCount}학급` : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50">학급당 학생 수</td>
                    {schools.map((s) => (
                      <td key={s.schoolCode} className="p-3 text-slate-800 tabular-nums">
                        {s.studentsPerClass ? `${s.studentsPerClass}명` : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50">교원 수</td>
                    {schools.map((s) => (
                      <td key={s.schoolCode} className="p-3 text-slate-800 tabular-nums">
                        {s.teacherCount ? `${s.teacherCount}명` : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50">소재지</td>
                    {schools.map((s) => (
                      <td key={s.schoolCode} className="p-3 text-slate-600 text-[11px] leading-relaxed">
                        {s.address || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50">대표 전화</td>
                    {schools.map((s) => (
                      <td key={s.schoolCode} className="p-3 text-slate-700">
                        {s.phone || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50">홈페이지</td>
                    {schools.map((s) => (
                      <td key={s.schoolCode} className="p-3">
                        {s.homepage ? (
                          <a
                            href={s.homepage}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            바로가기
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
