import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import type { LostItem } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: LostItem | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  isBatchDelete?: boolean;
  batchCount?: number;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
  isDeleting,
  isBatchDelete = false,
  batchCount = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={isDeleting ? undefined : onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 z-10 text-center space-y-5">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900">
            {isBatchDelete
              ? `반환 완료된 분실물 ${batchCount}건 일괄 삭제`
              : '분실물 삭제 확인'}
          </h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {isBatchDelete ? (
              <>
                이미 주인을 찾아 반환이 완료된 분실물 <strong>{batchCount}건</strong>을
                영구 삭제합니다. 삭제된 데이터는 복구할 수 없습니다.
              </>
            ) : (
              <>
                <strong className="text-slate-800">"{item?.title}"</strong>
                {item?.status === '반환완료'
                  ? ' (반환 완료된 분실물)'
                  : ''}
                을(를) 시스템에서 영구히 삭제하시겠습니까?
              </>
            )}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>삭제 중...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>삭제하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
