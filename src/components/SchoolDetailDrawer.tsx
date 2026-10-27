import React, { useEffect, useState } from 'react';
import type { School, SchoolDetailData } from '../types/school';
import {
  X,
  ExternalLink,
  Phone,
  MapPin,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Sparkles,
  Award,
  Star,
  Scale,
  Check,
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react';

interface SchoolDetailDrawerProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  isInCompare: boolean;
  onToggleFavorite: (schoolCode: string) => void;
  onToggleCompare: (school: School) => void;
}

type TabType = 'basic' | 'students' | 'admissions' | 'curriculum' | 'specialties' | 'career';

export const SchoolDetailDrawer: React.FC<SchoolDetailDrawerProps> = ({
  school,
  isOpen,
  onClose,
  isFavorite,
  isInCompare,
  onToggleFavorite,
  onToggleCompare,
}) => {
  const [detailData, setDetailData] = useState<SchoolDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  useEffect(() => {
    if (!school || !isOpen) {
      setDetailData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/schools/${school.schoolCode}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`상세정보 조회 실패 (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((data: SchoolDetailData) => {
        if (isMounted) {
          setDetailData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setError('자료를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [school, isOpen]);

  if (!isOpen || !school) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[1200] w-full max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
              {school.schoolType}
            </span>
            <span>·</span>
            <span className="font-medium text-slate-700">{school.district}</span>
            <span>·</span>
            <span>{school.genderType}</span>
            <span>·</span>
            <span>{school.foundationType}</span>
            {school.eduOffice && (
              <>
                <span>·</span>
                <span className="text-slate-600 font-medium">{school.eduOffice}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleCompare(school)}
              title={isInCompare ? '비교함에서 제거' : '비교함에 추가'}
              className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                isInCompare
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isInCompare ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
              <span>비교</span>
            </button>
            <button
              onClick={() => onToggleFavorite(school.schoolCode)}
              title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 저장'}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-500 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 leading-tight mb-2">
          {school.schoolName}
        </h2>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{school.address || '주소 정보 미등록'}</span>
          </div>
          {school.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <a href={`tel:${school.phone}`} className="hover:text-blue-600">
                {school.phone}
              </a>
            </div>
          )}
          {school.homepage && school.homepage.startsWith('http') && (
            <div className="flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <a
                href={school.homepage}
                target="_blank"
                rel="noreferrer noopener"
                className="text-blue-600 hover:underline font-medium"
              >
                학교 홈페이지
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 border-b border-slate-200 bg-white overflow-x-auto text-xs shrink-0 no-scrollbar">
        <button
          onClick={() => setActiveTab('basic')}
          className={`px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'basic'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          기본정보
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'students'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          학생 현황
        </button>
        <button
          onClick={() => setActiveTab('admissions')}
          className={`px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'admissions'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          입학 정보
        </button>
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'curriculum'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          교육과정
        </button>
        <button
          onClick={() => setActiveTab('specialties')}
          className={`px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'specialties'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          학교 특색
        </button>
        <button
          onClick={() => setActiveTab('career')}
          className={`px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'career'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          졸업 후 진로
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm">공시정보를 불러오는 중입니다…</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">자료를 불러오지 못했습니다</div>
              <div className="text-xs text-amber-800">{error}</div>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Tab: Basic Info */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">학교 유형</div>
                    <div className="text-sm font-bold text-slate-900">{school.schoolType}</div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">설립 구분</div>
                    <div className="text-sm font-bold text-slate-900">{school.foundationType}</div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">성별 구분</div>
                    <div className="text-sm font-bold text-slate-900">{school.genderType}</div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">관할 교육지원청</div>
                    <div className="text-sm font-bold text-slate-900">{school.eduOffice || '서울특별시교육청'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3 text-xs">
                  <div className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
                    학교 기본 제원
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">학교 고유코드</span>
                    <span className="font-mono text-slate-800">{school.schoolCode}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">소재지</span>
                    <span className="text-slate-800 text-right">{school.address || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">대표 전화</span>
                    <span className="text-slate-800">{school.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">지도 좌표</span>
                    <span className="text-slate-800">
                      {school.hasLocation ? `${school.latitude?.toFixed(5)}, ${school.longitude?.toFixed(5)}` : '위치정보 없음'}
                    </span>
                  </div>
                </div>

                {/* External Official Link */}
                <div className="pt-2">
                  <a
                    href={`https://www.schoolinfo.go.kr/ei/ss/PbanSearch.do?schulCode=${school.schoolCode}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>학교알리미 공식 정보공시 웹사이트 보기</span>
                  </a>
                </div>
              </div>
            )}

            {/* Tab: Student Status */}
            {activeTab === 'students' && (
              <div className="space-y-4">
                {detailData?.students ? (
                  <>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-center">
                        <div className="text-[11px] text-blue-700 font-medium mb-1">총 학생 수</div>
                        <div className="text-lg font-bold text-blue-900 tabular-nums">
                          {detailData.students.total.toLocaleString()}명
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <div className="text-[11px] text-slate-500 font-medium mb-1">총 학급 수</div>
                        <div className="text-lg font-bold text-slate-900 tabular-nums">
                          {detailData.students.classesTotal || '-'}학급
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <div className="text-[11px] text-slate-500 font-medium mb-1">학급당 학생 수</div>
                        <div className="text-lg font-bold text-slate-900 tabular-nums">
                          {detailData.students.studentsPerClassCalc || '-'}명
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 text-right">
                      * 학급당 학생 수는 공시자료 기준 계산값
                    </div>

                    {/* Gender Breakdown */}
                    {(detailData.students.male !== undefined || detailData.students.female !== undefined) && (
                      <div className="p-4 border border-slate-200 rounded-lg bg-white">
                        <div className="font-semibold text-xs text-slate-800 mb-2.5 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>성별 학생 구성</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex justify-between py-1.5 px-3 bg-slate-50 rounded">
                            <span className="text-slate-600">남학생</span>
                            <span className="font-bold text-slate-900 tabular-nums">
                              {detailData.students.male?.toLocaleString()}명
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 px-3 bg-slate-50 rounded">
                            <span className="text-slate-600">여학생</span>
                            <span className="font-bold text-slate-900 tabular-nums">
                              {detailData.students.female?.toLocaleString()}명
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grade-by-Grade Breakdown */}
                    <div className="p-4 border border-slate-200 rounded-lg bg-white">
                      <div className="font-semibold text-xs text-slate-800 mb-2.5 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>학년별 학생 및 학급 현황</span>
                      </div>
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2 font-medium">학년</th>
                            <th className="py-2 font-medium text-right">학생 수</th>
                            <th className="py-2 font-medium text-right">학급 수</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="py-2 font-medium text-slate-700">1학년</td>
                            <td className="py-2 text-right tabular-nums font-semibold text-slate-900">
                              {detailData.students.grade1 ? `${detailData.students.grade1}명` : '-'}
                            </td>
                            <td className="py-2 text-right tabular-nums text-slate-700">
                              {detailData.students.classesGrade1 ? `${detailData.students.classesGrade1}개` : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-medium text-slate-700">2학년</td>
                            <td className="py-2 text-right tabular-nums font-semibold text-slate-900">
                              {detailData.students.grade2 ? `${detailData.students.grade2}명` : '-'}
                            </td>
                            <td className="py-2 text-right tabular-nums text-slate-700">
                              {detailData.students.classesGrade2 ? `${detailData.students.classesGrade2}개` : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-medium text-slate-700">3학년</td>
                            <td className="py-2 text-right tabular-nums font-semibold text-slate-900">
                              {detailData.students.grade3 ? `${detailData.students.grade3}명` : '-'}
                            </td>
                            <td className="py-2 text-right tabular-nums text-slate-700">
                              {detailData.students.classesGrade3 ? `${detailData.students.classesGrade3}개` : '-'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {detailData.students.teachersTotal && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                        <span className="text-slate-600">총 교원 수</span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {detailData.students.teachersTotal}명
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500">
                    공시된 학생 현황 정보가 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* Tab: Admissions */}
            {activeTab === 'admissions' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-semibold text-sm text-slate-900 mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>신입생 입학전형 안내</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {detailData?.admissions?.overview || `${school.schoolName} 입학전형 요강`}
                  </p>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg bg-white space-y-2">
                  <div className="font-semibold text-xs text-slate-800 mb-2">입학 관련 공시자료</div>
                  {detailData?.admissions?.documents?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate text-slate-700">{doc.title}</span>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 rounded text-[11px] font-semibold shrink-0"
                      >
                        자료 보기
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Curriculum */}
            {activeTab === 'curriculum' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-semibold text-sm text-slate-900 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>학교 교육과정 편성·운영</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {detailData?.curriculum?.description}
                  </p>
                </div>

                {detailData?.curriculum?.subjects && (
                  <div className="p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="font-semibold text-xs text-slate-800 mb-2">공통 및 필수 개설 교과</div>
                    <div className="flex flex-wrap gap-1.5">
                      {detailData.curriculum.subjects.map((sub, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {detailData?.curriculum?.electives && (
                  <div className="p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="font-semibold text-xs text-slate-800 mb-2">주요 선택 과목</div>
                    <div className="flex flex-wrap gap-1.5">
                      {detailData.curriculum.electives.map((ele, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200/60 rounded text-xs"
                        >
                          {ele}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Specialties */}
            {activeTab === 'specialties' && (
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 rounded-lg bg-white space-y-2">
                  <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>교육운영 특색사업</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                    {detailData?.specialties?.programs?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg bg-white space-y-2">
                  <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5 mb-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span>동아리 및 방과후 활동</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {detailData?.specialties?.clubs?.map((club, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                        {club}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg bg-white space-y-2">
                  <div className="font-semibold text-xs text-slate-800 mb-2">학생 지원 시설</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detailData?.specialties?.facilities?.map((facility, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/70 rounded text-xs"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Career & Graduation */}
            {activeTab === 'career' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm text-slate-900">졸업생 진로 현황</div>
                    <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {detailData?.graduation?.year || '2025학년도'} 기준
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    학교알리미 공시 기준 졸업생 진학 및 취업 분포입니다.
                  </p>
                </div>

                {detailData?.graduation && (
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <div className="text-[11px] text-blue-700 font-medium mb-1">대학 진학률</div>
                      <div className="text-lg font-bold text-blue-900 tabular-nums">
                        {detailData.graduation.higherEduRate || '-'}%
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {detailData.graduation.higherEducation}명 진학
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                      <div className="text-[11px] text-emerald-700 font-medium mb-1">취업률</div>
                      <div className="text-lg font-bold text-emerald-900 tabular-nums">
                        {detailData.graduation.employmentRate || '-'}%
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {detailData.graduation.employment}명 취업
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <div className="text-[11px] text-slate-600 font-medium mb-1">기타 (재수 등)</div>
                      <div className="text-lg font-bold text-slate-800 tabular-nums">
                        {detailData.graduation.other}명
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        진학/취업 외
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
