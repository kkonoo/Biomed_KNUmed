// 교수진 둘러보기: 이름·교실·키워드로 찾기, 구분·교실·주제 칩으로 거르기, 한 쪽에 12분씩 쪽 넘기기
// 데이터는 build.py가 페이지 안(#data)에 넣어요. 교수님은 기초·임상 → 교실 → 이름 순
(() => {
  const D = JSON.parse(document.getElementById("data").textContent);
  const profs = D.profs;
  const PER = 12;   // 한 쪽에 12분 (네 줄·세 줄·두 줄 칸에 모두 맞아요)
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ko = (a, b) => a.localeCompare(b, "ko");
  // 찾기용 글자: 띄어쓰기·대소문자·가운뎃점 무시 ('생화학 세포' = '생화학·세포')
  const fold = s => String(s || "").toLowerCase().replace(/[\s·・,.\-_/()]+/g, "");
  const shortDept = d => d.replace(/교실$/, "");
  const topics = D.topics.filter(([k]) => profs.some(p => p.topics.includes(k)));
  const n = { 기초: profs.filter(p => p.kind === "기초").length, 임상: profs.filter(p => p.kind === "임상").length };
  const state = { q: "", kind: "", dept: "", topic: "", page: 0 };

  function matches(p) {
    const words = state.q.trim().split(/\s+/).map(fold).filter(Boolean);
    if (!words.length) return true;
    const hay = fold([p.name, p.dept, p.rank, p.line, ...p.keywords].join(" "));
    return words.every(w => hay.includes(w));
  }
  const inKind = p => !state.kind || p.kind === state.kind;
  const filtered = () => profs.filter(p => inKind(p) && (!state.dept || p.dept === state.dept)
    && (!state.topic || p.topics.includes(state.topic)) && matches(p));

  // 칩: 고른 칩을 한 번 더 누르면 전체로
  function chip(key, value, label, count) {
    const on = state[key] === value;
    return `<button class="chip${on ? " on" : ""}" type="button" data-f="${key}" data-v="${esc(value)}" aria-pressed="${on}">${label}${count == null ? "" : ` <small>${count}</small>`}</button>`;
  }
  function renderFilters() {
    const kindPs = profs.filter(inKind);
    $("#fKind").innerHTML = chip("kind", "", "전체", profs.length) + ["기초", "임상"].map(k => chip("kind", k, k, n[k])).join("");
    const depts = [...new Set(kindPs.map(p => p.dept))].sort(ko);
    $("#fDept").innerHTML = chip("dept", "", "전체") + depts.map(d => chip("dept", d, esc(shortDept(d)), kindPs.filter(p => p.dept === d).length)).join("");
    $("#fTopic").innerHTML = chip("topic", "", "전체") + topics.map(([k, icon, label]) =>
      chip("topic", k, `${icon} ${esc(label)}`, kindPs.filter(p => p.topics.includes(k)).length)).join("");
  }

  function card(p) {
    const kws = p.keywords.map(k => `<li>${esc(k)}</li>`).join("");
    const links = p.links.map(([url, label]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} →</a>`).join("");
    // 담당자가 교수님 본인이고 연락처가 이메일과 같으면 한 번만
    const c = p.contact && !(p.contact[0] === p.name && p.contact[1] === p.email) ? p.contact : null;
    return `<article class="card" id="p-${esc(p.id)}">
      <img class="photo" src="${esc(p.photo)}" alt="" loading="lazy">
      <div class="id">
        <h3><span class="name">${esc(p.name)}</span><span class="rank">${esc(p.rank)}</span></h3>
        <p class="dept">${esc(p.dept)}</p>
        <p class="mail"><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>
        ${c ? `<p class="contact"><span>담당자</span> ${esc(c[0])}${c[1] ? `<br>${esc(c[1])}` : ""}</p>` : ""}
      </div>
      <div class="about">
        <p class="line">${esc(p.line)}</p>
        <ul class="kw">${kws}</ul>
        ${links ? `<p class="go">${links}</p>` : ""}
      </div>
    </article>`;
  }

  function render() {
    const list = filtered();
    const last = Math.max(1, Math.ceil(list.length / PER));
    state.page = Math.min(state.page, last - 1);
    const filtering = state.q.trim() || state.kind || state.dept || state.topic;
    $("#count").innerHTML = filtering ? `<b>${list.length}명</b> / ${profs.length}명` : `<b>${profs.length}명</b>`;
    $("#cards").innerHTML = list.length ? list.slice(state.page * PER, state.page * PER + PER).map(card).join("")
      : '<p class="empty">맞는 교수님이 없어요. 찾는 말이나 칩을 바꿔 보세요.</p>';
    $("#cards").classList.toggle("cards", list.length > 0);
    const cur = state.page + 1;
    $("#pages").innerHTML = last < 2 ? "" : `<button type="button" data-page="${cur - 1}" ${cur > 1 ? "" : "disabled"} aria-label="이전 쪽">‹</button>`
      + Array.from({ length: last }, (_, i) => i + 1).map(x =>
        `<button type="button" data-page="${x}"${x === cur ? ' class="on" aria-current="page"' : ""}>${x}</button>`).join("")
      + `<button type="button" data-page="${cur + 1}" ${cur < last ? "" : "disabled"} aria-label="다음 쪽">›</button>`;
  }

  const top = () => { if ($("#book").getBoundingClientRect().top < 0) $("#book").scrollIntoView(); };

  $(".filters").addEventListener("click", e => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    const { f, v } = b.dataset;
    state[f] = state[f] === v ? "" : v;
    // 구분을 바꾸면 그 구분에 없는 교실은 풀어요
    if (f === "kind" && state.dept && !profs.some(p => inKind(p) && p.dept === state.dept)) state.dept = "";
    state.page = 0;
    renderFilters();
    render();
  });
  $("#q").addEventListener("input", e => {
    state.q = e.target.value;
    state.page = 0;
    render();
  });
  $("#pages").addEventListener("click", e => {
    const b = e.target.closest("[data-page]");
    if (!b || b.disabled) return;
    state.page = Number(b.dataset.page) - 1;
    render();
    top();
  });

  // 테스트 추천에서 교수님을 누르면: 거르기를 풀고 그분이 있는 쪽을 열어 카드를 보여 줘요
  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-prof]");
    if (!a) return;
    e.preventDefault();
    Object.assign(state, { q: "", kind: "", dept: "", topic: "" });
    $("#q").value = "";
    state.page = Math.floor(profs.findIndex(p => p.id === a.dataset.prof) / PER);
    renderFilters();
    render();
    const el = document.getElementById(`p-${a.dataset.prof}`);
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 1600);
  });

  renderFilters();
  render();
})();
