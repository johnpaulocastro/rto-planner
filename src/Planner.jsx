import { useEffect, useRef, useState } from 'react';
import { statuses, weekdays, monthWeeks, exportText } from '../lib/calendar.js';
import { loadPlots, savePlots, validatePlots } from '../lib/storage.js';

export default function Planner() {
  const [month, setMonth] = useState(null);
  const [plots, setPlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const dialog = useRef(null);
  const fileInput = useRef(null);
  const textPreview = useRef(null);
  const [copyNotice, setCopyNotice] = useState('');
  const [ready, setReady] = useState(false);
  async function load() {
    setLoading(true); setError('');
    try { setPlots(await loadPlots(localStorage, () => fetch(`${import.meta.env.BASE_URL}data/schedule.json`, {cache: 'no-store'}))); setReady(true); }
    catch (e) { setError(e.message || 'Unable to load schedule.'); }
    finally { setLoading(false); }
  }
  function saveFile(content, type, filename) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importJson(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Choose a JSON file smaller than 1 MB.');
      const incoming = validatePlots(JSON.parse(await file.text()));
      const data = savePlots(localStorage, {...plots, ...incoming});
      setPlots(data); setReady(true); setError(''); setNotice('JSON imported and saved in this browser.');
    } catch(e) { setError(e.message || 'Could not import JSON.'); }
  }
  useEffect(() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); load(); }, []);
  function open(date) { setSelected(date); setError(''); dialog.current.showModal(); }
  async function assign(status) {
    setSaving(true); setError('');
    try {
      const data = {...plots};
      if (status === null) delete data[selected]; else data[selected] = status;
      savePlots(localStorage, data);
      setPlots(data); setNotice(`${selected}: ${status || 'plot cleared'}. Saved.`); dialog.current.close();
    } catch (e) { setError(e.message || 'Unable to save. Please retry.'); }
    finally { setSaving(false); }
  }
  function downloadText() {
    saveFile(scheduleText, 'text/plain;charset=utf-8', `work-schedule-${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}.txt`);
    setNotice('Text file downloaded. Open it in Notepad.');
  }
  async function copyText() {
    try {
      await navigator.clipboard.writeText(scheduleText);
      setCopyNotice('Copied. Paste it into your Teams message.');
    } catch {
      textPreview.current.focus();
      textPreview.current.select();
      setCopyNotice('Text selected. Press Ctrl+C (or Command+C) to copy, then paste into Teams.');
    }
  }
  const scheduleText = month && ready ? exportText(month.getFullYear(), month.getMonth(), plots) : '';
  useEffect(() => { setCopyNotice(''); }, [scheduleText]);
  const title = month?.toLocaleDateString('en-US', {month: 'long', year: 'numeric'});
  const weeks = month ? monthWeeks(month.getFullYear(), month.getMonth()) : [];
  const monthDates = weeks.flat().filter(Boolean);
  const count = status => monthDates.filter(date => plots[date] === status).length;
  const today = new Date().toLocaleDateString('en-CA');
  return <main>
    <header><a className="brand" href="./" aria-label="Workweek home"><span className="brand-icon">W</span>workweek<span className="brand-divider">/</span><span className="brand-sub">Schedule planner</span></a><span className="private-label">MY WORK SCHEDULE</span></header>
    <section className="intro"><div><p className="eyebrow">PLAN YOUR MONTH</p><h1>A place for every workday.</h1><p>Choose a date, plot your schedule, and you’re ready to submit.</p></div><button className="primary" onClick={downloadText} disabled={loading || !ready || !month}>Download Text (.txt)</button></section>
    <section className="summary" aria-label="Monthly totals">{statuses.map(status => <div key={status}><span className={'dot ' + status.toLowerCase()} /><span>{status}</span><strong>{count(status)}<small> days</small></strong></div>)}</section>
    <section className="calendar-panel" aria-label="Monthly calendar"><div className="toolbar"><div><h2>{title || 'Your calendar'}</h2><p>Click a day to set its schedule.</p></div><div className="navigation"><button aria-label="Previous month" disabled={!month} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button><button onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); }}>Today</button><button aria-label="Next month" disabled={!month} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></div></div>
      <div className="calendar">{weekdays.map(day => <div className="weekday" key={day}><span className="full-day">{day}</span><span className="short-day">{day.slice(0, 3)}</span></div>)}{weeks.flat().map((date, i) => date ? <button disabled={loading || !ready} className={'day ' + (plots[date]?.toLowerCase() || '') + (date === today ? ' today' : '')} key={date} aria-label={`${date}, ${plots[date] || 'no plot'}`} onClick={() => open(date)}><span className="day-number">{Number(date.slice(-2))}</span>{plots[date] ? <span className="badge">{plots[date]}</span> : <span className="add">+</span>}</button> : <div className="day empty" key={'empty-' + i} />)}</div>
      <div className="calendar-footer"><span>{loading ? 'Loading schedule…' : `${monthDates.filter(date => plots[date]).length} of ${monthDates.length} days plotted`}</span><span>Monday–Friday · Text export</span></div>
    </section>
    {error && !dialog.current?.open && <p role="alert" className="error">{error} <button onClick={load}>Retry</button></p>}
    <div className="bottom-note"><p>Text download uses comma-separated Monday–Friday columns and includes a legend. <code>UNP</code> means unplotted; <code>---</code> means not part of the month.</p><p role="status">{notice || 'Edits save in this browser only.'}</p></div>
    <section className="text-preview" aria-labelledby="preview-heading">
      <div className="preview-heading"><div><h2 id="preview-heading">Copy your schedule</h2><p id="preview-help">The same text as your download, ready to paste into Teams.</p></div><button className="primary" onClick={copyText} disabled={loading || !ready || !month}>Copy text</button></div>
      <label className="preview-label" htmlFor="schedule-text">{title || 'Monthly'} schedule</label>
      <textarea id="schedule-text" ref={textPreview} value={scheduleText} readOnly wrap="off" rows={16} spellCheck={false} aria-describedby="preview-help" />
      <p className="copy-notice" role="status">{copyNotice}</p>
    </section>
    <section className="backup"><div><strong>Keep a copy of your schedule</strong><p>Back up all months as JSON, or import a saved schedule. Imported dates replace matching dates; other entries stay unchanged.</p></div><div className="backup-actions"><button disabled={loading} onClick={() => fileInput.current.click()}>Import JSON</button><button disabled={loading || !ready} onClick={() => saveFile(JSON.stringify(plots, null, 2), 'application/json', 'schedule.json')}>Export JSON</button><input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={importJson} /></div></section>
    <dialog ref={dialog} onCancel={event => {if (saving) event.preventDefault();}} onClick={event => {if (event.target === dialog.current && !saving) dialog.current.close();}} aria-labelledby="dialog-title"><p className="eyebrow">PLOT YOUR DAY</p><h2 id="dialog-title">{selected && new Date(selected + 'T12:00:00').toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'})}</h2><p>Select a schedule. Your choice saves immediately.</p><div className="options">{statuses.map(status => <button disabled={saving} className={'option ' + status.toLowerCase()} key={status} onClick={() => assign(status)} aria-pressed={plots[selected] === status}><span className={'dot ' + status.toLowerCase()} />{status}{plots[selected] === status && <span className="selected">✓</span>}</button>)}</div>{error && <p role="alert" className="error">{error}</p>}<div className="dialog-footer"><button disabled={saving} onClick={() => assign(null)}>CLEAR</button><span role="status">{saving ? 'Saving…' : ''}</span><button disabled={saving} onClick={() => dialog.current.close()}>CANCEL</button></div></dialog>
  </main>;
}





