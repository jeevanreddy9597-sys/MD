/*!
 * Ownership Manager - Consolidation Ownership
 * Web component <nttdata-consolidation-ownership>, SAP Horizon Morning.
 *
 * @license Proprietary - All rights reserved
 * Copyright (c) 2026 NTT DATA Business Solutions AG
 *
 * This software is licensed, not sold. It is licensed for use solely
 * within SAP Analytics Cloud tenants operated by or on behalf of the
 * licensee named in the agreement under which it was supplied.
 *
 * No part of this file may be copied, reproduced, modified, reverse
 * engineered, redistributed, or deployed to any other tenant or
 * environment without prior written permission of the copyright holder.
 *
 * Contact: jorge.demiguelvijandi@bs.nttdata.com
 */
//************************************************************************
// nttdata-consolidation-ownership  -  the ownership maintenance surface
//------------------------------------------------------------------------
// Purpose       : Maintain consolidation method, consolidation % and
//                 ownership % per consolidation group and unit. All data
//                 crosses the story-script boundary as delimited text or
//                 indexed primitives; the story script does the writing.
// Created by    : Jorge de Miguel (NDBS)
// Created on    : August 2026
// Last modified : 2026-09-27
//************************************************************************
// CHANGE LOG - newest first. Record WHY as well as what; the diff already
// shows what. Add a new block at the top; never rewrite an existing one.
//------------------------------------------------------------------------
// 2026-09-27  Jorge de Miguel (NDBS)
//   - ENTER IN A CELL NO LONGER SCROLLS THE PAGE TO THE TOP (owner). It
//     takes the value and moves to the same column of the next entry;
//     Shift+Enter moves up. Keys typed in a field stop at the widget.
//     The reasons are with the key listeners and with _enter.
//     TWO CAUSES, both closed. Keys reaching SAC's page is taken from
//     what the owner saw; it could not be reproduced outside SAC. The
//     second WAS reproduced, in a real browser: moving the focus made
//     the browser scroll the PAGE as well as the table. Every focus
//     the widget sets is now set without scrolling (_focus), and the
//     table is moved by the widget itself (_reveal).
//   - THE CONTROLS ARE THE JOURNAL EXPLORER'S (owner: the buttons were
//     "not as round"). Buttons, the filter fields, the search boxes,
//     the table header and the row colours now carry the Explorer's
//     values; the reason is with the button rules. Cards, tokens,
//     chips, strips and dialogs were already common to both Journal
//     widgets. Editable cells keep the entry form's shape - the
//     Explorer has none to follow.
//   - A METHOD CAN EXPECT A PERCENTAGE, AND HOLDING AND FULL EXPECT A
//     CONSOLIDATION % OF 100 (owner). Another value is WARNED about -
//     the field is tinted, its tooltip says what is normal, a strip
//     counts the entries - and can be saved. Not a lock and not a
//     refusal: that is what the fixed fields and BR-8 are for.
//     Two more optional fields in the method list:
//     id~text~pgroup~fixed pcon~fixed pown~expected pcon~expected pown
//     so the default list is 101~Holding~1~~~100 and 100~Full~1~~~100.
//     Entries already in the model are warned about too: unlike a
//     refusal, a warning costs nothing to show.
//   - With the NCI or PGROUP column hidden, the row lines stopped short
//     of the right edge (seen in a screenshot; present since the first
//     version). The reason is with the <col> list in _render.
//   - THE TABLE KEEPS ITS SCROLL POSITION through a save and a refresh
//     (owner: "the table scrolls to the first row instead of staying
//     where it was"). Go still starts at the top: another scope is
//     another list. The reason is with _holdScroll.
//   - THE FILTER LISTS OPEN UNDER THEIR FIELD, as a dropdown does
//     (owner: "they appear in the middle of the screen and is odd").
//     They were dialogs centred on the widget with the page dimmed
//     behind them. Same list, same search, same buttons; only where it
//     appears changed, and the page is no longer dimmed. The list stays
//     inside the widget, because SAC clips what runs past it, and the
//     focus returns to the field when it closes.
//     The Add unit dialog stays a dialog: it belongs to a button, not
//     to a field, and it is a task rather than a choice.
//   - SEEN RENDERED FOR THE FIRST TIME (headless browser, sample data),
//     which found two things. "Select all (0)" in the unit list when
//     every branch was collapsed: only visible base units were counted,
//     so a collapsed node now stands for the units below it, in the
//     count and in what Select all selects. And the failed-save dialog
//     repeated its message as a bold line of its own; it says
//     "Not saved".
//   - THE DEFAULT METHOD LIST IS THE OWNER'S: 101 Holding, 100 Full,
//     30 Equity, 86 Disposed in current year, 900 Not consolidated.
//     The list it replaces was a placeholder, and it had 100 and 101
//     THE OTHER WAY ROUND (100 Holding, 101 Full). The default method
//     for a new unit therefore moves from 101 to 100, so that it
//     still MEANS full consolidation: left at 101, every unit added
//     would have been created as a holding.
//     The list fixes no percentages; none were given.
//   - An empty method list fell back to one method whose percentages
//     read as fixed, because the fallback lacked the two fields the
//     rule of the same day introduced.
//   - TWO BUSINESS RULES, confirmed by the owner. Until now only the
//     range 0-100 was checked.
//     OWNERSHIP % IS NOT ABOVE CONSOLIDATION %. A changed entry that
//     breaks it cannot be saved; one already in the model is counted
//     in an information strip and blocks nothing, because refusing
//     every save until somebody else's data is corrected would stop
//     the work. Not applied where the method fixes the consolidation %.
//     A METHOD CAN FIX ITS PERCENTAGES. The method list takes two
//     optional fields, id~text~pgroup~pcon~pown. A fixed field is
//     locked and takes the method's value. WHICH methods fix WHAT is
//     the owner's to enter in the panel: the default list fixes
//     nothing beyond "not consolidated", which was already 0 / 0.
//   - THE LOOK IS THE JOURNAL SOLUTION'S, because this widget is part of
//     the same solution and must not read as a different system. Grey
//     shell with white cards in place of the white full-bleed surface;
//     its tokens (--accent, --card, --muted, --bad, --warn, --good) in
//     place of this widget's own (--brand, --paper, --label, --neg,
//     --crit, --pos); its buttons (.25rem radius, normal weight when
//     emphasized), chips, table cells, strips and dialog. Table fields
//     look like text until hovered or focused.
//     The tokens are a COPY of shared/horizon.js (commit b56f0ca of
//     that repository), held in HORIZON_HOST; the test suite compares
//     the two and fails when they drift.
//   - Go is no longer emphasized when filters are pending: Save is the
//     one emphasized button of the surface. Go is tinted instead.
//   - Markup and ids are unchanged apart from the wrapping cards, so no
//     behaviour moved with the restyle.
//   - REVIEW FIXES. The widget is not in production, so these were made
//     together; each is a defect found by reading the code, and the
//     reason is what a later simplification must not undo.
//
//     STATE
//     - Revert after a save restored the values from BEFORE the save,
//       unmarked: markSaved never moved the baseline. It does now.
//     - Refresh replaced unsaved edits without asking, where Go refused.
//       Refresh now asks; and data the script sends while there are
//       unsaved changes, unasked, is refused and the changes kept - the
//       save handler used to reload after a FAILED save and so emptied
//       the table of the edits that had just been rejected.
//     - THE SCOPE OF A SAVE is what the rows were read for
//       (getLoadedVersion / getLoadedPeriod). The script took it from
//       the first result row into a global, so an EMPTY period kept the
//       previous period's scope and the first entries of a new period
//       were written to the old one.
//     - A load is refused when the table answered for another version
//       or period than was asked for (setDimensionFilter does not wait).
//     - Save opens its dialog and watchdog itself: it cannot fire twice
//       and a handler that never answers is reported. The change and
//       delete lists are frozen while a save runs.
//     - An entry removed and added again before saving is one change,
//       not a delete plus a create.
//     - A record without a method is shown without one. It used to be
//       drawn with the default method, which the model did not hold.
//     - Read-only and a running save now also stop removing and
//       selecting rows.
//     - The first load after a save is compared with what was saved
//       (setUserInput, submitData and publish only ever answer true or
//       false), and countConflicts() lets the script check before a
//       save that nobody else changed the same records.
//
//     NUMBERS
//     - Rounded at the boundary: 66.67 left as 0.6667000000000001 and
//       0.57 arrived as 56.99999999999999.
//     - Strict parsing: "50abc" was accepted as 50 and "1,234.5" read
//       as 1.234. A value that cannot be read stays in its field,
//       marked, instead of being replaced by the old one.
//     - The unit key template replaced the FIRST occurrence of the id,
//       so unit H1 produced [CL_V3_CONSUNIT].[{ID}].&[H1].
//
//     READS
//     - The token response is checked before its header is trusted.
//     - The flat read replaces the hierarchy read only on HTTP 400 (no
//       hierarchy). Any other failure is reported; it used to flatten
//       the tree silently.
//     - The parent column is found by its _PARENTID suffix when the
//       configured name is absent; synthetic #...# nodes are dropped;
//       a relative next link is resolved.
//
//     REPORTING
//     - Failures stay until dismissed, with or without the progress
//       dialog. With the dialog off they were shown nowhere.
//     - The progress bar used --sapBrandColor, --sapPositiveColor and
//       --sapNegativeColor, none of which this widget defines.
//     - Escape in a picker now cancels it, as Cancel does.
//     - A run log: one console line per step, no values. Record detail
//       only with Diagnostics on (off by default; never in production).
//
//     SPEED
//     - An edit patches its row instead of rebuilding the table, which
//       also keeps the keyboard focus when tabbing between cells.
//     - Children and leaves are indexed once per master data load; the
//       tree used to filter every unit for every node on every
//       keystroke.
//
//     MANIFEST
//     - apiModelId no longer defaults to a literal model id; the script
//       passes it with setModelId(). New: setModelId,
//       applyFilterSelection, getLoadedVersion, getLoadedPeriod,
//       countConflicts, getConflictText; properties checkLoadedScope
//       and diagnostics. setFactCells takes the version and period of
//       the rows as a second and third argument - EVERY call must pass
//       all three.
//   - Brought under the project standard: licence notice and this header
//     added; file renamed from main.js. No behaviour changed.
//   - RENAMED FOR SAC, while it is free to do so: tag
//     com-consolidation-ownership -> nttdata-consolidation-ownership and
//     manifest id com.consolidation.ownership ->
//     com.nttdata.consolidationownership, with vendor NTT DATA, license
//     and eula filled in. SAC treats a changed id or tag as a DIFFERENT
//     widget, so after go-live this would be a migration with a story
//     edit; the widget is not in production yet, and it belongs to the
//     same solution as the Journal Solution's nttdata-* widgets.
//
// August 2026  Jorge de Miguel (NDBS)
//   - Initial version (banner "v1.1"; version folders Claude 1.0.0,
//     Claude 1.0.1 and Latest).
//************************************************************************
(function () {
  "use strict";

  /* THE TOKENS ARE THE JOURNAL SOLUTION'S. This widget is part of the
     same solution, so it takes the same palette and the same host rule.

     A COPY, byte for byte, of JournalHorizon.HOST in
       ../Journal Solution v2/shared/horizon.js
     as of that repository's commit b56f0ca (2026-09-25). A copy can
     drift: testing/core.test.cjs compares this string with that file
     whenever the Journal Solution is present beside this project, and
     fails when they differ. Change it THERE first, then here. */
  var HORIZON_HOST =
    ':host{display:block;font-family:"72","72full","72-web",Arial,Helvetica,sans-serif;' +
      'font-size:.875rem;line-height:1.375rem;color:#1d2d3e;' +
      '-webkit-user-select:text;user-select:text;' +
      '--bg:#f5f6f7;--card:#fff;--line:#d9d9d9;--muted:#556b82;--accent:#0070f2;' +
      '--accent-hover:#0064d9;--good:#256f3a;--good-bg:#f5fae5;--bad:#aa0808;' +
      '--bad-bg:#ffebeb;--warn:#e76500;--warn-bg:#fff8d6;--info-bg:#eaf6ff}' +
    '*{box-sizing:border-box}';

  /* Everything below uses those tokens, and the Journal Solution's
     measures: the grey shell with white cards, its buttons, chips,
     table, strips and dialog. Where that solution has no equivalent -
     the tree, the toast - the same tokens are used and nothing new is
     invented. */
  var CSS = `
  :host{width:100%;height:100%}
  [hidden]{display:none !important}
  :focus-visible{outline:2px solid var(--accent);outline-offset:1px}

  /* ---------- shell and cards ---------- */
  .shell{background:var(--bg);padding:.75rem;display:flex;flex-direction:column;gap:.5rem;
         height:100%;min-height:0;overflow:hidden;position:relative}
  .card{background:var(--card);border:1px solid var(--line);border-radius:.5rem}
  .head{flex:none}
  .top{display:flex;align-items:center;justify-content:space-between;gap:.75rem;
       padding:.625rem .75rem;flex-wrap:wrap}
  .top>div:first-child{flex:1;min-width:0}
  .title{margin:0;font-size:.875rem;font-weight:600;line-height:1.375rem}
  .sub{margin:.125rem 0 0;color:var(--muted)}
  .sub:empty{display:none}
  .acts{display:flex;gap:.375rem;align-items:center;flex-wrap:wrap}
  .acts .sep{width:1px;height:1.25rem;background:var(--line);margin:0 .25rem}

  /* ---------- busy line ---------- */
  .busy{position:absolute;left:0;right:0;top:0;height:.125rem;z-index:5;
        background:linear-gradient(90deg,transparent,var(--accent),transparent);
        background-size:40% 100%;background-repeat:no-repeat;animation:sl 1.1s infinite linear}
  @keyframes sl{from{background-position:-40% 0}to{background-position:140% 0}}

  /* ---------- buttons - one emphasized per surface ----------
     THE JOURNAL EXPLORER'S BUTTON, value for value (owner, 2026-09-27:
     "slightly different to the ones in the journal manager ... not as
     round"). The first restyle took the ENTRY FORM's button - .25rem
     corners, blue outline, blue text - because that was the file the
     brief pointed at. The Explorer, the screen this one sits beside,
     has .5rem corners, a grey outline, dark text on white, and turns
     blue-edged only under the cursor. The two Journal widgets differ
     from each other here; this one follows the Explorer. */
  button{font:inherit;color:inherit}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:.375rem;flex:none;
       border-radius:.5rem;padding:.3125rem .75rem;cursor:pointer;white-space:nowrap;
       border:1px solid var(--line);background:var(--card);color:#1d2d3e}
  .btn:hover{background:#f0f5ff;border-color:var(--accent)}
  .btn.emph{background:var(--accent);border-color:var(--accent);color:#fff}
  .btn.emph:hover{background:var(--accent-hover)}
  .btn.ic{padding:.3125rem .4375rem;border-color:transparent;background:none}
  .btn.pend{border-color:var(--accent);color:var(--accent)}
  .btn:disabled,.btn:disabled:hover{opacity:.45;cursor:not-allowed;
       background:var(--card);border-color:var(--line);color:#1d2d3e}
  .btn.emph:disabled,.btn.emph:disabled:hover{background:var(--accent);border-color:var(--accent);color:#fff}
  .btn.ic:disabled,.btn.ic:disabled:hover{background:none;border-color:transparent}
  .btn svg{width:1rem;height:1rem;flex:none}
  .bdg{min-width:1.25rem;height:1.25rem;padding:0 .375rem;border-radius:.625rem;
       background:#fff;color:var(--accent);font-size:.6875rem;font-weight:600;
       display:inline-flex;align-items:center;justify-content:center;margin-left:.125rem}

  /* ---------- scope: the filter bar ---------- */
  .scope{display:flex;flex-wrap:wrap;align-items:flex-end;gap:.5rem .875rem;
         padding:.625rem .875rem;border-top:1px solid var(--line)}
  .f{display:flex;flex-direction:column;flex:1 1 11rem;min-width:9.5rem;max-width:20rem}
  .f .l{color:var(--muted);font-size:.75rem}
  .fsel{position:relative;display:block;width:100%;text-align:left;cursor:pointer;
        border:1px solid var(--line);border-radius:.5rem;
        padding:.3125rem 1.5rem .3125rem .625rem;background:var(--card);color:inherit}
  .fsel:hover{border-color:var(--accent)}
  .fsel > span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .fsel > svg{display:none}
  .fsel::after{content:"";position:absolute;right:.5rem;top:50%;width:.4rem;height:.4rem;
        border-right:1.5px solid var(--muted);border-bottom:1.5px solid var(--muted);
        transform:translateY(-70%) rotate(45deg);pointer-events:none}
  .scope .btn{margin-left:auto}

  /* ---------- status strips ---------- */
  #strips{flex:none;display:flex;flex-direction:column;gap:.5rem}
  #strips:empty{display:none}
  .strip{display:flex;gap:.625rem;align-items:flex-start;padding:.5rem .875rem;
         border-radius:.5rem;border:1px solid var(--line);background:var(--card)}
  .strip svg{width:1rem;height:1rem;flex:none;margin-top:.1875rem}
  .strip.info{background:var(--info-bg);border-color:#b8dcff}
  .strip.info svg{color:var(--accent-hover)}
  .strip.warn{background:var(--warn-bg);border-color:#f5d27a;color:#6d4400}
  .strip.err{background:var(--bad-bg);border-color:#ffb4b4;color:var(--bad)}
  .strip .msg{flex:1;min-width:0}
  .strip .sx{flex:none;border:0;background:transparent;color:var(--accent);cursor:pointer;
             padding:0 .25rem;border-radius:.25rem}
  .strip .sx:hover{text-decoration:underline}

  /* ---------- fields ---------- */
  .fld{font:inherit;border:1px solid #89919a;border-bottom-color:#556b82;border-radius:.25rem;
       padding:.25rem .5rem;color:inherit;background:#fff}
  .fld:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
  .fld:disabled{background:var(--bg);color:var(--muted);cursor:default}
  .fld.bad{border-color:var(--bad);background-color:var(--bad-bg)}
  select.fld{appearance:none;-webkit-appearance:none;padding-right:1.5rem;cursor:pointer;
    background-repeat:no-repeat;background-position:right .375rem center;background-size:1rem;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23556b82' stroke-width='1.5'><path d='M4 6.5l4 4 4-4'/></svg>")}
  .search{position:relative;display:inline-flex;align-items:center;width:100%}
  .search input{width:100%;padding:.3125rem 2rem .3125rem .625rem;border-radius:.5rem;border-color:var(--line)}
  .search input:focus{outline:2px solid var(--accent);outline-offset:-1px;box-shadow:none;border-color:var(--line)}
  .search svg{position:absolute;right:.625rem;width:1rem;height:1rem;color:var(--muted);pointer-events:none}
  input[type=checkbox]{accent-color:var(--accent);width:1rem;height:1rem;margin:0;cursor:pointer;vertical-align:middle}
  input[type=checkbox]:disabled{cursor:default}

  /* ---------- lines: the table ---------- */
  .lines{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;overflow:hidden}
  .lhead{flex:none;display:flex;align-items:center;gap:.5rem;padding:.5rem .875rem;
         border-bottom:1px solid var(--line)}
  .lhead .title{font-size:.875rem}
  .lscroll{flex:1 1 auto;min-height:5rem;overflow:auto}
  table{border-collapse:collapse;width:100%;min-width:44rem}
  th,td{text-align:left;padding:.375rem .75rem;border-bottom:1px solid var(--line);white-space:nowrap}
  th{position:sticky;top:0;background:var(--bg);color:var(--muted);font-weight:600;
     padding:.4375rem .75rem;z-index:1}
  th.r,td.r{text-align:right;font-variant-numeric:tabular-nums}
  td.fill,th.fill{padding:0}
  tbody tr:hover{background:#f0f5ff}
  tbody tr.sel{background:#e3effd}
  tbody tr.grp,tbody tr.grp:hover{background:#fafafa}
  tbody tr.grp td{border-bottom:1px solid var(--line)}
  tbody tr.dirty td:first-child{box-shadow:inset .1875rem 0 0 0 var(--accent)}
  td.unit{padding-left:2.25rem}
  thead th:nth-child(2),tbody tr[data-key] td:nth-child(2){min-width:20rem}
  .uid{font-weight:600}
  .udesc{color:var(--muted);margin-left:.5rem}
  /* a cell looks like text until it is hovered or focused, so a long
     table does not read as a wall of boxes */
  td .fld{border-color:transparent;background-color:transparent;padding:.25rem .375rem}
  td select.fld{padding-right:1.5rem;min-width:9rem;max-width:16rem}
  td .fld:hover:not(:disabled){border-color:#c2c8d0}
  td .fld:focus{border-color:var(--accent);background-color:#fff}
  td .fld:disabled{background-color:transparent;color:var(--muted)}
  td .fld.bad{border-color:var(--bad);background-color:var(--bad-bg)}
  td .fld.warn{border-color:var(--warn);background-color:var(--warn-bg)}
  td .btn.ic{border:none;color:var(--muted);padding:.125rem .375rem}
  td .btn.ic:hover:not(:disabled){color:var(--bad);background:var(--bad-bg)}
  .num{text-align:right;font-variant-numeric:tabular-nums;width:5.75rem}
  .nci,.pg{font-variant-numeric:tabular-nums}
  .pg{color:var(--muted)}
  .nci.neg,.pg.off{color:var(--bad);font-weight:600}
  .gt{display:inline-flex;align-items:center;gap:.5rem;border:0;background:transparent;padding:0;
      cursor:pointer;font-weight:600}
  .gt svg{width:1rem;height:1rem;transition:transform .15s;color:var(--muted)}
  .gt[aria-expanded="false"] svg{transform:rotate(-90deg)}
  .hint{color:var(--muted);font-size:.75rem;margin-left:.625rem}
  .empty{padding:2.5rem .875rem;text-align:center;color:var(--muted);white-space:normal}
  .empty strong{display:block;color:#1d2d3e;margin-bottom:.125rem}
  .foot{flex:none;display:flex;gap:1.25rem;align-items:center;justify-content:flex-end;
        padding:.5rem .875rem;border-top:1px solid var(--line);background:#fafafa;
        border-radius:0 0 .5rem .5rem;color:var(--muted);font-size:.75rem;min-height:2.25rem}

  /* ---------- chips ---------- */
  .chip{display:inline-block;border-radius:.75rem;padding:.0625rem .5rem;font-size:.75rem;font-weight:600;
        line-height:1.125rem;border:1px solid transparent;white-space:nowrap;margin-left:.5rem;
        vertical-align:middle;background:#eaecee;color:#1d2d3e}
  .chip.node{background:var(--info-bg);color:var(--accent-hover);border-color:#b8dcff}
  .chip.new{background:var(--good-bg);color:var(--good);border-color:#c1e0a6}

  /* ---------- dialogs ---------- */
  .ovl{position:absolute;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;
       padding:1rem;background:rgba(29,45,62,.35);border-radius:.5rem}
  .dlg{display:flex;flex-direction:column;overflow:hidden;width:min(38rem,100%);max-height:100%;
       background:var(--card);border-radius:.5rem;box-shadow:0 .5rem 2rem rgba(29,45,62,.3)}
  .sdlg{width:min(32rem,100%)}
  .dlg-h{flex:none;display:flex;align-items:flex-start;gap:.5rem;
         margin:1.25rem 1.5rem 0;padding-bottom:.625rem;border-bottom:1px solid var(--line)}
  .dlg-h h2{margin:0;font-size:1rem;font-weight:700;line-height:1.375rem}
  .dlg-h p{margin:.25rem 0 0;color:var(--muted);line-height:1.4}
  .dlg-h p:empty{display:none}
  .dlg-h .btn.ic{margin:-.25rem -.4375rem 0 0;color:var(--muted)}
  .dlg-s{flex:none;display:flex;flex-wrap:wrap;gap:.75rem;align-items:flex-end;padding:1rem 1.5rem .75rem}
  .dlg-b{flex:none;padding:1.25rem 1.5rem}
  .dlg-b + .dlg-f{margin-top:0}
  .dlg-f{flex:none;display:flex;align-items:center;gap:.5rem;
         margin:1.25rem 1.5rem 1.125rem;padding-top:.875rem;border-top:1px solid var(--line)}
  .dlg-f .btn{padding:.4375rem 1rem}
  .alert .dlg-h{border-bottom:0;padding-bottom:0}
  .alert .dlg-h p{font-size:.9375rem;line-height:1.55;color:inherit;margin-top:1.25rem}
  .sp{flex:1 1 auto}
  .selinfo{flex:1 1 auto;min-width:0;font-size:.75rem;color:var(--muted);
           overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .frm{display:flex;flex-direction:column;flex:1 1 12rem}
  .frm label{font-size:.75rem;color:var(--muted)}
  .frm .fld{width:100%}

  /* ---------- the filter lists open under their field ---------- */
  .ovl.pop{display:block;padding:0;background:transparent;border-radius:0}
  .ovl.pop .dlg{position:absolute;border:1px solid var(--line);border-radius:.5rem;
                box-shadow:0 .5rem 1.5rem rgba(29,45,62,.25)}
  .ovl.pop .dlg-h{margin:.5rem .625rem 0;padding-bottom:.375rem;align-items:center}
  .ovl.pop .dlg-h h2{font-size:.875rem}
  .ovl.pop .dlg-h p{margin:0;font-size:.75rem}
  .ovl.pop .dlg-h .btn.ic{margin:0 -.25rem 0 0}
  .ovl.pop .psearch{padding:.5rem .625rem .375rem}
  .ovl.pop .pbar{padding:0 .625rem .375rem}
  .ovl.pop .plist{margin:0;border-width:1px 0 0;border-radius:0;min-height:4rem}
  .ovl.pop .dlg-f{margin:0;padding:.5rem .625rem;border-top:1px solid var(--line)}
  .ovl.pop .dlg-f .btn{padding:.3125rem .75rem}
  .ovl.pop .empty{padding:1rem .625rem}
  /* ---------- lists inside dialogs ---------- */
  .tree,.plist{flex:1 1 auto;overflow:auto;min-height:8rem;margin:0 1.5rem;
               border:1px solid var(--line);border-radius:.25rem}
  .psearch{flex:none;padding:1rem 1.5rem .75rem}
  .pbar{flex:none;padding:0 1.5rem .5rem;font-size:.75rem}
  .pallw{display:inline-flex;align-items:center;gap:.5rem;cursor:pointer;color:var(--muted)}
  .ti,.pitem{display:flex;align-items:center;gap:.625rem;width:100%;border:0;background:transparent;
             cursor:pointer;text-align:left;padding:.25rem .625rem;white-space:nowrap;
             -webkit-user-select:none;user-select:none}
  .ti:hover,.pitem:hover{background:#f0f5ff}
  .ti[aria-selected="true"],.pitem[aria-selected="true"]{background:#e3effd}
  .tcb{flex:none;pointer-events:none}
  .tw{width:1rem;height:1rem;flex:none;color:var(--muted);transition:transform .15s}
  .ti[data-exp="false"] .tw,.pitem[data-exp="false"] .tw{transform:rotate(-90deg)}
  .lf{width:1rem;flex:none}
  .tl{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}
  .tl b,.pid{font-weight:600}
  .tl span,.pdesc{color:var(--muted);margin-left:.125rem}
  .pdesc{overflow:hidden;text-overflow:ellipsis}

  /* ---------- progress ---------- */
  .sphase{font-weight:600;font-size:.9375rem;line-height:1.4}
  .sphase:empty{display:none}
  .sbar{height:.5rem;border-radius:.25rem;background:#eaecee;overflow:hidden;margin:1rem 0 .625rem}
  .sbar i{display:block;height:100%;width:0;border-radius:.1875rem;background:var(--accent);transition:width .4s ease}
  .sbar.good i{background:var(--good)}
  .sbar.bad i{background:var(--bad)}
  .sbar.indet i{width:35%;animation:ind 1.1s infinite ease-in-out}
  @keyframes ind{0%{margin-left:-35%}100%{margin-left:100%}}
  .ssum{color:var(--muted);font-size:.8125rem}
  .sdisc{display:inline-flex;align-items:center;gap:.375rem;margin-top:.5rem;padding:.25rem 0;
         border:0;background:transparent;cursor:pointer;font-size:.8125rem;color:var(--accent)}
  .sdisc svg{width:.75rem;height:.75rem;transition:transform .15s}
  .sdisc[aria-expanded="false"] svg{transform:rotate(-90deg)}
  .slog{margin:.625rem 0 0;padding:.375rem .5rem;list-style:none;max-height:11rem;overflow:auto;
        border:1px solid var(--line);border-radius:.25rem;
        font-family:Consolas,"SFMono-Regular",monospace;font-size:.6875rem;color:var(--muted);line-height:1.6}
  .slog li{display:flex;gap:.5rem}
  .slog li.step{color:#1d2d3e;font-weight:600}
  .slog .ok{color:var(--good);flex:none;font-weight:700;min-width:1.25rem}
  .slog .no{color:var(--bad);flex:none;font-weight:700;min-width:1.25rem}
  .slog .tx{min-width:0;word-break:break-all}

  /* ---------- toast: for what needs no answer ---------- */
  .toast{position:absolute;left:50%;bottom:1.75rem;transform:translateX(-50%);z-index:60;
         max-width:80%;padding:.5rem .875rem;border-radius:.25rem;
         background:rgba(29,45,62,.92);color:#fff;font-size:.8125rem;text-align:center;
         opacity:0;transition:opacity .2s;pointer-events:none}
  .toast.show{opacity:1}
  .toast.good{background:var(--good)}

  @media (prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important}}
`;

  var ICON_X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
  var ICON_FIND = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/></svg>';

  var HTML = `
<div class="shell">
  <div class="busy" id="busy" hidden></div>

  <div class="card head">
    <div class="top">
      <div>
        <h1 class="title" id="title">Consolidation Ownership</h1>
        <p class="sub" id="scope"></p>
      </div>
      <div class="acts">
        <button class="btn" id="add">Add unit</button>
        <button class="btn" id="del" disabled>Remove</button>
        <span class="sep"></span>
        <button class="btn tr" id="refresh" title="Read the table again from the model">Refresh</button>
        <button class="btn tr" id="revert" disabled title="Discard all unsaved changes">Revert</button>
        <button class="btn emph" id="save">Save<span class="bdg" id="badge" hidden>0</span></button>
      </div>
    </div>

    <section class="scope" id="fbar" aria-label="Filters">
      <div class="f"><span class="l" id="lver">Version</span>
        <button class="fsel" id="fver" aria-labelledby="lver"><span>-</span></button></div>
      <div class="f"><span class="l" id="lper">Period</span>
        <button class="fsel" id="fper" aria-labelledby="lper"><span>-</span></button></div>
      <div class="f"><span class="l" id="lgrp">Consolidation group</span>
        <button class="fsel" id="fgrp" aria-labelledby="lgrp"><span>-</span></button></div>
      <div class="f"><span class="l" id="lunt">Consolidation unit</span>
        <button class="fsel" id="funt" aria-labelledby="lunt"><span>-</span></button></div>
      <button class="btn" id="fapply">Go</button>
    </section>
  </div>

  <div id="strips"></div>

  <div class="card lines">
    <div class="lhead"><h2 class="title" id="cnt">Ownership</h2></div>
    <div class="lscroll">
      <table>
        <colgroup id="cols"></colgroup>
        <thead><tr>
          <th><input type="checkbox" id="selall" aria-label="Select all"></th>
          <th>Consolidation group / unit</th>
          <th>Consolidation method</th>
          <th class="r">Consolidation %</th>
          <th class="r">Ownership %</th>
          <th class="r" id="thnci" title="Non-controlling interest = Consolidation % - Ownership %. Calculated in the widget, not stored in the model.">NCI %</th>
          <th class="r" id="thpg" title="Part of group. Derived from the consolidation method.">PGROUP</th>
          <th></th>
          <th class="fill"></th>
        </tr></thead>
        <tbody id="tbody"></tbody>
      </table>
      <div id="empty"></div>
    </div>
    <div class="foot"><span id="saved"></span></div>
  </div>

  <!-- value help: add consolidation units -->
  <div class="ovl" id="ovl" hidden>
    <div class="dlg" role="dialog" aria-modal="true" aria-label="Add consolidation units">
      <div class="dlg-h">
        <div style="flex:1 1 auto"><h2>Add consolidation units</h2>
          <p>Select one or more units. Selecting a node adds every unit below it.</p></div>
        <button class="btn tr ic" id="dclose" aria-label="Close">${ICON_X}</button>
      </div>
      <div class="dlg-s">
        <div class="frm"><label for="dgrp">Consolidation group</label><select class="fld" id="dgrp"></select></div>
        <div class="frm"><label for="dq">Search</label>
          <span class="search"><input class="fld" id="dq" type="search" placeholder="Unit id or name">${ICON_FIND}</span></div>
      </div>
      <div class="pbar">
        <label class="pallw"><input type="checkbox" id="dall"><span>Select all shown</span></label>
      </div>
      <div class="tree" id="tree" role="tree"></div>
      <div class="dlg-f">
        <button class="btn tr" id="dnone">Clear</button>
        <span class="selinfo" id="dsel">No selection</span>
        <button class="btn tr" id="dcancel">Cancel</button>
        <button class="btn emph" id="dadd" disabled>Add</button>
      </div>
    </div>
  </div>

  <!-- value help: filter pickers -->
  <div class="ovl pop" id="povl" hidden>
    <div class="dlg sdlg" role="dialog" aria-modal="true" aria-labelledby="ptitle">
      <div class="dlg-h">
        <div style="flex:1 1 auto"><h2 id="ptitle">Select</h2><p id="psub"></p></div>
        <button class="btn tr ic" id="pclose" aria-label="Close">${ICON_X}</button>
      </div>
      <div class="psearch">
        <span class="search"><input class="fld" id="pq" type="search" placeholder="Search">${ICON_FIND}</span>
      </div>
      <div class="pbar" id="pbar" hidden>
        <label class="pallw"><input type="checkbox" id="pallcb"><span id="palltx">Select all</span></label>
      </div>
      <div class="plist" id="plist"></div>
      <div class="dlg-f">
        <button class="btn tr" id="pnone" hidden>Clear</button>
        <span class="sp"></span>
        <button class="btn tr" id="pcancel">Cancel</button>
        <button class="btn emph" id="pok" hidden>OK</button>
      </div>
    </div>
  </div>

  <!-- a question before something is discarded -->
  <div class="ovl" id="covl" hidden>
    <div class="dlg sdlg alert" role="alertdialog" aria-modal="true" aria-labelledby="ctitle" aria-describedby="ctext">
      <div class="dlg-h"><div style="flex:1 1 auto">
        <h2 id="ctitle">Revert changes</h2>
        <p id="ctext">All unsaved changes will be discarded.</p>
      </div></div>
      <div class="dlg-f">
        <span class="sp"></span>
        <button class="btn tr" id="ccancel">Cancel</button>
        <button class="btn emph" id="cok">Revert</button>
      </div>
    </div>
  </div>

  <!-- progress -->
  <div class="ovl" id="sovl" hidden>
    <div class="dlg sdlg" role="dialog" aria-modal="true" aria-labelledby="stitle">
      <div class="dlg-h"><div style="flex:1 1 auto">
        <h2 id="stitle">Working</h2><p id="ssub"></p>
      </div></div>
      <div class="dlg-b">
        <div class="sphase" id="sphase"></div>
        <div class="sbar indet" id="sbar"><i></i></div>
        <div class="ssum" id="ssum"></div>
        <button class="sdisc" id="sdisc" aria-expanded="false" hidden>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>
          <span id="sdisctx">Show details</span>
        </button>
        <ul class="slog" id="slog" hidden></ul>
      </div>
      <div class="dlg-f" id="sfoot" hidden>
        <span class="sp"></span>
        <button class="btn emph" id="sclose">Close</button>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>
</div>`;

  var TPL = document.createElement("template");
  TPL.innerHTML = "<style>" + HORIZON_HOST + CSS + "</style>" + HTML;

  var TAG = "nttdata-consolidation-ownership";

  /* id ~ text ~ pgroup   (pgroup 1 = part of group, 0 = not consolidated) */
  /* id~text~pgroup~fixed pcon~fixed pown~expected pcon~expected pown.
     Holding and Full EXPECT a consolidation % of 100 (owner,
     2026-09-27): another value is warned about, not refused. */
  var DEFAULT_METHODS = "101~Holding~1~~~100;;100~Full~1~~~100;;30~Equity~1;;86~Disposed in current year~1;;" +
    "900~Not consolidated~0";
  /* Full consolidation - what a newly added unit starts with */
  var DEFAULT_METHOD = "100";

  /* =====================================================================
     THE RULES, as functions of their arguments alone - no DOM, no state.
     Exported as OwnershipCore so testing/core.test.cjs can run them, and
     run them again against the protected build.
     ===================================================================== */

  /* EVERY string from the model or the panel goes through this before it
     reaches the DOM. */
  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  /* '[CL_V3_CONSUNIT].[H1].&[310000]'  ->  '310000'   (plain ids pass through) */
  function plainId(v) {
    var s = String(v === null || v === undefined ? "" : v);
    var m = s.match(/&\[([^\]]*)\]\s*$/);
    return m ? m[1] : s;
  }
  /* What a scope id NAMES, whatever form it arrives in: the filter bar
     holds the id getMembers() gave, the result set holds its own, and the
     two need not be spelled alike. Used only to COMPARE two ids. */
  function scopeName(v) {
    var s = plainId(v).trim();
    var m = s.match(/\[([^\[\]]*)\]\s*$/);
    if (m) { s = m[1]; }
    if (s.indexOf("public.") === 0) { s = s.substring(7); }
    return s.toUpperCase();
  }
  /* The hierarchy read returns synthetic nodes such as #NotInHierarchies#
     as rows (Journal Solution v2, probed 2026-09-23). */
  function isSynthetic(id) { return /^#.+#$/.test(String(id)); }
  /* "#, SNONE, TMP*"  ->  matcher. Trailing * is a prefix wildcard. */
  function makeExcluder(spec) {
    var exact = {}, prefixes = [];
    String(spec === null || spec === undefined ? "" : spec).split(",").forEach(function (raw) {
      var t = raw.trim();
      if (!t) { return; }
      if (t.charAt(t.length - 1) === "*") { prefixes.push(t.substring(0, t.length - 1).toUpperCase()); }
      else { exact[t.toUpperCase()] = true; }
    });
    return function (id) {
      var k = String(id === null || id === undefined ? "" : id).toUpperCase();
      if (exact[k]) { return true; }
      for (var i = 0; i < prefixes.length; i++) {
        if (prefixes[i] && k.indexOf(prefixes[i]) === 0) { return true; }
      }
      return false;
    };
  }
  function roundTo(v, decimals) {
    var n = Number(v);
    if (!isFinite(n)) { return 0; }
    return Number(n.toFixed(decimals));
  }
  /* A value FROM THE MODEL. null when the cell holds nothing - which is
     not the same as 0, and the difference decides whether a record
     exists. Strict: parseFloat read "1,234.5" as 1.234. */
  function modelNumber(v) {
    var s = String(v === null || v === undefined ? "" : v).trim();
    if (s === "" || s === "null" || s === "undefined") { return null; }
    var n = Number(s);
    return isFinite(n) ? n : null;
  }
  /* A percentage AS TYPED: digits with at most one decimal separator,
     point or comma, and an optional % sign. Anything else is NaN - the
     old parseFloat accepted "50abc" as 50 and "1.234,5" as 1.234. */
  function typedPercent(text) {
    var s = String(text === null || text === undefined ? "" : text).trim();
    if (s.charAt(s.length - 1) === "%") { s = s.substring(0, s.length - 1).trim(); }
    if (!/^(\d+([.,]\d*)?|[.,]\d+)$/.test(s)) { return NaN; }
    return Number(s.replace(",", "."));
  }
  /* ROUNDED AT THE BOUNDARY, both ways. Binary fractions made 66.67 leave
     as 0.6667000000000001 and 0.57 arrive as 56.99999999999999. */
  function toModelText(pct, scale) { return String(roundTo((Number(pct) || 0) / scale, 8)); }
  function fromModel(v, scale) { return roundTo(Number(v) * scale, 6); }
  /* The qualified key of a member, as a template for its siblings. Only
     the FINAL &[id] is the id: replacing the first occurrence turned
     '[CL_V3_CONSUNIT].[H1].&[H1]' into '[CL_V3_CONSUNIT].[{ID}].&[H1]'. */
  function keyTemplate(key, id) {
    var k = String(key || ""), tail = "&[" + id + "]";
    if (!id || k.length <= tail.length) { return ""; }
    if (k.substring(k.length - tail.length) !== tail) { return ""; }
    return k.substring(0, k.length - tail.length) + "&[{ID}]";
  }
  function fromTemplate(tpl, id) { return tpl ? tpl.split("{ID}").join(id) : id; }
  /* 't.2.Cm28...:Cm28...' (DataSource.getInfo().modelId)  ->  'Cm28...' */
  function modelIdOf(text) {
    var s = String(text === null || text === undefined ? "" : text).trim();
    var at = s.lastIndexOf(":");
    return at >= 0 ? s.substring(at + 1) : s;
  }
  function isEmptyRecord(r) {
    return (r.method === "" || r.method === "0") && r.pcon === 0 && r.pown === 0;
  }
  function sameRecord(a, b) {
    var ma = (a.method === "0") ? "" : String(a.method), mb = (b.method === "0") ? "" : String(b.method);
    return ma === mb && Math.abs(a.pcon - b.pcon) < 0.000001 && Math.abs(a.pown - b.pown) < 0.000001;
  }
  /* Result-set cells, one record per cell (group~unit~measure~value),
     pivoted into one record per group and unit. */
  function pivotCells(recs, scale) {
    var order = [], map = {}, unitTpl = "";
    recs.forEach(function (f) {
      var gKey = (f[0] || "").trim(), uKey = (f[1] || "").trim();
      var g = plainId(gKey), u = plainId(uKey);
      if (!g || !u) { return; }
      if (!unitTpl) { unitTpl = keyTemplate(uKey, u); }
      var k = g + "\u0001" + u;
      if (!map[k]) {
        map[k] = { group: g, unit: u, groupKey: gKey, unitKey: uKey, method: "", pcon: 0, pown: 0 };
        order.push(k);
      }
      var msr = plainId((f[2] || "").trim()).toUpperCase();
      var val = modelNumber(f[3]);
      if (val === null) { return; }
      if (msr === "METHOD") { map[k].method = String(Math.round(val)); }
      else if (msr === "PCON") { map[k].pcon = fromModel(val, scale); }
      else if (msr === "POWN") { map[k].pown = fromModel(val, scale); }
    });
    return { order: order, map: map, unitTpl: unitTpl };
  }

  var CORE = {
    HORIZON_HOST: HORIZON_HOST,
    esc: esc, plainId: plainId, scopeName: scopeName, isSynthetic: isSynthetic,
    makeExcluder: makeExcluder, roundTo: roundTo, modelNumber: modelNumber,
    typedPercent: typedPercent, toModelText: toModelText, fromModel: fromModel,
    keyTemplate: keyTemplate, fromTemplate: fromTemplate, modelIdOf: modelIdOf,
    isEmptyRecord: isEmptyRecord, sameRecord: sameRecord, pivotCells: pivotCells
  };
  (typeof globalThis !== "undefined" ? globalThis : window).OwnershipCore = CORE;

  var ICON_CHEVRON = '<svg class="tw" data-tw="1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6l4 4 4-4"/></svg>';
  var ICON_BIN = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.2a.8.8 0 0 0 .8.8h4.2a.8.8 0 0 0 .8-.8l.6-8.2"/></svg>';
  var LOCKED_TITLE = "Not consolidated - percentages are fixed at zero";

  class OwnershipWidget extends HTMLElement {
    constructor() {
      super();
      this._sr = this.attachShadow({ mode: "open" });
      this._sr.appendChild(TPL.content.cloneNode(true));

      this._props = {
        widgetTitle: "Consolidation Ownership", scopeText: "",
        showNci: true, readOnly: false, grouped: true,
        includeEmptyRows: false, showPgroup: false, showSaveDialog: true, percentScale: 100, decimals: 2, defaultMethod: DEFAULT_METHOD,
        methodList: DEFAULT_METHODS, fieldSeparator: "~", recordSeparator: ";;",
        apiTenantUrl: "", apiModelId: "", autoLoadMasterData: true, useHierarchy: true,
        showFilterBar: true, excludeUnits: "#, SNONE", excludeGroups: "#, SNONE", periodIdPattern: "^\\d{6}$",
        unitDimension: "CL_V3_CONSUNIT", groupDimension: "CL_V3_CONSGROUP",
        memberIdColumn: "ID", memberDescColumn: "Description", memberParentColumn: "H1_PARENTID",
        checkLoadedScope: true, diagnostics: false
      };
      this._units = [];
      this._unitIx = {};
      this._kidsIx = {};
      this._rootList = [];
      this._leafCache = {};
      this._groups = [];
      this._rows = [];
      this._deletes = [];
      this._changes = [];          // frozen when Save is pressed
      this._delSnap = [];
      this._sel = new Set();
      this._collapsed = new Set();
      this._seq = 0;
      this._last = { group: "", unit: "", field: "", value: "" };
      this._dlg = { picked: new Set(), exp: new Set(), group: null, q: "" };
      this._sv = { total: 0, done: 0, failed: 0, t0: 0, log: [], active: false, shown: false, kind: "" };
      this._csrf = null;
      this._mdLoaded = false;
      this._modelOverride = "";
      this._baseline = [];
      /* what the filter bar SHOWS - changes as soon as a picker closes */
      this._filter = { version: "", period: "", groups: [], units: [] };
      /* what was ASKED FOR when Go was last pressed */
      this._applied = { version: "", period: "", groups: [], units: [] };
      /* what the rows in the table were READ FOR - the only scope a save
         may write to */
      this._loaded = { version: "", period: "" };
      this._loadExpected = false;
      this._saving = false;
      this._verify = null;
      this._conflicts = [];
      this._msgs = [];
      this._pexp = new Set();
      this._unitKeyTpl = "";
      this._closeTimer = null;
      this._taskTimer = null;
      this._hintTimer = null;
      this._verOpts = [];
      this._perOpts = [];
      this._methodCache = { key: null, list: [] };
      this._confirmFn = null;

      this._wire();
    }

    /* ---------------- lifecycle ---------------- */
    onCustomWidgetBeforeUpdate(changed) { this._props = Object.assign({}, this._props, changed); }
    onCustomWidgetAfterUpdate() {
      this._render();
      this._autoLoad();
    }
    onCustomWidgetResize() { this._placePicker(); }
    onCustomWidgetDestroy() {
      window.clearTimeout(this._closeTimer);
      window.clearTimeout(this._taskTimer);
      window.clearTimeout(this._hintTimer);
      window.clearTimeout(this._tt);
    }

    /* ---------------- the run log ----------------
       One line per step, so a save that went wrong leaves something to
       read. NO VALUES by default: ownership percentages in the browser
       console are a disclosure. The detail argument is printed only with
       Diagnostics on, which production must not enable. */
    _log(step, detail) {
      if (typeof console === "undefined" || !console.log) { return; }
      if (detail !== undefined && this._props.diagnostics === true) {
        console.log("[" + TAG + "] " + step + " | " + String(detail));
      } else {
        console.log("[" + TAG + "] " + step);
      }
    }

    /* ---------------- messages that stay ----------------
       A failure persists until it is acknowledged. A toast that fades is
       not a report. */
    _say(kind, text, id) {
      var key = id || ("m" + (++this._seq));
      this._msgs = this._msgs.filter(function (m) { return m.id !== key; });
      this._msgs.push({ id: key, kind: kind, text: String(text) });
      this._renderStrips();
    }
    _dropMsg(id) {
      var n = this._msgs.length;
      this._msgs = this._msgs.filter(function (m) { return m.id !== id; });
      if (this._msgs.length !== n) { this._renderStrips(); }
    }
    _fail(text, id) {
      /* whatever was being waited for is not coming: stop holding the
         table's scroll position for it */
      this._scrollHold = null;
      this._log("FAILED - " + text);
      this._say("err", text, id);
    }

    /* ---------------- inbound: delimited text ---------------- */
    _recs(text) {
      var rs = this._props.recordSeparator || ";;";
      var fs = this._props.fieldSeparator || "~";
      var out = [];
      String(text === null || text === undefined ? "" : text).split(rs).forEach(function (line) {
        if (line === "") { return; }
        out.push(line.split(fs));
      });
      return out;
    }
    _scale() {
      var s = Number(this._props.percentScale);
      return (isFinite(s) && s > 0) ? s : 100;
    }

    /* ---------- master data straight from the SAC Data Export API ----------
       Runs same-origin inside the SAC page, so the session cookie is the auth.
       This is the only place the hierarchy parent is available. */
    _apiBase() {
      var t = String(this._props.apiTenantUrl || "").replace(/\/+$/, "");
      return t || window.location.origin;
    }
    _modelId() { return modelIdOf(this._modelOverride || this._props.apiModelId); }
    /* The model id, from the story script - so it is DERIVED from the
       table's data source and nothing tenant-specific is typed into the
       panel or the manifest (CLAUDE.md Part 7). */
    setModelId(text) {
      this._modelOverride = String(text === null || text === undefined ? "" : text);
      this._log("model id received from the story script");
      this._dropMsg("nomodel");
      this._autoLoad();
    }
    _autoLoad() {
      var self = this;
      if (this._mdLoaded || this._props.autoLoadMasterData === false) { return; }
      if (!this._modelId()) {
        /* the script's setModelId() normally arrives a moment later */
        window.clearTimeout(this._hintTimer);
        this._hintTimer = window.setTimeout(function () {
          if (!self._mdLoaded && !self._modelId()) {
            self._say("info", "No model id yet. Call setModelId() from the story script, or enter the model id in the builder panel.", "nomodel");
          }
        }, 3000);
        return;
      }
      this._mdLoaded = true;
      this.loadMasterDataFromApi();
    }
    /* Every page of one read. REJECTS on anything but a success, with the
       HTTP status on the error: a failed read must never look like an
       empty one. */
    _readAll(url, token, what) {
      var acc = [], pages = 0;
      var page = function (u) {
        return fetch(u, {
          method: "GET",
          headers: { "Accept": "application/json", "x-csrf-token": token },
          credentials: "include"
        }).then(function (res) {
          if (!res.ok) {
            var e = new Error("Could not read " + what + " (HTTP " + String(res.status) + ").");
            e.status = res.status;
            throw e;
          }
          return res.json();
        }).then(function (json) {
          var rows = (json && json.value && json.value.length !== undefined) ? json.value
                   : ((json && json.length !== undefined) ? json : null);
          if (rows === null) { throw new Error("Could not read " + what + " (the answer holds no rows)."); }
          acc = acc.concat(rows);
          var next = (json && json["@odata.nextLink"]) || "";
          if (!next) { return acc; }
          pages = pages + 1;
          if (pages > 500) { throw new Error("Could not read " + what + " (more than 500 pages)."); }
          /* a next link may be relative to the request it came from */
          return page(new URL(next, u).toString());
        });
      };
      return page(url);
    }
    loadMasterDataFromApi() {
      var self = this;
      var base = this._apiBase();
      var model = this._modelId();
      if (!model) { this._fail("No model id configured for the master data API.", "nomodel"); return; }

      this._loadExpected = true;
      this._log("master data: reading");
      this._openTask("Loading master data", "Reading consolidation units and groups", "master", 45000);

      var root = base + "/api/v1/dataexport/providers/sac/" + encodeURIComponent(model) + "/";
      var uDim = this._props.unitDimension, gDim = this._props.groupDimension;

      fetch(base + "/api/v1/csrf", {
        method: "GET",
        headers: { "x-csrf-token": "fetch" },
        credentials: "include"
      }).then(function (r) {
        /* an error response still carries headers - check before trusting */
        if (!r.ok) { throw new Error("The token request failed (HTTP " + String(r.status) + ")."); }
        var token = r.headers.get("x-csrf-token");
        if (!token) { throw new Error("The token request answered without a token."); }
        self._csrf = token;

        var units;
        if (self._props.useHierarchy === false) {
          units = self._readAll(root + uDim + "Master", token, uDim);
        } else {
          /* MasterWithHierarchy carries the parent; plain Master does not.
             HTTP 400 means the dimension HAS NO HIERARCHY, so the flat
             read is the right one. Anything else is a failure, and is
             reported as one rather than quietly flattening the tree. */
          units = self._readAll(root + uDim + "MasterWithHierarchy", token, uDim).catch(function (e) {
            if (e.status !== 400) { throw e; }
            self._log("master data: " + uDim + " has no hierarchy, reading it flat");
            return self._readAll(root + uDim + "Master", token, uDim);
          });
        }
        return Promise.all([units, self._readAll(root + gDim + "Master", token, gDim)]);
      }).then(function (both) {
        self._applyUnitRows(both[0]);
        self._applyGroupRows(both[1]);
        self._log("master data: " + String(self._units.length) + " unit(s), " + String(self._groups.length) + " group(s)");
        self._render();
        /* Master data is ready, but keep the progress dialog open until
           setFactCells() has received and rendered the ownership data. */
        self._$("#stitle").textContent = "Loading ownership data";
        self._$("#ssub").textContent = "Reading ownership records";
        self._$("#sphase").textContent = "Waiting for story script";
        self._fire("onMasterDataLoaded");
      }).catch(function (e) {
        var msg = "Master data could not be loaded. " + String((e && e.message) || e);
        self._mdLoaded = false;
        self._closeTask(false, msg);
        self._fail(msg, "master");
      });
    }
    _indexUnits() {
      var ix = {}, kids = {};
      this._units.forEach(function (u) { ix[u.id] = u; });
      this._units.forEach(function (u) {
        if (u.parentId && !ix[u.parentId]) { u.parentId = null; }
        if (u.parentId) {
          if (!kids[u.parentId]) { kids[u.parentId] = []; }
          kids[u.parentId].push(u);
        }
      });
      this._units.forEach(function (u) { u.isNode = !!kids[u.id]; });
      this._unitIx = ix;
      this._kidsIx = kids;
      this._rootList = this._units.filter(function (u) { return !u.parentId; });
      this._leafCache = {};
    }
    _applyUnitRows(rows) {
      var idC = this._props.memberIdColumn || "ID";
      var dsC = this._props.memberDescColumn || "Description";
      var pC = this._props.memberParentColumn || "H1_PARENTID";
      /* THE PARENT COLUMN IS NAMED AFTER THE HIERARCHY (H1_PARENTID,
         parentId_PARENTID, ...), and a member at the top carries no
         parent key at all - so look across the rows, and where the
         configured name appears nowhere take the one that ends in
         _PARENTID. */
      var has = rows.some(function (r) { return r && Object.prototype.hasOwnProperty.call(r, pC); });
      if (!has) {
        var found = "";
        rows.forEach(function (r) {
          if (found || !r) { return; }
          Object.keys(r).forEach(function (k) {
            if (!found && /_PARENTID$/.test(k)) { found = k; }
          });
        });
        if (found) {
          this._log("master data: parent column " + pC + " not present, using " + found);
          pC = found;
        }
      }
      var drop = makeExcluder(this._props.excludeUnits);
      this._units = rows.map(function (r) {
        var id = plainId(String(r[idC] === null || r[idC] === undefined ? "" : r[idC]).trim());
        var par = plainId(String(r[pC] === null || r[pC] === undefined ? "" : r[pC]).trim());
        if (par === "#" || par === "null" || par === id || isSynthetic(par) || drop(par)) { par = ""; }
        return {
          id: id,
          description: String(r[dsC] === null || r[dsC] === undefined ? "" : r[dsC]).trim() || id,
          parentId: par || null,
          isNode: false
        };
      }).filter(function (u) { return u.id !== "" && !isSynthetic(u.id) && !drop(u.id); });
      this._indexUnits();
    }
    _applyGroupRows(rows) {
      var idC = this._props.memberIdColumn || "ID";
      var dsC = this._props.memberDescColumn || "Description";
      var dropG = makeExcluder(this._props.excludeGroups);
      this._groups = rows.map(function (r) {
        return {
          id: plainId(String(r[idC] === null || r[idC] === undefined ? "" : r[idC]).trim()),
          description: String(r[dsC] === null || r[dsC] === undefined ? "" : r[dsC]).trim()
        };
      }).filter(function (g) { return g.id !== "" && !isSynthetic(g.id) && !dropG(g.id); });
      if (!this._dlg.group && this._groups.length) { this._dlg.group = this._groups[0].id; }
      this._renderFilters();
    }

    /* ---------- filter bar ---------- */
    setVersionOptions(text) {
      this._verOpts = this._recs(text).map(function (f) {
        var raw = (f[0] || "").trim();
        var desc = (f[1] || "").trim();
        return { id: raw, plain: plainId(raw), text: desc || plainId(raw) };
      }).filter(function (o) { return o.id !== ""; });
      if (!this._filter.version && this._verOpts.length) { this._filter.version = this._verOpts[0].id; }
      this._renderFilters();
    }
    setPeriodOptions(text) {
      var pat = String(this._props.periodIdPattern || "").trim();
      var re = null;
      if (pat) {
        try { re = new RegExp(pat); }
        catch (e) { re = null; this._fail("The period id pattern in the builder panel is not a valid regular expression, so every period is shown.", "pattern"); }
      }
      this._perOpts = this._recs(text).map(function (f) {
        var raw = (f[0] || "").trim();
        var plain = plainId(raw);
        var desc = (f[1] || "").trim();
        /* id stays fully qualified - the table filter needs the hierarchy form */
        return { id: raw, plain: plain, text: desc ? plain + " - " + desc : plain };
      }).filter(function (o) {
        if (o.id === "") { return false; }
        return re ? re.test(o.plain) : true;
      });
      if (!this._filter.period && this._perOpts.length) { this._filter.period = this._perOpts[0].id; }
      this._renderFilters();
    }
    getFilterVersion() { return this._filter.version || ""; }
    getFilterPeriod() { return this._filter.period || ""; }
    getFilterGroupCount() { return this._filter.groups.length; }
    getFilterGroupAt(i) { return this._filter.groups[i] || ""; }
    getFilterUnitCount() { return this._filter.units.length; }
    getFilterUnitAt(i) {
      var id = this._filter.units[i] || "";
      if (!id) { return ""; }
      return fromTemplate(this._unitKeyTpl, id);
    }
    /* The story script is about to set the table's filters from the
       filter bar: from here on THAT is the scope asked for. Go does the
       same before it fires; the first load has no Go. */
    applyFilterSelection() {
      this._applied = {
        version: this._filter.version, period: this._filter.period,
        groups: this._filter.groups.slice(), units: this._filter.units.slice()
      };
      this._loadExpected = true;
      this._renderFilters();
    }
    /* THE SCOPE A SAVE WRITES TO: what the rows on screen were read for.
       Not the filter bar, which moves as soon as a picker closes, and not
       a global, which keeps describing the last scope that HAD rows. */
    getLoadedVersion() { return this._loaded.version || ""; }
    getLoadedPeriod() { return this._loaded.period || ""; }

    _renderFilters() {
      this._$("#fbar").hidden = this._props.showFilterBar === false;

      var opts = this._filterOptions("ver");
      if (!this._filter.version && opts.length) { this._filter.version = opts[0].id; }
      opts = this._filterOptions("per");
      if (!this._filter.period && opts.length) { this._filter.period = opts[0].id; }

      this._$("#fver").firstElementChild.textContent = this._labelFor("ver", this._filter.version);
      this._$("#fper").firstElementChild.textContent = this._labelFor("per", this._filter.period);
      this._$("#fgrp").firstElementChild.textContent = this._multiLabel("grp");
      this._$("#funt").firstElementChild.textContent = this._multiLabel("unt");

      var pending = this._filterDirty();
      this._$("#fapply").classList.toggle("pend", pending);
      this._$("#fapply").title = pending ? "Apply the changed filters" : "Re-read the model";
    }
    _sameSet(a, b) {
      if (a.length !== b.length) { return false; }
      for (var i = 0; i < a.length; i++) { if (b.indexOf(a[i]) < 0) { return false; } }
      return true;
    }
    _filterDirty() {
      if (!this._loaded.version && !this._loaded.period) { return false; }
      return this._filter.version !== this._applied.version ||
             this._filter.period !== this._applied.period ||
             !this._sameSet(this._filter.groups, this._applied.groups) ||
             !this._sameSet(this._filter.units, this._applied.units);
    }
    _isMulti(which) { return which === "grp" || which === "unt"; }
    _sel4(which) { return which === "grp" ? this._filter.groups : this._filter.units; }
    _filterOptions(which) {
      if (which === "ver") { return this._verOpts; }
      if (which === "per") { return this._perOpts; }
      if (which === "grp") {
        return this._groups.map(function (g) {
          return { id: g.id, text: g.description ? g.id + " - " + g.description : g.id };
        });
      }
      return this._units.map(function (u) {
        return { id: u.id, text: u.description ? u.id + " - " + u.description : u.id };
      });
    }
    _labelFor(which, id) {
      var list = this._filterOptions(which);
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === (id || "")) { return list[i].text || list[i].id || "-"; }
      }
      return id || "-";
    }
    _multiLabel(which) {
      var sel = this._sel4(which);
      var all = which === "grp" ? "All consolidation groups" : "All consolidation units";
      if (!sel.length) { return all; }
      if (sel.length === 1) { return this._labelFor(which, sel[0]); }
      return sel.length + (which === "grp" ? " groups selected" : " units selected");
    }
    _openPicker(which) {
      this._pick = which;
      var multi = this._isMulti(which);
      var titles = { ver: "Select version", per: "Select period",
                     grp: "Select consolidation groups", unt: "Select consolidation units" };
      this._$("#ptitle").textContent = titles[which];
      this._$("#pq").value = "";
      /* snapshot so Cancel can discard */
      this._pickSnap = multi ? this._sel4(which).slice() : null;
      if (which === "unt") {
        var self0 = this;
        this._roots().forEach(function (r) { self0._pexp.add(r.id); });
      }
      this._$("#pbar").hidden = !multi;
      this._$("#pnone").hidden = !multi;
      this._$("#pok").hidden = !multi;
      this._$("#povl").hidden = false;
      this._renderPicker("");
      this._placePicker();
      var self0f = this;
      var q = this._$("#pq");
      window.setTimeout(function () { self0f._focus(q); }, 30);
    }
    /* THE LIST OPENS UNDER THE FIELD IT BELONGS TO (owner, 2026-09-27:
       "they appear in the middle of the screen and is odd"). It was a
       dialog centred on the widget, so choosing a version meant looking
       away from the version field. Placed against the shell, which is
       what the overlay is positioned in; kept inside it on the right and
       at the bottom, because SAC clips whatever runs past the widget. */
    _placePicker() {
      var ovl = this._$("#povl");
      if (ovl.hidden || !this._pick) { return; }
      var btn = this._$({ ver: "#fver", per: "#fper", grp: "#fgrp", unt: "#funt" }[this._pick]);
      var dlg = ovl.querySelector(".dlg");
      var shell = this._$(".shell").getBoundingClientRect();
      var b = btn.getBoundingClientRect();
      var rem = parseFloat(window.getComputedStyle(this).fontSize) || 14;
      var gap = 0.5 * rem;
      var width = Math.min(Math.max(b.width, 22 * rem), 32 * rem, Math.max(shell.width - 2 * gap, 0));
      var left = Math.max(gap, Math.min(b.left - shell.left, shell.width - width - gap));
      var top = b.bottom - shell.top + 0.125 * rem;
      /* room for the search box, a few rows and the footer - if the
         widget is too short for that below the field, the list moves up
         over the filter bar rather than being squeezed flat */
      var least = Math.min(18 * rem, Math.max(shell.height - 2 * gap, 0));
      if (shell.height - top - gap < least) { top = Math.max(gap, shell.height - gap - least); }
      dlg.style.left = String(left) + "px";
      dlg.style.top = String(top) + "px";
      dlg.style.width = String(width) + "px";
      dlg.style.maxHeight = String(Math.max(shell.height - top - gap, 0)) + "px";
    }
    _closePicker() {
      var which = this._pick;
      this._$("#povl").hidden = true;
      var btn = which ? this._$({ ver: "#fver", per: "#fper", grp: "#fgrp", unt: "#funt" }[which]) : null;
      this._focus(btn);
    }
    _splitOpt(o) {
      var t = o.text || o.id || "";
      var at = t.indexOf(" - ");
      if (at < 0) { return { id: t, desc: "" }; }
      return { id: t.substring(0, at), desc: t.substring(at + 3) };
    }
    /* One pass over the tree per search term: which members match, or
       lead to one that does. */
    _matchSet(term, inScope) {
      var self = this, out = {};
      var visit = function (u, trail) {
        if (trail[u.id]) { return false; }
        trail[u.id] = true;
        var hit = false;
        var own = !term || (u.id + " " + u.description).toLowerCase().indexOf(term) >= 0;
        var kids = self._children(u.id);
        if (kids.length) {
          for (var i = 0; i < kids.length; i++) { if (visit(kids[i], trail)) { hit = true; } }
          /* a node that matches by name shows its whole branch */
          if (own && !hit && (!inScope || self._addScopeLeaves(u.id).length > 0)) { hit = true; }
        } else {
          hit = own && (!inScope || inScope(u.id));
        }
        delete trail[u.id];
        if (hit) { out[u.id] = true; }
        return hit;
      };
      this._roots().forEach(function (r) { visit(r, {}); });
      return out;
    }
    _renderPicker(term) {
      var which = this._pick, self = this;
      var multi = this._isMulti(which);
      var sel = multi ? this._sel4(which) : null;
      var cur = which === "ver" ? this._filter.version : this._filter.period;
      var t = String(term || "").trim().toLowerCase();
      var html = [], shown = 0, chosen = 0;

      if (which === "unt" && this._units.length) {
        /* hierarchical list: a node contributes every base unit below it */
        var ok = this._matchSet(t, null);
        var on4 = {};
        sel.forEach(function (x) { on4[x] = true; });
        var walk = function (u, depth) {
          if (!ok[u.id]) { return; }
          var kids = self._children(u.id);
          var isNode = kids.length > 0;
          var exp = self._pexp.has(u.id) || !!t;
          var on, leaves = null;
          if (isNode) {
            leaves = self._leaves(u.id);
            on = leaves.length > 0 && leaves.every(function (x) { return on4[x] === true; });
            if (!exp) {
              /* a collapsed node stands for the units below it */
              shown = shown + leaves.length;
              leaves.forEach(function (x) { if (on4[x] === true) { chosen = chosen + 1; } });
            }
          } else {
            on = on4[u.id] === true;
            shown = shown + 1;
            if (on) { chosen = chosen + 1; }
          }
          html.push('<button class="pitem" data-id="' + esc(u.id) + '" data-exp="' + exp +
            '" aria-selected="' + on + '" style="padding-left:' + (1 + depth * 1.125) + 'rem">' +
            '<input type="checkbox" class="tcb" tabindex="-1"' + (on ? " checked" : "") + ">" +
            (isNode ? ICON_CHEVRON : '<span class="lf"></span>') +
            '<span class="pid">' + esc(u.id) + "</span>" +
            (u.description ? '<span class="pdesc">' + esc(u.description) + "</span>" : "") +
            (isNode ? '<span class="chip node">' + leaves.length + " units</span>" : "") +
            "</button>");
          if (isNode && exp) { kids.forEach(function (c) { walk(c, depth + 1); }); }
        };
        this._roots().forEach(function (r) { walk(r, 0); });
      } else {
        this._filterOptions(which).forEach(function (o) {
          var hay = (o.id + " " + o.text).toLowerCase();
          if (t && hay.indexOf(t) < 0) { return; }
          shown = shown + 1;
          var on = multi ? (sel.indexOf(o.id) >= 0) : (o.id === (cur || ""));
          if (on) { chosen = chosen + 1; }
          var parts = self._splitOpt(o);
          html.push('<button class="pitem" data-id="' + esc(o.id) + '" aria-selected="' + on + '">' +
            (multi ? '<input type="checkbox" class="tcb" tabindex="-1"' + (on ? " checked" : "") + ">" : "") +
            '<span class="pid">' + esc(parts.id) + "</span>" +
            (parts.desc ? '<span class="pdesc">' + esc(parts.desc) + "</span>" : "") +
            "</button>");
        });
      }

      this._$("#plist").innerHTML = html.join("") ||
        '<div class="empty">Nothing matches the search.</div>';

      if (multi) {
        this._$("#psub").textContent = sel.length
          ? sel.length + " selected"
          : "Nothing selected shows everything";
        this._$("#palltx").textContent = "Select all (" + shown + ")";
        this._$("#pallcb").checked = shown > 0 && chosen === shown;
      } else {
        this._$("#psub").textContent = "";
      }
    }
    _cancelPicker() {
      /* multi-select pickers discard their pending changes on cancel */
      if (this._pickSnap && this._isMulti(this._pick)) {
        var sel = this._sel4(this._pick);
        sel.length = 0;
        for (var i = 0; i < this._pickSnap.length; i++) { sel.push(this._pickSnap[i]); }
      }
      this._closePicker();
      this._renderFilters();
    }
    _pickerVisibleIds() {
      var which = this._pick, self = this;
      var t = String(this._$("#pq").value || "").trim().toLowerCase();
      var out = [];
      if (which === "unt" && this._units.length) {
        var ok = this._matchSet(t, null);
        var walk = function (u) {
          if (!ok[u.id]) { return; }
          var kids = self._children(u.id);
          if (!kids.length) { out.push(u.id); return; }
          if (self._pexp.has(u.id) || t) { kids.forEach(walk); return; }
          self._leaves(u.id).forEach(function (x) { out.push(x); });
        };
        this._roots().forEach(walk);
        return out;
      }
      this._filterOptions(which).forEach(function (o) {
        var hay = (o.id + " " + o.text).toLowerCase();
        if (t && hay.indexOf(t) < 0) { return; }
        out.push(o.id);
      });
      return out;
    }

    setUnits(text) {
      var drop = makeExcluder(this._props.excludeUnits);
      this._units = this._recs(text).map(function (f) {
        var id = plainId((f[0] || "").trim());
        var par = plainId((f[2] || "").trim());
        if (par === id || drop(par)) { par = ""; }
        return { id: id, description: (f[1] || f[0] || "").trim(), parentId: par || null, isNode: false };
      }).filter(function (u) { return u.id !== "" && !drop(u.id); });
      this._indexUnits();
      this._render();
    }

    setGroups(text) {
      var dropG = makeExcluder(this._props.excludeGroups);
      this._groups = this._recs(text).map(function (f) {
        return { id: plainId((f[0] || "").trim()), description: (f[1] || "").trim() };
      }).filter(function (g) { return g.id !== "" && !dropG(g.id); });
      if (!this._dlg.group && this._groups.length) { this._dlg.group = this._groups[0].id; }
      this._render();
    }

    _row(rec, isNew) {
      return {
        key: "r" + (++this._seq), group: rec.group, unit: rec.unit,
        groupKey: rec.groupKey || rec.group, unitKey: rec.unitKey || rec.unit,
        method: rec.method, pcon: rec.pcon, pown: rec.pown,
        dirty: isNew === true, isNew: isNew === true, invalid: {}, raw: {}
      };
    }

    /* One record per result-set cell: group~unit~measure~value, with the
       version and period OF THE ROWS THE TABLE RETURNED ("" when it
       returned none). */
    setFactCells(text, version, period) {
      var self = this;
      var rowVer = String(version === null || version === undefined ? "" : version);
      var rowPer = String(period === null || period === undefined ? "" : period);

      /* UNSAVED CHANGES ARE NOT REPLACED BY A LOAD NOBODY ASKED FOR. The
         old save handler reloaded after a FAILED save, which emptied the
         table of the very edits that had just been rejected. */
      if (this.hasChanges() && !this._loadExpected) {
        this._fail("Data arrived from the story script while there are unsaved changes. It was not loaded, so the changes are kept. Save or revert them, then choose Refresh.", "unasked");
        if (this._sv.active && this._sv.kind !== "save") { this._closeTask(false, "Not loaded - there are unsaved changes."); }
        return;
      }
      this._loadExpected = false;

      /* THE TABLE MUST HAVE ANSWERED FOR THE SCOPE THAT WAS ASKED FOR.
         setDimensionFilter does not wait, so a result set read straight
         after it can still be the previous scope's. */
      if (this._props.checkLoadedScope !== false) {
        var wrong = "";
        if (rowVer && this._applied.version && scopeName(rowVer) !== scopeName(this._applied.version)) {
          wrong = "version " + scopeName(rowVer) + " while " + scopeName(this._applied.version) + " was asked for";
        } else if (rowPer && this._applied.period && scopeName(rowPer) !== scopeName(this._applied.period)) {
          wrong = "period " + scopeName(rowPer) + " while " + scopeName(this._applied.period) + " was asked for";
        }
        if (wrong) {
          this._rows = []; this._deletes = []; this._baseline = []; this._sel.clear();
          this._loaded = { version: "", period: "" };
          this._verify = null;
          var msg = "The table answered for " + wrong + ". Nothing was loaded. Choose Go to read it again.";
          if (this._sv.active && this._sv.kind !== "save") { this._closeTask(false, msg); }
          this._fail(msg, "scope");
          this._render();
          return;
        }
      }
      this._dropMsg("scope");
      this._dropMsg("unasked");

      var recs = this._recs(text);
      var pv = pivotCells(recs, this._scale());
      if (pv.unitTpl) { this._unitKeyTpl = pv.unitTpl; }

      this._rows = [];
      var unset = 0;
      pv.order.forEach(function (k) {
        var r = pv.map[k];
        /* a zeroed-out record is a deleted one: hide it unless the builder asks for empties */
        if (isEmptyRecord(r) && !self._props.includeEmptyRows) { return; }
        /* THE METHOD IS SHOWN AS THE MODEL HOLDS IT. A record with
           percentages and no method used to be drawn with the default
           method - a value the model does not contain, on a row not
           marked as changed. */
        if (r.method === "0") { r.method = ""; }
        if (r.method === "" && !isEmptyRecord(r)) { unset = unset + 1; }
        self._rows.push(self._row(r, false));
      });
      this._deletes = [];
      this._changes = [];
      this._delSnap = [];
      this._sel.clear();
      this._loaded = {
        version: rowVer || this._applied.version || "",
        period: rowPer || this._applied.period || ""
      };
      this._baseline = this._rows.map(function (r) {
        return { group: r.group, unit: r.unit, groupKey: r.groupKey, unitKey: r.unitKey,
                 method: r.method, pcon: r.pcon, pown: r.pown };
      });
      this._log("facts: " + String(recs.length) + " cell(s), " + String(this._rows.length) + " record(s), scope " +
        scopeName(this._loaded.version) + " / " + scopeName(this._loaded.period));
      if (unset) { this._log("facts: " + String(unset) + " record(s) hold percentages but no method"); }

      this._checkReadBack(pv);

      /* Ownership data has arrived and rows are ready. This is the end of
         the initial load or refresh, so the progress dialog can now close. */
      if (this._sv.active && this._sv.kind !== "save") {
        this._$("#stitle").textContent = "Loading ownership data";
        this._$("#ssub").textContent = "Rendering ownership table";
        this._$("#sphase").textContent = "Finalising";
        this._closeTask(true, this._rows.length + " ownership record(s) loaded.");
      }
      this._render();
      this._dropScroll();
    }

    /* THE SAVE IS READ BACK. setUserInput, submitData and publish each
       answer true or false and nothing more; the first load after a save
       is compared with what was saved, and a difference is reported
       rather than assumed away. */
    _checkReadBack(pv) {
      var v = this._verify;
      this._verify = null;
      if (!v) { return; }
      if (scopeName(v.version) !== scopeName(this._loaded.version) ||
          scopeName(v.period) !== scopeName(this._loaded.period)) { return; }
      var off = [];
      v.rows.forEach(function (w) {
        var got = pv.map[w.group + "\u0001" + w.unit] || { method: "", pcon: 0, pown: 0 };
        if (!sameRecord(w, got)) { off.push(w.group + " / " + w.unit); }
      });
      v.deletes.forEach(function (d) {
        var got = pv.map[d.group + "\u0001" + d.unit];
        if (got && !isEmptyRecord(got)) { off.push(d.group + " / " + d.unit + " (removed)"); }
      });
      if (!off.length) {
        this._log("read-back: " + String(v.rows.length + v.deletes.length) + " record(s) match what was saved");
        return;
      }
      this._fail(String(off.length) + " record(s) read back differently from what was saved: " +
        off.slice(0, 5).join(", ") + (off.length > 5 ? ", ..." : "") +
        ". The table shows what the model returned.", "readback");
    }

    /* Before a save: the same cells, read again. How many of the records
       about to be written no longer hold what this widget loaded? */
    countConflicts(text) {
      var pv = pivotCells(this._recs(text), this._scale());
      var base = {}, out = [];
      this._baseline.forEach(function (b) { base[b.group + "\u0001" + b.unit] = b; });
      var check = function (r) {
        var k = r.group + "\u0001" + r.unit;
        var was = base[k] || { method: "", pcon: 0, pown: 0 };
        var now = pv.map[k] || { method: "", pcon: 0, pown: 0 };
        if (!sameRecord(was, now)) { out.push(r.group + " / " + r.unit); }
      };
      this._changes.forEach(check);
      this._delSnap.forEach(check);
      this._conflicts = out;
      this._log("conflict check: " + String(out.length) + " of " +
        String(this._changes.length + this._delSnap.length) + " record(s) changed since loading");
      return out.length;
    }
    getConflictText() {
      var c = this._conflicts;
      return c.slice(0, 5).join(", ") + (c.length > 5 ? ", ..." : "");
    }

    revertChanges() {
      var self = this;
      this._rows = this._baseline.map(function (b) { return self._row(b, false); });
      this._deletes = [];
      this._changes = [];
      this._delSnap = [];
      this._sel.clear();
      this._render();
      this._toast("All unsaved changes reverted.", "info");
    }

    clearData() {
      this._rows = []; this._deletes = []; this._baseline = []; this._sel.clear();
      this._loaded = { version: "", period: "" };
      this._render();
    }

    /* ---------------- outbound: primitives only ---------------- */
    _dirtyRows() { return this._rows.filter(function (r) { return r.dirty; }); }
    hasChanges() {
      return this._deletes.length > 0 || this._rows.some(function (r) { return r.dirty; });
    }
    /* While a save runs the lists are FROZEN - the indexes the script
       walks must mean the same record from the first call to the last. */
    getChangeCount() {
      if (!this._saving) { this._changes = this._dirtyRows(); }
      return this._changes.length;
    }
    getChangeGroup(i) { var c = this._changes[i]; return c ? (c.groupKey || c.group) : ""; }
    getChangeUnit(i) { var c = this._changes[i]; return c ? (c.unitKey || c.unit) : ""; }
    getChangeMethod(i) { var c = this._changes[i]; return c ? String(c.method) : ""; }
    getChangePcon(i) { var c = this._changes[i]; return c ? toModelText(c.pcon, this._scale()) : ""; }
    getChangePown(i) { var c = this._changes[i]; return c ? toModelText(c.pown, this._scale()) : ""; }
    getChangePgroup(i) { var c = this._changes[i]; return c ? String(this._pgroupOf(c.method)) : ""; }
    getDeleteCount() {
      if (!this._saving) { this._delSnap = this._deletes.slice(); }
      return this._delSnap.length;
    }
    getDeleteGroup(i) { var d = this._delSnap[i]; return d ? (d.groupKey || d.group) : ""; }
    getDeleteUnit(i) { var d = this._delSnap[i]; return d ? (d.unitKey || d.unit) : ""; }
    getLastChangeGroup() { return this._last.group; }
    getLastChangeUnit() { return this._last.unit; }
    getLastChangeField() { return this._last.field; }
    getLastChangeValue() { return String(this._last.value); }

    markSaved() {
      var scope = this._loaded;
      this._verify = {
        version: scope.version, period: scope.period,
        rows: this._changes.map(function (r) {
          return { group: r.group, unit: r.unit, method: r.method, pcon: r.pcon, pown: r.pown };
        }),
        deletes: this._delSnap.slice()
      };
      this._rows.forEach(function (r) { r.dirty = false; r.isNew = false; });
      this._deletes = [];
      this._changes = [];
      this._delSnap = [];
      /* WHAT WAS SAVED IS THE NEW STARTING POINT. Without this a Revert
         after a save brought back the values from before it, unmarked. */
      this._baseline = this._rows.map(function (r) {
        return { group: r.group, unit: r.unit, groupKey: r.groupKey, unitKey: r.unitKey,
                 method: r.method, pcon: r.pcon, pown: r.pown };
      });
      this._loadExpected = true;   // the reload that follows a save
      this._$("#saved").textContent = "Last saved " + new Date().toLocaleTimeString();
      this._log("saved: marked clean");
      this._render();
    }

    /* ---------- the progress dialog: master data load, refresh, save ----------
       A task is ACTIVE whether or not its dialog is SHOWN: with the
       dialog switched off in the panel the watchdog still runs and a
       failure is still reported. */
    _openTask(title, message, kind, timeoutMs) {
      var self = this;
      var show = this._props.showSaveDialog !== false;
      this._sv = { total: 0, done: 0, failed: 0, t0: Date.now(), log: [], active: true, shown: show, kind: kind };
      this._$("#stitle").textContent = title;
      this._$("#ssub").textContent = message;
      this._$("#sphase").textContent = "";
      this._$("#ssum").textContent = "";
      this._$("#sbar").classList.add("indet");
      this._$("#sbar").classList.remove("bad", "good");
      this._$("#sbar").firstElementChild.style.width = "0%";
      this._$("#slog").innerHTML = "";
      this._$("#slog").hidden = true;
      this._$("#sdisc").hidden = true;
      this._$("#sdisc").setAttribute("aria-expanded", "false");
      this._$("#sdisctx").textContent = "Show details";
      this._$("#sfoot").hidden = true;
      this._$("#sovl").hidden = !show;
      this.setBusy(true);
      window.clearTimeout(this._closeTimer);
      this._arm(kind, timeoutMs || 30000);
    }
    _arm(kind, ms) {
      var self = this;
      window.clearTimeout(this._taskTimer);
      this._taskTimer = window.setTimeout(function () {
        if (!self._sv.active || self._sv.kind !== kind) { return; }
        var secs = String(Math.round(ms / 1000));
        if (kind === "save") {
          self._finishSave(false, "No answer from the story script after " + secs +
            " s. The save may or may not have reached the model - choose Refresh and check before changing anything else.");
        } else {
          var m = "No response after " + secs +
            " s. Check that the story script event is wired and that the table has finished loading.";
          self._closeTask(false, m);
          self._fail(m, "load");
        }
      }, ms);
    }
    _hideTask() {
      this._sv.active = false;
      this._sv.shown = false;
      this._$("#sovl").hidden = true;
    }
    _closeTask(success, message) {
      window.clearTimeout(this._taskTimer);
      this.setBusy(false);
      if (!this._sv.active) { return; }
      var self = this;
      if (!this._sv.shown) { this._hideTask(); return; }
      this._$("#sbar").classList.remove("indet");
      this._$("#sbar").classList.add(success === false ? "bad" : "good");
      this._$("#sbar").firstElementChild.style.width = "100%";
      this._$("#sphase").textContent = success === false ? "Did not complete" : "Done";
      this._$("#ssub").textContent = String(message || "");
      if (this._sv.log.length) {
        this._renderSaveLog();
        this._$("#sdisc").hidden = false;
      }
      if (success === false) {
        this._dropScroll();
        /* only a failure needs acknowledging */
        this._$("#sfoot").hidden = false;
        return;
      }
      this._dropMsg("load");
      this._dropMsg("master");
      this._$("#sfoot").hidden = true;
      window.clearTimeout(this._closeTimer);
      this._closeTimer = window.setTimeout(function () { self._hideTask(); }, 500);
    }

    /* Save was pressed. The widget opens the dialog and starts the
       watchdog ITSELF, before the script runs: the button cannot fire
       twice, and a handler that never answers is reported. */
    _requestSave() {
      var self = this;
      if (this._saving || this._props.readOnly) { return; }
      if (!this.hasChanges() || this._blocking() > 0) { return; }
      this._changes = this._dirtyRows();
      this._delSnap = this._deletes.slice();
      this._conflicts = [];
      this._saving = true;
      this._holdScroll();
      var n = this._changes.length + this._delSnap.length;
      this._log("save: requested, " + String(this._changes.length) + " change(s) and " +
        String(this._delSnap.length) + " removal(s), scope " +
        scopeName(this._loaded.version) + " / " + scopeName(this._loaded.period));
      this._dropMsg("save");
      this._dropMsg("readback");
      this._openTask("Saving ownership data", "Writing to the model. Please wait.", "save", 60000 + n * 3000);
      this._$("#sphase").textContent = "Waiting for the story script";
      this._$("#ssum").textContent = n + " record(s) to write";
      this._sv.total = n;
      this._renderChrome();
      /* let the browser paint the dialog before the script blocks the thread */
      window.requestAnimationFrame(function () {
        window.setTimeout(function () { self._fire("onSaveRequested"); }, 0);
      });
    }
    beginSave(total) {
      var n = Number(total) || 0;
      if (!this._sv.active || this._sv.kind !== "save") {
        /* called by a script that was not started by the Save button */
        this._changes = this._dirtyRows();
        this._delSnap = this._deletes.slice();
        this._saving = true;
        this._openTask("Saving ownership data", "Writing to the model. Please wait.", "save", 60000 + n * 3000);
      }
      this._sv.total = n;
      this._$("#sphase").textContent = "Preparing";
      this._$("#ssum").textContent = n + " record(s) to write";
      this._log("save: script started, " + String(n) + " record(s)");
      this._renderChrome();
    }
    saveStep(text) {
      if (!this._sv.active) { return; }
      this._sv.log.push({ step: true, text: String(text) });
      this._$("#sphase").textContent = String(text);
      this._log("save: " + String(text));
    }
    saveDetail(text, ok) {
      if (!this._sv.active) { return; }
      this._sv.done = this._sv.done + 1;
      if (ok === false) { this._sv.failed = this._sv.failed + 1; }
      this._sv.log.push({ step: false, text: String(text), ok: ok !== false });
      this._log("save: record " + String(this._sv.done) + (ok === false ? " REJECTED" : " ok"), text);
    }
    endSave(success, message) {
      this._finishSave(success !== false && !this._sv.failed, message);
    }
    _finishSave(ok, message) {
      var self = this, sv = this._sv;
      window.clearTimeout(this._taskTimer);
      this._saving = false;
      this.setBusy(false);
      var text = String(message || (ok ? "Saved." : "The save did not complete."));
      this._log("save: finished " + (ok ? "ok" : "WITH ERRORS") + ", " + String(sv.done) + " of " +
        String(sv.total) + " processed, " + String(sv.failed) + " rejected");

      if (!ok) { this._fail(text, "save"); this._dropScroll(); }
      else { this._dropMsg("save"); }

      if (!sv.active || !sv.shown) {
        this._hideTask();
        if (ok) { this._toast(text, "success"); }
        this._renderChrome();
        return;
      }
      this._$("#sbar").classList.remove("indet");
      this._$("#sbar").classList.add(ok ? "good" : "bad");
      this._$("#sbar").firstElementChild.style.width = "100%";
      this._$("#stitle").textContent = ok ? "Save complete" : "Save did not complete";
      this._$("#ssub").textContent = text;
      this._$("#sphase").textContent = ok ? "All values written" : "Not saved";
      this._$("#ssum").textContent = sv.done + " of " + sv.total + " record(s) processed" +
        (sv.failed ? " · " + sv.failed + " rejected" : "");
      this._renderSaveLog();
      this._$("#sdisc").hidden = sv.log.length === 0;
      if (sv.failed) {
        this._$("#slog").hidden = false;
        this._$("#sdisc").setAttribute("aria-expanded", "true");
        this._$("#sdisctx").textContent = "Hide details";
      }
      this._renderChrome();
      if (!ok) {
        this._$("#sfoot").hidden = false;
        return;
      }
      this._$("#sfoot").hidden = true;
      window.clearTimeout(this._closeTimer);
      this._closeTimer = window.setTimeout(function () {
        /* a load that started meanwhile owns the dialog now */
        if (self._sv === sv) { self._hideTask(); }
      }, 1200);
    }
    _renderSaveLog() {
      var html = [];
      this._sv.log.forEach(function (e) {
        if (e.step) { html.push('<li class="step">' + esc(e.text) + "</li>"); }
        else {
          html.push("<li><span class=\"" + (e.ok ? "ok" : "no") + "\">" + (e.ok ? "OK" : "X") +
            '</span><span class="tx">' + esc(e.text) + "</span></li>");
        }
      });
      this._$("#slog").innerHTML = html.join("");
    }

    setBusy(b) { this._$("#busy").hidden = !b; }
    showMessage(text, kind) {
      if (kind === "error") { this._fail(String(text)); }
      else { this._toast(text, kind); }
    }

    /* ---------------- internals ---------------- */
    _$(s) { return this._sr.querySelector(s); }

    _methods() {
      var rs = this._props.recordSeparator || ";;";
      var fs = this._props.fieldSeparator || "~";
      var src = String(this._props.methodList || DEFAULT_METHODS);
      var key = rs + "\u0001" + fs + "\u0001" + src;
      if (this._methodCache.key === key) { return this._methodCache.list; }
      var out = [];
      src.split(rs).forEach(function (line) {
        if (!line) { return; }
        var p = line.split(fs);
        if (!p[0] || !p[0].trim()) { return; }
        /* id~text~pgroup, and optionally ~pcon~pown: percentages the
           METHOD fixes. An empty field fixes nothing. */
        var fix = function (v) {
          var n = typedPercent(v);
          return (isFinite(n) && n >= 0 && n <= 100) ? n : null;
        };
        var pgroup = (p[2] !== undefined && String(p[2]).trim() === "0") ? 0 : 1;
        out.push({
          id: p[0].trim(),
          text: (p[1] || p[0]).trim(),
          pgroup: pgroup,
          /* not consolidated: both are 0, whatever the list says */
          fixPcon: pgroup === 0 ? 0 : fix(p[3]),
          fixPown: pgroup === 0 ? 0 : fix(p[4]),
          /* what the method EXPECTS: a warning, never a lock. Nothing
             is expected of a field the method already fixes. */
          expPcon: (pgroup === 0 || fix(p[3]) !== null) ? null : fix(p[5]),
          expPown: (pgroup === 0 || fix(p[4]) !== null) ? null : fix(p[6])
        });
      });
      if (!out.length) { out = [{ id: DEFAULT_METHOD, text: "Full", pgroup: 1, fixPcon: null, fixPown: null, expPcon: null, expPown: null }]; }
      var ix = {};
      out.forEach(function (m) { ix[String(m.id)] = m; });
      this._methodCache = { key: key, list: out, ix: ix };
      return out;
    }
    _method(id) { this._methods(); return this._methodCache.ix[String(id)] || null; }

    /* PGROUP is never typed by the user - it is derived from the method. */
    _pgroupOf(methodId) {
      var m = this._method(methodId);
      return m ? m.pgroup : 1;
    }
    _isNotConsolidated(methodId) { return this._pgroupOf(methodId) === 0; }
    /* What the method FIXES: { pcon, pown }, each a number or null. */
    _fixed(methodId) {
      var m = (methodId === "" || methodId === null || methodId === undefined) ? null : this._method(methodId);
      return m ? { pcon: m.fixPcon, pown: m.fixPown } : { pcon: null, pown: null };
    }
    /* OWNERSHIP % IS NOT ABOVE CONSOLIDATION % (owner, 2026-09-27). Not
       applied where the method itself fixes the consolidation %: that
       is the method's statement, and the list is the place to change it. */
    _over(r) {
      if (this._fixed(r.method).pcon !== null) { return false; }
      return (Number(r.pown) || 0) > (Number(r.pcon) || 0) + 0.0000001;
    }
    /* What the method EXPECTS and the entry does not hold:
       { pcon, pown }, each the expected number or null when all is well.
       A WARNING (owner, 2026-09-27: "we should add a warning if Holding
       or Full % consolidation is not 100. That is the expectation").
       It never blocks a save: an expectation has exceptions, and the
       person maintaining ownership is the one who knows them. */
    _offExpect(r) {
      var m = (r.method === "") ? null : this._method(r.method);
      var out = { pcon: null, pown: null };
      if (!m) { return out; }
      if (m.expPcon !== null && m.expPcon !== undefined && Math.abs(r.pcon - m.expPcon) > 0.0000001) { out.pcon = m.expPcon; }
      if (m.expPown !== null && m.expPown !== undefined && Math.abs(r.pown - m.expPown) > 0.0000001) { out.pown = m.expPown; }
      return out;
    }
    /* The model holds a percentage other than the one the method fixes. */
    _offFix(r) {
      var f = this._fixed(r.method);
      return (f.pcon !== null && Math.abs(r.pcon - f.pcon) > 0.0000001) ||
             (f.pown !== null && Math.abs(r.pown - f.pown) > 0.0000001);
    }
    _methodText(id) {
      var m = this._method(id);
      return m ? m.text : id;
    }
    _fmt(v) {
      var d = parseInt(this._props.decimals, 10);
      return isFinite(v) ? Number(v).toFixed(isNaN(d) ? 2 : d) : "";
    }
    _fire(name) { this.dispatchEvent(new Event(name)); }
    /* For what needs no answer: "added", "removed", "reverted". Anything
       that went wrong goes through _fail and stays. */
    _toast(text, kind) {
      if (kind === "error") { this._fail(String(text)); return; }
      var t = this._$("#toast");
      t.textContent = text;
      t.className = "toast show" + (kind === "success" ? " good" : "");
      clearTimeout(this._tt);
      this._tt = setTimeout(function () { t.classList.remove("show"); }, 2600);
    }
    _confirm(title, text, okLabel, fn) {
      this._$("#ctitle").textContent = title;
      this._$("#ctext").textContent = text;
      this._$("#cok").textContent = okLabel;
      this._confirmFn = fn;
      this._$("#covl").hidden = false;
      var b = this._$("#ccancel"), me = this;
      window.setTimeout(function () { me._focus(b); }, 30);
    }
    _pendingCount() { return this._dirtyRows().length + this._deletes.length; }
    /* What stops a save: a percentage that could not be read, or a
       changed record with no method. */
    _blocking() {
      var self = this;
      return this._rows.filter(function (r) {
        return r.invalid.pcon || r.invalid.pown ||
               (r.dirty && (r.method === "" || self._over(r)));
      }).length;
    }
    /* `fire` dispatches the event with its name QUOTED at the call site,
       so tools/audit-events.cjs can check it against the manifest. */
    _reload(title, what, fire) {
      this._loadExpected = true;
      this._log("load: " + what);
      this._openTask(title, "Reading ownership data", "refresh", 30000);
      window.requestAnimationFrame(function () {
        window.setTimeout(fire, 0);
      });
    }

    _wire() {
      var self = this;

      this._$("#add").addEventListener("click", function () { self._openDialog(); });
      this._$("#del").addEventListener("click", function () { self._remove(Array.from(self._sel)); });
      this._$("#refresh").addEventListener("click", function () {
        if (self._saving) { return; }
        var n = self._pendingCount();
        self._holdScroll();
        var again = function () { self._fire("onRefreshRequested"); };
        if (n === 0) { self._reload("Reloading from the model", "refresh", again); return; }
        /* Go refused with unsaved changes; Refresh went ahead and the
           reload replaced them without a word. */
        self._confirm("Discard changes and reload",
          n + " unsaved change(s) will be discarded and the table read again from the model.",
          "Discard and reload",
          function () {
            self._rows = self._baseline.map(function (b) { return self._row(b, false); });
            self._deletes = [];
            self._render();
            self._reload("Reloading from the model", "refresh", again);
          });
      });

      this._$("#fver").addEventListener("click", function () { self._openPicker("ver"); });
      this._$("#fper").addEventListener("click", function () { self._openPicker("per"); });
      this._$("#fgrp").addEventListener("click", function () { self._openPicker("grp"); });
      this._$("#funt").addEventListener("click", function () { self._openPicker("unt"); });
      this._$("#pallcb").addEventListener("change", function (e) {
        var sel = self._sel4(self._pick);
        var vis = self._pickerVisibleIds();
        if (e.target.checked) {
          vis.forEach(function (id) { if (sel.indexOf(id) < 0) { sel.push(id); } });
        } else {
          vis.forEach(function (id) {
            var at = sel.indexOf(id);
            if (at >= 0) { sel.splice(at, 1); }
          });
        }
        self._renderPicker(self._$("#pq").value);
      });
      this._$("#pnone").addEventListener("click", function () {
        self._sel4(self._pick).length = 0;
        self._renderPicker(self._$("#pq").value);
      });
      this._$("#pcancel").addEventListener("click", function () { self._cancelPicker(); });
      this._$("#pok").addEventListener("click", function () {
        self._closePicker();
        self._renderFilters();
      });
      this._$("#pclose").addEventListener("click", function () { self._cancelPicker(); });
      this._$("#povl").addEventListener("mousedown", function (e) {
        if (e.target === self._$("#povl")) { self._cancelPicker(); }
      });
      this._$("#pq").addEventListener("input", function (e) { self._renderPicker(e.target.value); });
      this._$("#plist").addEventListener("click", function (e) {
        var it = e.target.closest(".pitem");
        if (!it) { return; }
        var id = it.getAttribute("data-id");

        /* unit hierarchy: expand, or toggle every base unit below a node */
        if (self._pick === "unt" && self._units.length) {
          if (e.target.closest("[data-tw]")) {
            if (self._pexp.has(id)) { self._pexp.delete(id); } else { self._pexp.add(id); }
            self._renderPicker(self._$("#pq").value);
            return;
          }
          var usel = self._sel4("unt");
          var targets = self._children(id).length ? self._leaves(id) : [id];
          var allOn = targets.every(function (x) { return usel.indexOf(x) >= 0; });
          targets.forEach(function (x) {
            var pos = usel.indexOf(x);
            if (allOn) { if (pos >= 0) { usel.splice(pos, 1); } }
            else if (pos < 0) { usel.push(x); }
          });
          self._renderPicker(self._$("#pq").value);
          self._renderFilters();
          return;
        }

        if (self._isMulti(self._pick)) {
          var sel = self._sel4(self._pick);
          var at = sel.indexOf(id);
          if (at >= 0) { sel.splice(at, 1); } else { sel.push(id); }
          self._renderPicker(self._$("#pq").value);
          self._renderFilters();
          return;
        }
        if (self._pick === "ver") { self._filter.version = id; }
        else { self._filter.period = id; }
        self._closePicker();
        self._renderFilters();
      });

      this._$("#fapply").addEventListener("click", function () {
        if (self._saving) { return; }
        if (self.hasChanges()) {
          self._say("warn", "There are unsaved changes. Save or revert them before reading another scope.", "gochanges");
          return;
        }
        self._dropMsg("gochanges");
        self.applyFilterSelection();
        self._holdScroll(0);
        self._reload("Applying filters", "filters", function () { self._fire("onFilterChanged"); });
      });

      this._$("#revert").addEventListener("click", function () {
        self._confirm("Revert changes",
          self._pendingCount() + " unsaved change(s) will be discarded and the table reset to the last loaded state.",
          "Revert",
          function () { self.revertChanges(); });
      });
      this._$("#ccancel").addEventListener("click", function () {
        self._confirmFn = null;
        self._$("#covl").hidden = true;
      });
      this._$("#cok").addEventListener("click", function () {
        var fn = self._confirmFn;
        self._confirmFn = null;
        self._$("#covl").hidden = true;
        if (fn) { fn(); }
      });
      this._$("#save").addEventListener("click", function () { self._requestSave(); });

      this._$("#sclose").addEventListener("click", function () { self._hideTask(); });
      this._$("#sdisc").addEventListener("click", function () {
        var open = self._$("#sdisc").getAttribute("aria-expanded") === "true";
        self._$("#sdisc").setAttribute("aria-expanded", String(!open));
        self._$("#slog").hidden = open;
        self._$("#sdisctx").textContent = open ? "Show details" : "Hide details";
      });
      this._$("#strips").addEventListener("click", function (e) {
        var b = e.target.closest("[data-dismiss]");
        if (b) { self._dropMsg(b.getAttribute("data-dismiss")); }
      });
      this._$("#selall").addEventListener("change", function (e) {
        if (self._props.readOnly) { e.target.checked = false; return; }
        self._visible().forEach(function (r) {
          if (e.target.checked) { self._sel.add(r.key); } else { self._sel.delete(r.key); }
        });
        self._render();
      });

      this._$("#tbody").addEventListener("click", function (e) {
        var el = e.target.closest("[data-act]");
        if (!el) { return; }
        var act = el.getAttribute("data-act");
        if (act === "toggle") {
          var g = el.getAttribute("data-group");
          if (self._collapsed.has(g)) { self._collapsed.delete(g); } else { self._collapsed.add(g); }
          self._render();
        } else if (act === "select") {
          var r = self._rowOf(el); if (!r) { return; }
          if (el.checked) { self._sel.add(r.key); } else { self._sel.delete(r.key); }
          el.closest("tr").classList.toggle("sel", el.checked);
          self._renderChrome();
        } else if (act === "del") {
          var rr = self._rowOf(el); if (rr) { self._remove([rr.key]); }
        }
      });

      this._$("#tbody").addEventListener("change", function (e) { self._cellChanged(e.target); });

      this._$("#dclose").addEventListener("click", function () { self._closeDialog(); });
      this._$("#dcancel").addEventListener("click", function () { self._closeDialog(); });
      this._$("#dq").addEventListener("input", function (e) { self._dlg.q = e.target.value.trim().toLowerCase(); self._tree(); });
      this._$("#dgrp").addEventListener("change", function (e) {
        self._dlg.group = e.target.value; self._tree(); self._updateDlgFooter();
      });
      this._$("#dall").addEventListener("change", function (e) {
        var vis = self._visibleTreeIds();
        vis.forEach(function (id) {
          var m = self._unitIx[id];
          if (!m || m.isNode) { return; }
          if (e.target.checked) { self._dlg.picked.add(id); }
          else { self._dlg.picked.delete(id); }
        });
        self._tree(); self._updateDlgFooter();
      });
      this._$("#dnone").addEventListener("click", function () {
        self._dlg.picked = new Set();
        self._$("#dall").checked = false;
        self._tree(); self._updateDlgFooter();
      });
      this._$("#tree").addEventListener("click", function (e) {
        var item = e.target.closest(".ti"); if (!item) { return; }
        var id = item.getAttribute("data-id");
        if (e.target.closest("[data-tw]")) {
          if (self._dlg.exp.has(id)) { self._dlg.exp.delete(id); } else { self._dlg.exp.add(id); }
          self._tree(); return;
        }
        if (self._dlg.picked.has(id)) { self._dlg.picked.delete(id); }
        else { self._dlg.picked.add(id); }
        self._tree();
        self._updateDlgFooter();
      });
      this._$("#dadd").addEventListener("click", function () { self._addSelected(); });
      /* A KEY TYPED IN A FIELD BELONGS TO THE FIELD. The widget sits in
         SAC's own page, which listens for keys too: Enter in a cell
         reached it and the page scrolled to the top (owner, 2026-09-27).
         Keys pressed in a field, a list or a dropdown of this widget
         stop at the widget. Escape and Tab are let through: the first
         closes things, here and in SAC, and the second has to be able
         to leave the widget. */
      var own = function (e) {
        var t = e.target, tag = t && t.tagName;
        if (tag !== "INPUT" && tag !== "SELECT" && tag !== "TEXTAREA") { return false; }
        if (e.key !== "Escape" && e.key !== "Tab") { e.stopPropagation(); }
        return true;
      };
      this._sr.addEventListener("keyup", own);
      this._sr.addEventListener("keypress", own);
      this._sr.addEventListener("keydown", function (e) {
        if (own(e) && e.key === "Enter" && e.target.closest("#tbody") && e.target.tagName === "INPUT" &&
            e.target.type !== "checkbox") {
          e.preventDefault();
          self._enter(e.target, e.shiftKey === true);
          return;
        }
        if (e.key !== "Escape") { return; }
        /* Escape is Cancel: it discards a picker's pending selection */
        if (!self._$("#povl").hidden) { self._cancelPicker(); }
        else if (!self._$("#covl").hidden) { self._confirmFn = null; self._$("#covl").hidden = true; }
        else if (!self._$("#ovl").hidden) { self._closeDialog(); }
      });
    }

    /* A cell of the table was changed - by the browser's change event,
       or by Enter, which takes the value itself (see _enter). */
    _cellChanged(target) {
      var self = this;
      var el = target.closest("[data-act]");
      if (!el) { return; }
      var r = self._rowOf(el); if (!r) { return; }
      var act = el.getAttribute("data-act");
      if (act !== "method" && act !== "pcon" && act !== "pown") { return; }
      if (self._props.readOnly || self._saving) { self._patchRow(r); return; }
      if (act === "method") {
        var was = self._fixed(r.method);
        r.method = el.value;
        var now = self._fixed(r.method);
        r.prev = r.prev || {};
        ["pcon", "pown"].forEach(function (f) {
          if (now[f] !== null) {
            /* remember what the user had, then take what the method fixes */
            if (was[f] === null) { r.prev[f] = r[f]; }
            r[f] = now[f];
            delete r.invalid[f]; delete r.raw[f];
          } else if (was[f] !== null) {
            /* free again: restore, or 100 if there is nothing to restore */
            r[f] = (r.prev[f] === undefined || r.prev[f] === 0) ? 100 : r.prev[f];
          }
        });
        r.dirty = true;
        self._last = { group: r.group, unit: r.unit, field: "METHOD", value: r.method };
        self._fire("onOwnershipChanged");
      } else {
        if (self._fixed(r.method)[act] !== null) { self._patchRow(r); return; }
        var v = typedPercent(el.value);
        if (!isFinite(v) || v < 0 || v > 100) {
          /* WHAT WAS TYPED STAYS IN THE FIELD, marked - the old value
             with a red border said nothing about what was wrong */
          r.invalid[act] = true;
          r.raw[act] = String(el.value);
        } else {
          delete r.invalid[act]; delete r.raw[act];
          r[act] = roundTo(v, 6); r.dirty = true;
          self._last = { group: r.group, unit: r.unit, field: act.toUpperCase(), value: r[act] };
          self._fire("onOwnershipChanged");
        }
      }
      /* THE ROW IS PATCHED, NOT THE TABLE REBUILT: a rebuild destroyed
         the field the Tab key was moving to, so every value typed cost
         the keyboard its place. */
      self._patchRow(r);
      self._renderChrome();
    }
    /* ENTER TAKES THE VALUE AND MOVES DOWN, as it does in a spreadsheet
       and in SAC's own tables; Shift+Enter moves up. The focus goes to
       the same column of the next entry that can be typed in, skipping
       group rows and locked fields, and stays where it is on the last
       one - it never leaves the table, because a focus that lands on
       the page is what let the page react to the key. */
    _enter(el, up) {
      var act = el.getAttribute("data-act");
      var r = this._rowOf(el);
      if (!r || !act) { return; }
      var shown = r.invalid[act] === true ? r.raw[act] : this._fmt(r[act]);
      if (String(el.value) !== String(shown)) {
        this._cellChanged(el);
      }
      var tr = el.closest("tr"), next = null;
      for (var n = up ? tr.previousElementSibling : tr.nextElementSibling; n; n = up ? n.previousElementSibling : n.nextElementSibling) {
        var f = n.querySelector('[data-act="' + act + '"]');
        if (f && !f.disabled) { next = f; break; }
      }
      var to = next || el;
      this._focus(to);
      this._reveal(to);
      if (to.select) { to.select(); }
    }
    /* FOCUS WITHOUT SCROLLING THE PAGE. focus() makes the browser scroll
       EVERY scrolling ancestor until the element is in view - the table,
       and then SAC's own page, which is what the owner saw as "it
       scrolls to the top of the screen". Seen in a real browser on
       2026-09-27: the page moved 120px on an Enter that should have
       moved one row. The widget scrolls its own table (_reveal) and
       leaves everything outside it alone. */
    _focus(el) {
      if (!el) { return; }
      try { el.focus({ preventScroll: true }); }
      catch (e) { el.focus(); }
    }
    /* Bring a cell into the visible part of the table - under the sticky
       header, above the lower edge - by moving the table only. */
    _reveal(el) {
      var sc = this._$(".lscroll");
      var box = sc.getBoundingClientRect();
      var tr = el.closest("tr") || el;
      var r = tr.getBoundingClientRect();
      var head = this._$("thead");
      var top = box.top + (head ? head.getBoundingClientRect().height : 0);
      if (r.top < top) { sc.scrollTop = sc.scrollTop - (top - r.top); }
      else if (r.bottom > box.bottom) { sc.scrollTop = sc.scrollTop + (r.bottom - box.bottom); }
    }
    _rowOf(el) {
      var tr = el.closest("tr[data-key]");
      if (!tr) { return null; }
      var k = tr.getAttribute("data-key");
      return this._rows.filter(function (r) { return r.key === k; })[0];
    }

    _visible() {
      var gs = this._applied.groups, us = this._applied.units;
      return this._rows.filter(function (r) {
        if (gs.length && gs.indexOf(r.group) < 0) { return false; }
        if (us.length && us.indexOf(r.unit) < 0) { return false; }
        return true;
      });
    }

    _remove(keys) {
      if (this._props.readOnly || this._saving) { return; }
      var self = this, gone = this._rows.filter(function (r) { return keys.indexOf(r.key) >= 0; });
      if (!gone.length) { return; }
      gone.forEach(function (r) {
        if (!r.isNew) {
          self._deletes.push({
            group: r.group, unit: r.unit,
            groupKey: r.groupKey || r.group, unitKey: r.unitKey || r.unit
          });
        }
      });
      this._rows = this._rows.filter(function (r) { return keys.indexOf(r.key) < 0; });
      keys.forEach(function (k) { self._sel.delete(k); });
      this._last = { group: gone[0].group, unit: gone.length === 1 ? gone[0].unit : "", field: "REMOVED", value: "" };
      this._fire("onRowRemoved");
      this._toast(gone.length === 1 ? "Removed " + gone[0].unit : "Removed " + gone.length + " entries");
      this._render();
    }

    /* ---------------- value help ---------------- */
    _roots() { return this._rootList; }
    _children(id) { return this._kidsIx[id] || []; }
    /* every base (childless) member below id; the member itself when it
       has no children. Cached until the units change. */
    _leaves(id) {
      var hit = this._leafCache[id];
      if (hit) { return hit; }
      var self = this, acc = [], trail = {};
      var walk = function (x) {
        if (trail[x]) { return; }      // a parent loop in the master data
        trail[x] = true;
        var kids = self._children(x);
        if (!kids.length) { acc.push(x); return; }
        for (var i = 0; i < kids.length; i++) { walk(kids[i].id); }
      };
      walk(id);
      this._leafCache[id] = acc;
      return acc;
    }
    /* Add Unit inherits the unit scope last applied with Go. With no
       applied unit filter, all base units remain available. Parent nodes
       remain visible only when they lead to at least one in-scope base unit. */
    _addScopeLeaves(id) {
      var leaves = this._leaves(id);
      var scope = this._applied.units || [];
      if (!scope.length) { return leaves; }
      return leaves.filter(function (leafId) { return scope.indexOf(leafId) >= 0; });
    }
    _treeMatches() {
      var scope = this._applied.units || [];
      var inScope = scope.length ? function (id) { return scope.indexOf(id) >= 0; } : null;
      return this._matchSet(this._dlg.q, inScope);
    }
    _usedIn(group) {
      var used = {};
      this._rows.forEach(function (r) { if (r.group === group) { used[r.unit] = true; } });
      return used;
    }

    /* every in-scope base unit implied by the current picks, deduplicated */
    _pickedUnits() {
      var self = this, out = [], seen = {};
      this._dlg.picked.forEach(function (id) {
        self._addScopeLeaves(id).forEach(function (x) {
          if (!seen[x]) { seen[x] = true; out.push(x); }
        });
      });
      return out;
    }
    _updateDlgFooter() {
      var units = this._pickedUnits();
      var used = this._usedIn(this._dlg.group);
      var fresh = units.filter(function (x) { return !used[x]; });
      var txt;
      if (!units.length) { txt = "No selection"; }
      else if (units.length === 1) {
        var m = this._unitIx[units[0]] || { description: "" };
        txt = "Selected: " + units[0] + " - " + m.description +
          (fresh.length ? "" : " (already in " + this._dlg.group + ")");
      } else {
        txt = units.length + " unit(s) selected · " + fresh.length + " new";
      }
      this._$("#dsel").textContent = txt;
      this._$("#dadd").disabled = fresh.length === 0;
      this._$("#dadd").textContent = fresh.length > 1 ? "Add " + fresh.length + " units" : "Add";
    }

    _openDialog() {
      if (this._props.readOnly || this._saving) { return; }
      this._dlg.picked = new Set(); this._dlg.q = "";
      this._$("#dall").checked = false;
      this._$("#dq").value = "";
      this._$("#dsel").textContent = "No selection";
      this._$("#dadd").disabled = true;
      this._$("#dadd").textContent = "Add";
      var g = this._$("#dgrp");
      /* The target group list inherits the group scope last applied with Go. */
      var scopedGroups = this._applied.groups.length
        ? this._groups.filter(function (x) { return this._applied.groups.indexOf(x.id) >= 0; }, this)
        : this._groups.slice();
      g.innerHTML = scopedGroups.map(function (x) {
        return '<option value="' + esc(x.id) + '">' + esc(x.id) +
          (x.description ? " - " + esc(x.description) : "") + "</option>";
      }).join("");
      if (this._dlg.group && scopedGroups.some(function (x) { return x.id === this._dlg.group; }, this)) {
        g.value = this._dlg.group;
      }
      this._dlg.group = g.value || "";
      var self = this;
      this._roots().forEach(function (r) { self._dlg.exp.add(r.id); });
      this._$("#ovl").hidden = false;
      this._tree();
    }
    _closeDialog() { this._$("#ovl").hidden = true; }

    _visibleTreeIds() {
      var self = this, out = [], ok = this._treeMatches();
      var walk = function (u) {
        if (!ok[u.id]) { return; }
        out.push(u.id);
        var kids = self._children(u.id);
        var exp = self._dlg.exp.has(u.id) || !!self._dlg.q;
        if (kids.length && exp) { kids.forEach(walk); }
      };
      this._roots().forEach(walk);
      return out;
    }
    _tree() {
      var host = this._$("#tree"), self = this, html = [];
      var ok = this._treeMatches();
      var used = this._usedIn(this._dlg.group);
      var walk = function (u, depth) {
        if (!ok[u.id]) { return; }
        var kids = self._children(u.id);
        var exp = self._dlg.exp.has(u.id) || !!self._dlg.q;
        var picked = self._dlg.picked.has(u.id);
        html.push(
          '<button class="ti' + (u.isNode ? " isnode" : "") + '" role="treeitem" data-id="' + esc(u.id) +
          '" data-exp="' + exp + '" aria-selected="' + picked +
          '" style="padding-left:' + (0.75 + depth * 1.125) + 'rem">' +
          '<input type="checkbox" class="tcb" tabindex="-1"' + (picked ? " checked" : "") + ">" +
          (kids.length ? ICON_CHEVRON : '<span class="lf"></span>') +
          '<span class="tl"><b>' + esc(u.id) + "</b> <span>" + esc(u.description) + "</span></span>" +
          (u.isNode ? '<span class="chip node">Node &middot; ' + self._addScopeLeaves(u.id).length + " units</span>" : "") +
          (used[u.id] ? '<span class="chip">Already added</span>' : "") +
          "</button>"
        );
        if (kids.length && exp) { kids.forEach(function (c) { walk(c, depth + 1); }); }
      };
      this._roots().forEach(function (r) { walk(r, 0); });
      host.innerHTML = html.join("") ||
        '<div class="empty">No consolidation unit matches the search.</div>';
    }

    _addSelected() {
      var grp = this._dlg.group, self = this;
      if (!grp || this._props.readOnly || this._saving) { return; }
      var targets = this._pickedUnits();
      if (!targets.length) { return; }
      var id = targets.length === 1 ? targets[0] : (targets.length + " units");
      var used = this._usedIn(grp);
      var method = String(this._props.defaultMethod || DEFAULT_METHOD);
      var fx = this._fixed(method);
      var startPcon = fx.pcon === null ? 100 : fx.pcon;
      var startPown = fx.pown === null ? 100 : fx.pown;

      var added = 0, skipped = 0;
      targets.forEach(function (unit) {
        if (used[unit]) { skipped = skipped + 1; return; }
        /* REMOVED AND ADDED AGAIN before saving: the entry is CHANGED,
           not deleted and created. Sending both left the result to the
           order the script happened to write them in. */
        var back = null;
        self._deletes = self._deletes.filter(function (d) {
          if (d.group === grp && d.unit === unit) { back = d; return false; }
          return true;
        });
        var row = self._row({
          group: grp, unit: unit,
          groupKey: back ? back.groupKey : grp,
          unitKey: back ? back.unitKey : fromTemplate(self._unitKeyTpl, unit),
          method: method, pcon: startPcon, pown: startPown
        }, true);
        if (back) { row.isNew = false; }
        self._rows.push(row);
        added = added + 1;
      });

      if (added === 0) {
        this._toast(targets.length === 1 ? id + " already exists in " + grp
                                         : "All " + targets.length + " selected units are already in " + grp, "info");
        return;
      }

      this._collapsed.delete(grp);
      this._closeDialog();
      this._last = { group: grp, unit: targets.length === 1 ? targets[0] : "", field: "NEW", value: method };
      this._fire("onRowAdded");

      var vals = this._fmt(startPcon) + " / " + this._fmt(startPown);
      var msg;
      if (targets.length === 1) {
        msg = "Added " + id + " with method " + this._methodText(method) + " and " + vals;
      } else {
        msg = "Added " + added + " unit(s) to " + grp +
          (skipped ? " (" + skipped + " already present)" : "") +
          " with method " + this._methodText(method) + " and " + vals;
      }
      this._toast(msg, "success");
      this._render();
    }

    /* ---------------- render ---------------- */
    _methodOptions(r) {
      var cur = String(r.method), known = false;
      var html = this._methods().map(function (x) {
        var on = String(x.id) === cur;
        if (on) { known = true; }
        return '<option value="' + esc(x.id) + '"' + (on ? " selected" : "") +
          ">" + esc(x.id) + " - " + esc(x.text) + "</option>";
      }).join("");
      if (cur === "") { return '<option value="" selected>Not set</option>' + html; }
      if (!known) {
        return '<option value="' + esc(cur) + '" selected>' + esc(cur) + " - not in the method list</option>" + html;
      }
      return html;
    }
    _rowHtml(r) {
      var p = this._props;
      var m = this._unitIx[r.unit] || { description: "", isNode: false };
      var none = r.method === "";
      var pg = none ? 1 : this._pgroupOf(r.method);
      var off = p.readOnly || this._saving;
      var fixed = this._fixed(r.method);
      var over = this._over(r);
      var nci = (Number(r.pcon) || 0) - (Number(r.pown) || 0);
      var on = this._sel.has(r.key);
      var pct = function (f) {
        var bad = r.invalid[f] === true;
        var tip = this._pctTitle(r, f, fixed, over);
        var red = bad || (over && f === "pown");
        var amber = !red && this._offExpect(r)[f] !== null;
        return '<td class="r"><input class="fld num' + (red ? " bad" : "") + (amber ? " warn" : "") + '" data-act="' + f + '" value="' +
          esc(bad ? r.raw[f] : this._fmt(r[f])) + '"' + ((off || fixed[f] !== null) ? " disabled" : "") +
          (tip ? ' title="' + esc(tip) + '"' : "") +
          ' inputmode="decimal" aria-label="' + (f === "pcon" ? "Consolidation %" : "Ownership %") + '"></td>';
      }.bind(this);
      return '<tr data-key="' + r.key + '" class="' + (on ? "sel " : "") + (r.dirty ? "dirty" : "") + '">' +
        '<td><input type="checkbox" data-act="select" aria-label="Select entry"' + (on ? " checked" : "") +
          (off ? " disabled" : "") + "></td>" +
        '<td class="' + (p.grouped ? "unit" : "") + '"><span class="uid">' + esc(r.unit) +
          '</span> <span class="udesc">' + esc(m.description) + "</span>" +
          (m.isNode ? '<span class="chip node">Node</span>' : "") +
          (r.isNew ? '<span class="chip new">New</span>' : "") +
          (p.grouped ? "" : '<span class="chip">' + esc(r.group) + "</span>") + "</td>" +
        '<td><select class="fld' + (none ? " bad" : "") + '" data-act="method" aria-label="Consolidation method"' +
          (none ? ' title="The model holds no method for this entry"' : "") +
          (off ? " disabled" : "") + ">" + this._methodOptions(r) + "</select></td>" +
        pct("pcon") + pct("pown") +
        (p.showNci ? '<td class="r"><span class="nci' + (nci < 0 ? " neg" : "") + '" data-nci="1">' + this._fmt(nci) + "</span></td>" : "") +
        (p.showPgroup ? '<td class="r"><span class="pg' + (pg === 0 ? " off" : "") + '" data-pg="1">' + pg + "</span></td>" : "") +
        '<td class="r"><button class="btn tr ic" data-act="del" title="Remove entry" aria-label="Remove entry"' +
          (off ? " disabled" : "") + ">" + ICON_BIN + "</button></td>" +
        '<td class="fill"></td>' +
        "</tr>";
    }
    _pctTitle(r, f, fixed, over) {
      if (r.invalid[f] === true) { return "Enter a percentage between 0 and 100"; }
      if (over && f === "pown") { return "Ownership % cannot be above consolidation %"; }
      if (fixed[f] === null) {
        var exp = this._offExpect(r)[f];
        if (exp === null) { return ""; }
        return this._methodText(r.method) + " normally has " + (f === "pcon" ? "a consolidation" : "an ownership") +
          " % of " + this._fmt(exp) + ". It can be saved as it is.";
      }
      if (r.method !== "" && this._pgroupOf(r.method) === 0) { return LOCKED_TITLE; }
      return "Fixed at " + this._fmt(fixed[f]) + " by the consolidation method";
    }
    /* One row, in place. Every element that was there is still there
       afterwards, so the focus is where the user left it. */
    _patchRow(r) {
      var tr = this._sr.querySelector('tr[data-key="' + r.key + '"]');
      if (!tr) { return; }
      var self = this, p = this._props;
      var none = r.method === "";
      var pg = none ? 1 : this._pgroupOf(r.method);
      var off = p.readOnly || this._saving;
      var fixed = this._fixed(r.method);
      var over = this._over(r);
      tr.classList.toggle("dirty", r.dirty === true);
      var sel = tr.querySelector('[data-act="method"]');
      if (sel) {
        if (sel.value !== String(r.method)) { sel.innerHTML = this._methodOptions(r); }
        else if (!none) {
          var blank = sel.querySelector('option[value=""]');
          if (blank) { sel.removeChild(blank); }
        }
        sel.classList.toggle("bad", none);
        if (none) { sel.title = "The model holds no method for this entry"; } else { sel.removeAttribute("title"); }
      }
      ["pcon", "pown"].forEach(function (f) {
        var el = tr.querySelector('[data-act="' + f + '"]');
        if (!el) { return; }
        var bad = r.invalid[f] === true;
        el.value = bad ? r.raw[f] : self._fmt(r[f]);
        var red = bad || (over && f === "pown");
        el.classList.toggle("bad", red);
        el.classList.toggle("warn", !red && self._offExpect(r)[f] !== null);
        el.disabled = off || fixed[f] !== null;
        var tip = self._pctTitle(r, f, fixed, over);
        if (tip) { el.title = tip; } else { el.removeAttribute("title"); }
      });
      var nci = (Number(r.pcon) || 0) - (Number(r.pown) || 0);
      var n = tr.querySelector("[data-nci]");
      if (n) { n.textContent = this._fmt(nci); n.classList.toggle("neg", nci < 0); }
      var g = tr.querySelector("[data-pg]");
      if (g) { g.textContent = String(pg); g.classList.toggle("off", pg === 0); }
    }

    /* THE TABLE STAYS WHERE THE USER LEFT IT (owner, 2026-09-27: "after
       changing a row and saving, the table scrolls to the first row").
       A save ends in a reload, the reload redraws every row, and a
       table that is emptied and filled again is back at the top. The
       position is HELD from the moment Save or Refresh is pressed until
       the rows that answer it are drawn - across every redraw in
       between - and every other redraw keeps the position it finds.
       Go is different: another scope is another list, and starts at
       the top. */
    _holdScroll(top) {
      var sc = this._$(".lscroll");
      this._scrollHold = { top: top === undefined ? sc.scrollTop : top, left: top === undefined ? sc.scrollLeft : 0 };
    }
    _dropScroll() { this._scrollHold = null; }
    _render() {
      var self = this, p = this._props;
      var sc = this._$(".lscroll");
      var keep = this._scrollHold || { top: sc.scrollTop, left: sc.scrollLeft };
      this._$("#title").textContent = p.widgetTitle || "Consolidation Ownership";
      this._$("#scope").textContent = p.scopeText || "";
      this._$("#fbar").hidden = p.showFilterBar === false;
      this._$("#thnci").style.display = p.showNci ? "" : "none";
      this._$("#thpg").style.display = p.showPgroup ? "" : "none";
      /* ONE <col> PER COLUMN THAT IS SHOWN. With a fixed list of nine, a
         hidden column left its <col> behind: the cells shifted one to
         the left, the last column - the one that takes the spare width -
         had no cells, and every row line stopped short of the card. */
      this._$("#cols").innerHTML =
        '<col style="width:2.75rem"><col style="width:1%"><col style="width:1%">' +
        '<col style="width:8rem"><col style="width:8rem">' +
        (p.showNci ? '<col style="width:8rem">' : "") +
        (p.showPgroup ? '<col style="width:6rem">' : "") +
        '<col style="width:1%"><col style="width:100%">';

      var list = this._visible(), body = [];

      if (p.grouped) {
        var by = {}, seenOrder = [];
        list.forEach(function (r) {
          if (!by[r.group]) { by[r.group] = []; seenOrder.push(r.group); }
          by[r.group].push(r);
        });
        var order = this._groups.map(function (g) { return g; });
        var known = {};
        order.forEach(function (g) { known[g.id] = true; });
        /* a group with entries but no master data row is still shown */
        seenOrder.forEach(function (id) { if (!known[id]) { order.push({ id: id, description: "" }); } });
        order.forEach(function (g) {
          var gr = by[g.id];
          if (!gr || !gr.length) { return; }
          var open = !self._collapsed.has(g.id);
          body.push('<tr class="grp"><td colspan="9">' +
            '<button class="gt" data-act="toggle" data-group="' + esc(g.id) + '" aria-expanded="' + open + '">' +
            '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6l4 4 4-4"/></svg>' +
            esc(g.id) + '<span class="udesc" style="font-weight:400">' + esc(g.description) + "</span></button>" +
            '<span class="hint">' + gr.length + " unit" + (gr.length === 1 ? "" : "s") + "</span></td></tr>");
          if (open) { gr.forEach(function (r) { body.push(self._rowHtml(r)); }); }
        });
      } else {
        list.forEach(function (r) { body.push(self._rowHtml(r)); });
      }
      this._$("#tbody").innerHTML = body.join("");

      this._$("#empty").innerHTML = list.length ? "" :
        '<div class="empty"><strong>No ownership entries in this scope</strong>' +
        "Adjust the filters above, or add a consolidation unit to start maintaining ownership.</div>";

      this._renderChrome();
      /* after the strips: they change the height the table is given */
      sc.scrollTop = keep.top;
      sc.scrollLeft = keep.left;
    }

    /* Everything around the table: buttons, counts, messages. */
    _renderChrome() {
      var self = this, p = this._props;
      var list = this._visible();
      var pending = this._pendingCount();
      var blocking = this._blocking();
      var noScope = !this._loaded.version || !this._loaded.period;
      var off = !!p.readOnly || this._saving;

      this._$("#add").disabled = off;
      this._$("#del").disabled = this._sel.size === 0 || off;
      this._$("#save").disabled = pending === 0 || blocking > 0 || off || noScope;
      this._$("#revert").disabled = pending === 0 || off;
      this._$("#refresh").disabled = this._saving;
      this._$("#fapply").disabled = this._saving;
      this._$("#selall").disabled = off;
      var b = this._$("#badge"); b.hidden = pending === 0; b.textContent = pending;
      this._$("#cnt").textContent = "Ownership (" + list.length +
        (list.length !== this._rows.length ? " of " + this._rows.length : "") + ")";
      this._$("#selall").checked = list.length > 0 && list.every(function (r) { return self._sel.has(r.key); });
      if (pending === 0) { this._dropMsg("gochanges"); }
      this._renderStrips();
    }

    _renderStrips() {
      var p = this._props, strips = [];
      var self = this;
      this._msgs.forEach(function (m) { strips.push(self._strip(m.kind, m.text, m.id)); });

      var typed = this._rows.filter(function (r) { return r.invalid.pcon || r.invalid.pown; }).length;
      var nomethod = this._rows.filter(function (r) { return r.dirty && r.method === ""; }).length;
      var unset = this._rows.filter(function (r) { return !r.dirty && r.method === ""; }).length;
      var pending = this._pendingCount();
      var over = this._rows.filter(function (r) { return r.dirty && self._over(r); }).length;
      var overOld = this._rows.filter(function (r) { return !r.dirty && self._over(r); }).length;
      var offFix = this._rows.filter(function (r) { return !r.dirty && self._offFix(r); }).length;
      if (typed) { strips.push(this._strip("err", typed + " entry/entries hold a value that is not a percentage between 0 and 100. Correct it to save.")); }
      if (nomethod) { strips.push(this._strip("err", nomethod + " changed entry/entries have no consolidation method. Choose one to save.")); }
      if (over) { strips.push(this._strip("err", over + " changed entry/entries have an ownership % above the consolidation %. Correct it to save.")); }
      if (overOld) { strips.push(this._strip("info", overOld + " entry/entries in the model have an ownership % above the consolidation %.")); }
      if (offFix) { strips.push(this._strip("info", offFix + " entry/entries in the model hold a percentage other than the one their method fixes. Choose the method again to apply it.")); }
      var unusual = this._rows.filter(function (r) {
        var e = self._offExpect(r);
        return e.pcon !== null || e.pown !== null;
      }).length;
      if (unusual) { strips.push(this._strip("warn", unusual + " entry/entries hold a percentage other than the one their consolidation method normally has. Check them; they can be saved as they are.")); }
      if (!typed && !nomethod && !over && pending) {
        if (!this._loaded.version || !this._loaded.period) {
          strips.push(this._strip("warn", pending + " pending change(s) cannot be saved: no version and period have been loaded. Choose Go first."));
        } else {
          strips.push(this._strip("warn", pending + " pending change(s) are not written to the model yet. Choose Save."));
        }
      }
      if (unset) { strips.push(this._strip("info", unset + " entry/entries hold percentages but no consolidation method in the model.")); }
      if (p.readOnly) { strips.push(this._strip("info", "Read-only mode is active.")); }
      this._$("#strips").innerHTML = strips.join("");
    }

    _strip(kind, text, id) {
      var ic = {
        info: '<circle cx="8" cy="8" r="6"/><path d="M8 7.5v3.5M8 5.2v.6"/>',
        warn: '<path d="M8 2.5l6 11H2z"/><path d="M8 6.5v3.2M8 11.4v.5"/>',
        err: '<circle cx="8" cy="8" r="6"/><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8"/>'
      }[kind] || "";
      return '<div class="strip ' + esc(kind) + '"' + (kind === "err" ? ' role="alert"' : "") + ">" +
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">' + ic + "</svg>" +
        '<span class="msg">' + esc(text) + "</span>" +
        (id ? '<button class="sx" data-dismiss="' + esc(id) + '">Dismiss</button>' : "") +
        "</div>";
    }
  }

  customElements.define(TAG, OwnershipWidget);
})();
