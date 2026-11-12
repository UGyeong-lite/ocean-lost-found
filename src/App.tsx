import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Camera, Compass, ImageOff, LockKeyhole, LogOut, MapPin, PackageSearch, RefreshCw, Search, X } from 'lucide-react';
import { getLostItems, verifyTeacherCode, deleteItemWithCode } from './lib/supabase';
import type { LostItem } from './types';
import { CATEGORIES } from './types';
import { TeacherUploadModal } from './components/TeacherUploadModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import mobileQr from './mobile-qr.png?inline';

export default function App() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [office, setOffice] = useState('all');
  const [teacherCode, setTeacherCode] = useState('');
  const teacher = !!teacherCode;
  const [loginOpen, setLoginOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<LostItem | null>(null);
  const [deleting, setDeleting] = useState<LostItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setItems(await getLostItems()); setError(''); }
    catch { setError('목록을 불러오지 못했습니다. 다시 시도해 주세요.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const visible = useMemo(() => items.filter(item => {
    const term = search.trim().toLocaleLowerCase();
    return item.status !== '반환완료' && (category === 'all' || item.category === category) && (office === 'all' || item.storage_office === office) && (!term || [item.title, item.description, item.storage_office, item.found_location].some(v => v?.toLocaleLowerCase().includes(term)));
  }), [items, search, category, office]);
  const offices = [...new Set(items.filter(i => i.status !== '반환완료').map(i => i.storage_office))].sort();
  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setLoginError('');
    try {
      await verifyTeacherCode(codeInput);
      setTeacherCode(codeInput); setCodeInput(''); setLoginOpen(false);
    } catch (e) { setLoginError(e instanceof Error ? e.message : '로그인하지 못했습니다.'); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    let message = '';
    try { await deleteItemWithCode(teacherCode, deleting.id); }
    catch (e) { message = e instanceof Error ? e.message : '삭제하지 못했습니다. 다시 시도해 주세요.'; }
    finally { setDeleting(null); setSelected(null); await refresh(); if (message) setError(message); setBusy(false); }
  }
  return <div className="min-h-screen bg-slate-50 text-slate-800">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <a href="#top" className="flex min-w-0 items-center gap-2 sm:gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-600 text-white sm:h-11 sm:w-11 sm:rounded-2xl"><Compass size={23}/></span><span className="min-w-0"><strong className="block text-sm font-black tracking-tight text-sky-950 sm:text-xl">오션 lost and found</strong><span className="hidden text-xs text-slate-500 sm:block">우리 학교 분실물 찾기</span></span></a>
      <div className="flex gap-2">{teacher ? <><button onClick={() => setUploadOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-sky-700"><Camera size={16}/> 분실물 등록</button><button aria-label="로그아웃" title="로그아웃" onClick={() => setTeacherCode('')} className="rounded-xl border border-slate-200 p-2.5 text-slate-600"><LogOut size={18}/></button></> : <button onClick={() => setLoginOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600"><LockKeyhole size={16}/> 교사 로그인</button>}</div>
    </div></header>
    <main id="top" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6"><section className="relative mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-950 via-blue-900 to-cyan-700 px-6 py-10 text-white sm:px-10 sm:py-14"><div className="absolute -right-10 -top-28 h-72 w-72 rounded-full border-[45px] border-white/5"/><div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"><div><p className="mb-3 text-xs font-bold tracking-[.2em] text-cyan-200">OCEAN LOST & FOUND</p><h1 className="text-3xl font-black leading-tight sm:text-4xl">잃어버린 물건,<br/>여기서 찾아보세요.</h1><p className="mt-4 max-w-xl text-sm leading-7 text-sky-100 sm:text-base">사진과 보관 교무실을 확인하고, 해당 교무실의 선생님께 문의해 주세요.</p><div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold"><PackageSearch size={17}/> 현재 보관 중 {items.filter(i => i.status !== '반환완료').length}건</div></div><aside aria-label="모바일 접속 QR코드" className="flex items-center gap-4 rounded-3xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm sm:gap-5 lg:shrink-0"><div className="shrink-0 rounded-2xl bg-white p-2"><img src={mobileQr} width="136" height="136" alt="휴대폰으로 오션 lost and found에 접속하는 QR코드" className="h-28 w-28 sm:h-32 sm:w-32"/></div><div><p className="text-xs font-bold tracking-wider text-cyan-200">모바일로 바로 접속</p><p className="mt-2 text-base font-extrabold leading-snug text-white">휴대폰 카메라로<br/>QR코드를 스캔하세요</p><a href={mobileQr} download="ocean-lost-and-found-qr.png" className="mt-3 inline-block text-xs font-semibold text-cyan-100 underline underline-offset-4 hover:text-white">QR코드 저장하기</a></div></aside></div></section>
      <section className="mt-10" aria-label="분실물 목록"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-bold tracking-widest text-sky-600">FIND YOUR THINGS</p><h2 className="text-2xl font-black text-slate-900">보관 중인 분실물</h2></div><button onClick={() => void refresh()} disabled={loading} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> 새로고침</button></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><span className="sr-only">분실물 검색</span><Search size={19} className="absolute left-4 top-3.5 text-slate-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="물건 이름, 특징, 장소 검색" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-sky-500"/></label><select aria-label="보관 교무실" value={office} onChange={e => setOffice(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"><option value="all">모든 보관 장소</option>{offices.map(o => <option key={o}>{o}</option>)}</select></div><div className="mt-4 flex gap-2 overflow-x-auto">{CATEGORIES.map(c => <button key={c.id} onClick={() => setCategory(c.id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${category === c.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{c.label}</button>)}</div></div>
        {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}<p className="mb-4 mt-6 text-sm text-slate-500">검색 결과 <strong className="text-sky-700">{visible.length}</strong>건</p>
        {loading ? <div className="py-20 text-center text-slate-400">목록을 불러오는 중입니다...</div> : visible.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center text-slate-500"><PackageSearch size={36} className="mx-auto mb-3 text-slate-300"/><p className="font-bold">해당하는 분실물이 없습니다</p><p className="mt-2 text-sm">다른 검색어를 입력하거나 나중에 다시 확인해 주세요.</p></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map(item => <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><button onClick={() => setSelected(item)} className="block w-full text-left"><div className="relative aspect-[4/3] bg-slate-100">{item.image_url ? <img src={item.image_url} alt={item.title} className="h-full w-full object-cover"/> : <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400"><ImageOff size={32}/><span className="text-xs">사진 없음</span></div>}<span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-sky-800">{item.category}</span></div><div className="p-5"><p className="text-xs font-semibold text-slate-400">{item.found_date || item.created_at.slice(0, 10)} 습득</p><h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900">{item.title}</h3><div className="mt-4 flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-sm text-sky-800"><MapPin size={17} className="mt-0.5 shrink-0"/><span><span className="block text-xs text-sky-600">보관 교무실</span><strong>{item.storage_office}</strong></span></div></div></button>{teacher && <div className="border-t border-slate-100 px-5 py-3"><button onClick={() => setDeleting(item)} className="text-sm font-bold text-rose-600">반환 후 삭제</button></div>}</article>)}</div>}
      </section><footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">오션 lost and found · 소중한 물건이 주인을 찾을 수 있도록</footer></main>
    {selected && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setSelected(null)}><div role="dialog" aria-modal="true" aria-label="분실물 상세" onClick={e => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-xl"><div className="flex items-center justify-between p-5"><span className="text-xs font-bold text-sky-600">물품번호 #{selected.id.slice(0, 8).toUpperCase()}</span><button aria-label="닫기" onClick={() => setSelected(null)}><X size={20}/></button></div>{selected.image_url && <img src={selected.image_url} alt={selected.title} className="max-h-80 w-full object-cover"/>}<div className="space-y-4 p-6"><div><span className="text-xs text-slate-400">{selected.category} · {selected.found_date || selected.created_at.slice(0, 10)}</span><h2 className="mt-1 text-2xl font-black">{selected.title}</h2></div><div className="rounded-2xl bg-sky-50 p-4 text-sky-900"><p className="text-xs font-bold text-sky-600">보관 교무실</p><p className="mt-1 text-lg font-bold">{selected.storage_office}</p><p className="mt-2 text-sm">이곳에 방문해 선생님께 본인 물건인지 확인받으세요.</p></div>{selected.found_location && <p className="text-sm text-slate-600">습득 장소: {selected.found_location}</p>}{selected.description && <p className="whitespace-pre-wrap text-sm text-slate-600">{selected.description}</p>}{teacher && <button onClick={() => setDeleting(selected)} className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700">반환 후 삭제</button>}</div></div></div>}
    {loginOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => { setLoginOpen(false); setCodeInput(''); setLoginError(''); }}><form onSubmit={login} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="교사 로그인" className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-xl font-black">교사 로그인</h2><button type="button" aria-label="닫기" onClick={() => { setLoginOpen(false); setCodeInput(''); setLoginError(''); }}><X size={20}/></button></div><p className="text-sm text-slate-500">학교에서 안내받은 교사 코드를 입력해 주세요.</p><label className="block text-sm font-bold">교사 코드<input required type="password" autoComplete="off" value={codeInput} onChange={e => setCodeInput(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal"/></label>{loginError && <p role="alert" className="text-sm text-rose-600">{loginError}</p>}<button disabled={busy} className="w-full rounded-xl bg-sky-600 py-3 font-bold text-white disabled:opacity-50">{busy ? '확인 중...' : '확인'}</button></form></div>}
    {uploadOpen && teacher && <TeacherUploadModal teacherCode={teacherCode} isOpen onClose={() => setUploadOpen(false)} onSuccess={() => { void refresh(); }}/>}<DeleteConfirmModal isOpen={!!deleting} item={deleting} onClose={() => setDeleting(null)} onConfirm={() => void remove()} isDeleting={busy}/>
  </div>;
}
