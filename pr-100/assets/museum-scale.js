/* M-18: positive quantities in one unit; logarithmic compression is explicit. */
(function (global) {
  'use strict';
  function valid(x) { return x && typeof x.label === 'string' && x.label.trim() && Number.isFinite(x.value) && x.value > 0; }
  function compile(c) {
    if (!c || !valid(c.subject) || typeof c.subject.unit !== 'string' || !c.subject.unit.trim()) throw Error('Нужен предмет с положительным размером и единицей');
    if (!Array.isArray(c.refs) || !c.refs.length || c.refs.some(function (r) { return !valid(r) || (r.unit && r.unit !== c.subject.unit); })) throw Error('Нужны эталоны в одной единице измерения');
    var s = c.subject.value, nearest = 0, distance = Infinity;
    c.refs.forEach(function (r,i) { var d = Math.abs(Math.log(s)-Math.log(r.value)); if (d < distance) { nearest = i; distance = d; } });
    return { initial: nearest, compare: function (index) {
      if (!Number.isInteger(index) || index < 0 || index >= c.refs.length) throw Error('Неизвестный эталон');
      var r = c.refs[index], big = Math.max(s,r.value), small = Math.min(s,r.value), gap = Math.log(big)-Math.log(small);
      var ratio = big / small, logarithmic = ratio > 100;
      var smallHeight = logarithmic ? 1 / (1 + gap / Math.LN10) : small / big;
      return { index:index, ratio:ratio, logarithmic:logarithmic, heights: s >= r.value ? [1,smallHeight] : [smallHeight,1], direction:s === r.value ? 'equal' : s > r.value ? 'larger' : 'smaller' };
    } };
  }
  var counter = 0;
  function mount(root,c) {
    if (root.dataset.rcScaleReady) return;
    var doc = root.ownerDocument, panel = doc.createElement('div'); panel.className = 'rc-scale'; panel.style.cssText = 'max-width:100%;overflow-wrap:anywhere';
    function el(tag,text,parent) { var n=doc.createElement(tag); if (text !== undefined) n.textContent=text; (parent || panel).appendChild(n); return n; }
    try {
      var model = compile(c), uid='rc-scale-'+(++counter);
      el('h3',c.subject.label);
      var tabs=el('div'); tabs.setAttribute('role','tablist'); tabs.setAttribute('aria-label','С чем сравнить'); tabs.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
      var buttons=c.refs.map(function(r,i) { var b=el('button',r.label,tabs); b.type='button'; b.id=uid+'-tab-'+i; b.setAttribute('role','tab'); b.setAttribute('aria-controls',uid+'-panel'); b.style.cssText='min-height:44px;max-width:100%;white-space:normal'; return b; });
      var body=el('div'); body.id=uid+'-panel'; body.setAttribute('role','tabpanel');
      var svg=doc.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('viewBox','0 0 320 200'); svg.setAttribute('aria-hidden','true'); svg.style.cssText='display:block;width:100%;max-height:240px'; body.appendChild(svg);
      var bars=[70,210].map(function(x) { var b=doc.createElementNS(svg.namespaceURI,'rect'); b.setAttribute('x',x); b.setAttribute('width',40); b.setAttribute('fill','currentColor'); svg.appendChild(b); return b; });
      bars[1].setAttribute('opacity','0.6');
      var legend=el('p','',body), note=el('p','',body), result=el('p','',body); result.setAttribute('aria-live','polite');
      if (c.caption) el('p',c.caption);
      var reset=el('button','Вернуть исходное сравнение'); reset.type='button'; reset.dataset.rcReset='scale'; reset.style.minHeight='44px';
      function render(index) {
        var state=model.compare(index), ref=c.refs[index];
        buttons.forEach(function(b,i) { b.setAttribute('aria-selected',String(i===index)); b.tabIndex=i===index?0:-1; });
        body.setAttribute('aria-labelledby',buttons[index].id);
        bars.forEach(function(b,i) { var h=180*state.heights[i]; b.setAttribute('y',190-h); b.setAttribute('height',h); });
        legend.textContent='Слева: '+c.subject.label+' — '+c.subject.value.toLocaleString('ru-RU')+' '+c.subject.unit+'. Справа: '+ref.label+' — '+ref.value.toLocaleString('ru-RU')+' '+c.subject.unit+'.';
        note.textContent=state.logarithmic?'Шкала сжата: логарифмическая. Сравнивайте точные числа под схемой.':'Линейная шкала: высоты столбцов пропорциональны значениям.';
        var ratio=Number.isFinite(state.ratio)?state.ratio.toLocaleString('ru-RU',{maximumSignificantDigits:6}):'более '+Number.MAX_VALUE.toExponential(2);
        result.textContent=state.direction==='equal'?'Величины равны.':c.subject.label+' '+(state.direction==='larger'?'больше':'меньше')+' выбранного ориентира; отношение большей величины к меньшей: '+ratio+'.';
        return state;
      }
      buttons.forEach(function(b,i) { b.addEventListener('click',function() { render(i); }); b.addEventListener('keydown',function(e) {
        var next; if(e.key==='ArrowRight') next=(i+1)%buttons.length; else if(e.key==='ArrowLeft') next=(i+buttons.length-1)%buttons.length; else if(e.key==='Home') next=0; else if(e.key==='End') next=buttons.length-1; else return;
        e.preventDefault(); render(next); buttons[next].focus();
      }); });
      reset.addEventListener('click',function() { render(model.initial); });
      render(model.initial); root.appendChild(panel); root.dataset.rcScaleReady='1'; return {render:render,initial:model.initial};
    } catch(error) { panel.replaceChildren(); el('p','Сравнение недоступно: '+error.message).setAttribute('role','alert'); root.appendChild(panel); root.dataset.rcScaleReady='error'; }
  }
  function init() { global.document.querySelectorAll('[data-rc-scale]').forEach(function(root) { mount(root,(global.RC_SCALE || {})[root.dataset.rcScale]); }); }
  var api={compile:compile,mount:mount,init:init}; if(typeof module!=='undefined'&&module.exports) module.exports=api; global.RCMuseumScale=api;
  if(global.document) { if(global.document.readyState==='loading') global.document.addEventListener('DOMContentLoaded',init); else init(); }
})(typeof window!=='undefined'?window:globalThis);
