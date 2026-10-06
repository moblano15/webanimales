/* ===== Patitas Felices – comportamiento ===== */
(() => {
  'use strict';

  // ---------- Datos (las fotos se asignan al azar; para fijar una, escribe su ruta en "photo") ----------
  const PETS = [
    { id:'thor',   name:'Thor',   type:'Perro', age:'3 años',   gender:'Macho',  neutered:'Sí', city:'Valencia', photo:'', colors:['#6b4a2b','#2b1a0e'], match:'Pastor alemán' },
    { id:'luna',   name:'Luna',   type:'Gato',  age:'1 año',    gender:'Hembra', neutered:'Sí', city:'Castellón', photo:'', colors:['#4c8c6a','#1d4332'], match:'Gata europea' },
    { id:'rocky',  name:'Rocky',  type:'Perro', age:'2 años',   gender:'Macho',  neutered:'Sí', city:'Valencia', photo:'', colors:['#e08a3f','#a3500f'], match:'Beagle' },
    { id:'simba',  name:'Simba',  type:'Gato',  age:'5 meses',  gender:'Macho',  neutered:'Sí', city:'Alicante', photo:'', colors:['#c97a3a','#7b3d12'], match:'Gato común europeo' },
    { id:'canela', name:'Canela', type:'Perro', age:'3 años',   gender:'Hembra', neutered:'Sí', city:'Valencia', photo:'', colors:['#7f9a52','#3d5521'], match:'Golden retriever' },
    { id:'kira',   name:'Kira',   type:'Otro',  age:'1 año',    gender:'Hembra', neutered:'No', city:'Castellón', photo:'', colors:['#6a8fb5','#2b4d75'], match:'Conejo enano' }
  ];

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ---------- Almacenamiento seguro ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  // ---------- Aviso ----------
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2000);
  }

  // ---------- Foto (con marcador si no carga) ----------
  const KEYWORD = { Perro:'dog', Gato:'cat', Otro:'rabbit' };
  const flickr = (kw, n) => `https://loremflickr.com/640/480/${kw}?lock=${n}`;

  function photoHTML(p, size = 72) {
    const grad = `--a:${p.colors[0]};--b:${p.colors[1]}`;
    const paw = `<svg width="${size}" height="${size}" aria-hidden="true"><use href="#i-paw"/></svg>`;
    const img = p.photo
      ? `<img src="${esc(p.photo)}" alt="Foto de ${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer" data-fallback="${esc(flickr(KEYWORD[p.type], PETS.indexOf(p) + 1))}">`
      : '';
    return { grad, inner: paw + img };
  }

  // Si una foto falla: primero prueba otra fuente y, si también falla, deja el marcador
  document.addEventListener('error', e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.fallback) { img.src = img.dataset.fallback; delete img.dataset.fallback; }
    else img.remove();
  }, true);

  // ---------- Favoritos ----------
  const favs = new Set(store.get('pf:favs', []));
  const favCount = $('#favCount');
  const favButton = $('#favButton');
  function updateFavCount(bump) {
    favCount.textContent = favs.size;
    if (bump) {
      favButton.classList.remove('bump');
      void favButton.offsetWidth;
      favButton.classList.add('bump');
    }
  }

  // ---------- Tarjetas ----------
  let filter = null;
  const grid = $('#petGrid');

  function renderPets() {
    const list = PETS.filter(p => !filter || p.type === filter);
    if (!list.length) { grid.innerHTML = '<p class="empty">No hay animales en esta categoría ahora mismo.</p>'; return; }
    grid.innerHTML = list.map(p => {
      const { grad, inner } = photoHTML(p);
      const saved = favs.has(p.id);
      return `
      <article class="pet">
        <div class="ph" style="${grad}">${inner}</div>
        <div class="pet-body">
          <div class="pet-top">
            <span class="pet-loc"><svg width="14" height="14" aria-hidden="true"><use href="#i-pin"/></svg>${esc(p.city)}</span>
            <button class="save" type="button" data-id="${p.id}" aria-pressed="${saved}" aria-label="${saved ? 'Quitar a' : 'Guardar a'} ${esc(p.name)}">
              <svg width="14" height="14" aria-hidden="true"><use href="#i-heart"/></svg>
              <span>${saved ? 'Guardado' : 'Guardar'}</span>
            </button>
          </div>
          <h3>${esc(p.name)}</h3>
          <dl class="facts">
            <div><dt>Edad:</dt><dd>${esc(p.age)}</dd></div>
            <div><dt>Género:</dt><dd>${esc(p.gender)}</dd></div>
            <div><dt>Esterilizado:</dt><dd>${esc(p.neutered)}</dd></div>
          </dl>
          <a class="btn btn-primary" href="#" data-ficha="${p.id}">Ver ficha de ${esc(p.name)}</a>
        </div>
      </article>`;
    }).join('');
  }

  grid.addEventListener('click', e => {
    const save = e.target.closest('.save');
    if (save) {
      const pet = PETS.find(p => p.id === save.dataset.id);
      if (favs.has(pet.id)) { favs.delete(pet.id); toast(`${pet.name} quitado de favoritos`); }
      else { favs.add(pet.id); toast(`${pet.name} guardado en favoritos`); }
      store.set('pf:favs', [...favs]);
      updateFavCount(true);
      renderPets();
      return;
    }
    const ficha = e.target.closest('[data-ficha]');
    if (ficha) { e.preventDefault(); toast('Aquí se abriría la ficha completa'); }
  });

  favButton.addEventListener('click', () => {
    const names = PETS.filter(p => favs.has(p.id)).map(p => p.name);
    toast(names.length ? 'Favoritos: ' + names.join(', ') : 'Aún no has guardado ninguna mascota');
  });

  // ---------- Filtro por especie ----------
  $$('.cat').forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filter = filter === f ? null : f;
    $$('.cat').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    renderPets();
  }));

  // ---------- Adoptar a ciegas ----------
  const reveal = $('#reveal');
  reveal.addEventListener('pointermove', e => {
    const r = reveal.getBoundingClientRect();
    reveal.style.setProperty('--x', (e.clientX - r.left) + 'px');
    reveal.style.setProperty('--y', (e.clientY - r.top) + 'px');
  });

  function bestMatch(home, pace, life) {
    const byId = id => PETS.find(p => p.id === id);
    if (pace === 'Tranquilo' || home === 'Piso pequeño') return life === 'Con otros animales' ? byId('kira') : byId('luna');
    if (life === 'Con niños') return byId('canela');
    if (pace === 'Muy activo') return byId('rocky');
    if (home === 'Casa con jardín') return byId('thor');
    return byId('simba');
  }

  $('#blindForm').addEventListener('submit', e => {
    e.preventDefault();
    const pet = bestMatch($('#qHome').value, $('#qPace').value, $('#qLife').value);
    $('#resName').textContent = `Tu pana es ${pet.name}`;
    $('#resText').textContent = `${pet.match} · ${pet.age} · ${pet.city}. Te lo presentamos en la entrevista.`;
    $('#blindResult').hidden = false;
    if (pet.photo) {
      showReveal(pet.photo);                       // la foto del elegido se revela con el ratón
      resPhoto.style.background = `url("${pet.photo}") center/cover`;
      resPhoto.classList.add('has-photo');
    }
  });

  // ---------- Fotos aleatorias ----------
  // Perros: dog.ceo · Gatos: thecatapi.com · Otros: loremflickr.com (todas gratuitas, sin clave)
  const reveal2 = $('#reveal');
  const heroImgs = $$('[data-hero]');
  const resPhoto = $('#resPhoto');

  async function getJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }

  async function pickPhotos() {
    try { const s = sessionStorage.getItem('pf:photos'); if (s) return JSON.parse(s); } catch {}
    let dogs = [], cats = [];
    try { dogs = (await getJSON('https://dog.ceo/api/breeds/image/random/6')).message; } catch {}
    try { cats = (await getJSON('https://api.thecatapi.com/v1/images/search?limit=3')).map(x => x.url); } catch {}
    const dog = i => dogs[i] || flickr('dog', i + 20);
    const cat = i => cats[i] || flickr('cat', i + 20);
    let d = 0, c = 0;
    const pets = {};
    PETS.forEach((p, i) => { pets[p.id] = p.type === 'Perro' ? dog(d++) : p.type === 'Gato' ? cat(c++) : flickr('rabbit', i + 1); });
    const out = { pets, hero: [dog(d++), cat(c++), dog(d++)], reveal: dog(d++) };
    try { sessionStorage.setItem('pf:photos', JSON.stringify(out)); } catch {}
    return out;
  }

  function showReveal(url) {
    reveal2.style.setProperty('--photo', `url("${url}")`);
    reveal2.classList.add('has-photo');
  }

  async function applyPhotos() {
    const ph = await pickPhotos();
    PETS.forEach(p => { p.photo = ph.pets[p.id]; });
    renderPets();
    heroImgs.forEach((img, i) => {
      img.addEventListener('load', () => { img.hidden = false; }, { once: true });
      img.addEventListener('error', () => img.remove(), { once: true });
      img.src = ph.hero[i];
    });
    showReveal(ph.reveal);
  }

  // ---------- Inicio ----------
  updateFavCount(false);
  renderPets();
  applyPhotos();
})();
