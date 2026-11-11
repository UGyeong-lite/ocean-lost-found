import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Building2, 
  MapPin, 
  Calendar, 
  User, 
  Loader2, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { CATEGORIES, DEFAULT_OFFICES, type LostItem } from '../types';
import { createItemWithCode } from '../lib/supabase';

interface TeacherUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newItem: LostItem) => void;
  teacherCode: string;
}

export const TeacherUploadModal: React.FC<TeacherUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teacherCode,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('전자기기');
  const [officeSelect, setOfficeSelect] = useState<string>('');
  const [foundLocation, setFoundLocation] = useState('');
  const [foundDate, setFoundDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [finderInfo, setFinderInfo] = useState('교사 등록');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (file: File | undefined) => {
    if (!file) return;
    if (!(file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)) || file.size > 10 * 1024 * 1024) {
      setErrorMsg('10MB 이하의 사진 파일을 선택해 주세요.');
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setErrorMsg(null);
  };

  const handleResetImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const effectiveOffice = officeSelect;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('물품명을 입력해 주세요.');
      return;
    }

    if (!effectiveOffice) {
      setErrorMsg('보관하고 있는 교무실을 선택해 주세요.');
      return;
    }

    if (!imageFile) {
      setErrorMsg('분실물 사진을 선택해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      const newItem = await createItemWithCode(teacherCode, {
        title: title.trim(),
        category,
        storage_office: effectiveOffice,
        found_location: foundLocation.trim(),
        found_date: foundDate,
        description: description.trim(),
        status: '보관중',
        finder_info: finderInfo.trim(),
      }, imageFile);

      onSuccess(newItem);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : '분실물 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={isSubmitting ? undefined : onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 z-10 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                선생님 분실물 사진 등록
              </h2>
              <p className="text-xs text-slate-500">
                사진을 찍어 올리고 보관 교무실을 지정하면 학생들에게 실시간 공개됩니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Photo Capture & Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              분실물 사진 찍기 / 업로드 <span className="text-rose-500">*</span>
            </label>

            {/* Hidden native inputs */}
            {/* Camera input with capture="environment" for phone rear camera */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              className="hidden"
              onChange={(e) => handleImageChange(e.target.files?.[0])}
            />
            {/* File gallery input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => handleImageChange(e.target.files?.[0])}
            />

            {imagePreview ? (
              <div className="relative aspect-16/9 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
                <img
                  src={imagePreview}
                  alt="업로드 미리보기"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-slate-100"
                  >
                    다시 촬영
                  </button>
                  <button
                    type="button"
                    onClick={handleResetImage}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700"
                  >
                    사진 삭제
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* Direct Camera Button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 text-sky-700 transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-md">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">카메라로 바로 촬영</span>
                  <span className="text-[10px] text-sky-500">스마트폰 카메라 구동</span>
                </button>

                {/* File Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">앨범/파일에서 선택</span>
                  <span className="text-[10px] text-slate-400">저장된 사진 불러오기</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Item Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              물품명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 흰색 에어팟 프로 2세대 (파란 케이스), 검정 롱패딩"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-slate-800 text-sm"
            />
          </div>

          {/* 3. Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              카테고리 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center border ${
                    category === cat.id
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. CRITICAL: Storage Office (보관하고 있는 교무실) */}
          <div className="rounded-2xl bg-sky-50/70 border border-sky-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <label className="text-xs font-extrabold text-sky-950">
                보관하고 있는 교무실 <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-sky-600 font-medium ml-auto">
                학생이 찾아올 장소입니다
              </span>
            </div>

            <fieldset className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <legend className="sr-only">보관 교무실 선택</legend>
              {DEFAULT_OFFICES.map((office) => (
                <label key={office} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold ${officeSelect === office ? 'border-sky-600 bg-sky-600 text-white' : 'border-sky-200 bg-white text-slate-700'}`}>
                  <input required type="radio" name="storage-office" value={office} checked={officeSelect === office} onChange={() => setOfficeSelect(office)} />
                  {office}
                </label>
              ))}
            </fieldset>
          </div>

          {/* 5. Found Location & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                습득 장소
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={foundLocation}
                  onChange={(e) => setFoundLocation(e.target.value)}
                  placeholder="예: 체육관 스탠드, 3층 복도"
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 outline-none text-slate-800 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                습득 날짜
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={foundDate}
                  onChange={(e) => setFoundDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 outline-none text-slate-800 text-sm"
                />
              </div>
            </div>
          </div>

          {/* 6. Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              상세 설명 및 특징
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="학생이 본인 물건인지 식별할 수 있는 특징(색상, 키링 유무, 브랜드, 스크래치 등)을 적어주세요."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 outline-none text-slate-800 text-sm resize-none"
            />
          </div>

          {/* 7. Finder / Teacher Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              등록 교사 / 담당자
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={finderInfo}
                onChange={(e) => setFinderInfo(e.target.value)}
                placeholder="예: 2학년 부장교사, 체육교사 등"
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 outline-none text-slate-800 text-sm"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-sky-600/30 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>사진 업로드 및 등록 중...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>분실물 등록 완료</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
