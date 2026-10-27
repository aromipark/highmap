export interface School {
  schoolCode: string;
  schoolName: string;
  district: string;
  districtCode: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  hasLocation: boolean;
  phone: string;
  homepage: string;
  genderType: '남학교' | '여학교' | '남녀공학' | '기타';
  foundationType: '공립' | '사립' | '국립' | '기타';
  schoolType: '일반고' | '자사고' | '특목고' | '영재고' | '특성화고' | '학력인정고' | '기타';
  studentCount?: number;
  classCount?: number;
  teacherCount?: number;
  studentsPerClass?: number;
  disclosureYear?: string;
  eduOffice?: string;
}

export interface SchoolDetailData {
  school: School;
  students?: {
    total: number;
    male?: number;
    female?: number;
    grade1?: number;
    grade2?: number;
    grade3?: number;
    classesTotal?: number;
    classesGrade1?: number;
    classesGrade2?: number;
    classesGrade3?: number;
    teachersTotal?: number;
    studentsPerClassCalc?: number;
  };
  admissions?: {
    overview?: string;
    documents?: { title: string; url: string; fileType: string }[];
  };
  curriculum?: {
    description?: string;
    subjects?: string[];
    electives?: string[];
    documents?: { title: string; url: string; fileType: string }[];
  };
  specialties?: {
    programs?: string[];
    clubs?: string[];
    afterSchool?: string[];
    facilities?: string[];
  };
  graduation?: {
    year?: string;
    higherEducation?: number;
    employment?: number;
    other?: number;
    higherEduRate?: number;
    employmentRate?: number;
  };
  documents?: { title: string; url: string; type: string }[];
  status: 'success' | 'no_disclosure' | 'fetch_error';
}

export interface FilterState {
  searchQuery: string;
  district: string; // '전체' or district name
  schoolType: string; // '전체' | '일반고' | '자사고' | '특목고' | '영재고' | '특성화고' | '학력인정고' | '기타'
  genderType: string; // '전체' | '남학교' | '여학교' | '남녀공학'
  foundationType: string; // '전체' | '공립' | '사립' | '국립' | '기타'
  onlyFavorites: boolean;
}
