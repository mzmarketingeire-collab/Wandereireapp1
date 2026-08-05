import { useState } from 'react';
import { Search, SlidersHorizontal, Mountain, Landmark, Eye, Waves, Tent, CheckCircle2, Bookmark, User } from 'lucide-react';

const COLORS = {
  cream: '#FBF3E7',
  ink: '#1E2A22',
  emerald: '#1F7A4D',
  terracotta: '#E2603D',
  amber: '#F0A93A',
  ocean: '#1C7293',
  plum: '#6B4A85',
};

const FONT_DISPLAY = "'Space Grotesk', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

const CATEGORIES = [
  { id: 'trail', label: 'Trails', color: COLORS.emerald, Icon: Mountain },
  { id: 'historic', label: 'Historic', color: COLORS.terracotta, Icon: Landmark },
  { id: 'viewpoint', label: 'Viewpoints', color: COLORS.amber, Icon: Eye },
  { id: 'beach', label: 'Beaches', color: COLORS.ocean, Icon: Waves },
  { id: 'camp', label: 'Camping', color: COLORS.plum, Icon: Tent },
];

// Low-poly stylised coastline of Ireland — straight facets, not traced satellite data
const IRELAND_POINTS = [
  [150, 10], [180, 25], [195, 55], [215, 75], [225, 110], [215, 140], [205, 175],
  [210, 205], [195, 235], [215, 255], [225, 285], [210, 315], [215, 350], [230, 380],
  [195, 395], [160, 400], [130, 390], [100, 395], [75, 385], [55, 395], [35, 375],
  [10, 385], [0, 350], [20, 330], [0, 300], [15, 270], [30, 250], [0, 225],
  [30, 200], [50, 190], [75, 180], [55, 160], [70, 145], [40, 120], [65, 100],
  [45, 80], [65, 65], [35, 50], [70, 35], [95, 25], [115, 15], [135, 10],
];
const PATH_D = IRELAND_POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';

const PINS = [
  { id: 1, name: 'Glendalough Upper Lake Trail', county: 'Wicklow', cat: 'trail', cost: 'Free', dist: '2.4km loop', x: 185, y: 300 },
  { id: 2, name: 'Blarney Castle', county: 'Cork', cat: 'historic', cost: '€18', dist: '', x: 90, y: 370 },
  { id: 3, name: 'Cliffs of Moher', county: 'Clare', cat: 'viewpoint', cost: '€10 parking', dist: '', x: 50, y: 130 },
  { id: 4, name: 'Inch Beach', county: 'Kerry', cat: 'beach', cost: 'Free', dist: '5km strand', x: 30, y: 245 },
  { id: 5, name: 'Glenveagh National Park', county: 'Donegal', cat: 'camp', cost: 'Free entry', dist: '', x: 110, y: 45 },
];

const toPct = (x, y) => ({ left: `${(x / 240) * 100}%`, top: `${(y / 410) * 100}%` });

export default function MapMockup() {
  const [selected, setSelected] = useState(PINS[0]);
  const [status, setStatus] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');

  const toggle = (id, key) =>
    setStatus((s) => ({ ...s, [id]: { ...s[id], [key]: !s[id]?.[key] } }));

  const selectedCat = CATEGORIES.find((c) => c.id === selected.cat);

  return (
    <div style={{ background: COLORS.cream, fontFamily: FONT_BODY, minHeight: '100vh' }} className="w-full flex flex-col items-center py-10 px-4">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');`}</style>

      <div className="mb-6 text-center">
        <div style={{ fontFamily: FONT_MONO, color: COLORS.ink, opacity: 0.5, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Style concept</div>
        <div style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontWeight: 700, fontSize: 22 }}>Map screen — bright &amp; bold</div>
      </div>

      {/* Phone frame */}
      <div
        className="relative overflow-hidden shadow-2xl flex flex-col"
        style={{ width: 360, height: 720, border: `8px solid ${COLORS.ink}`, borderRadius: 40, background: COLORS.cream, boxSizing: 'border-box' }}
      >
        <div className="flex justify-between items-center px-6 pt-3" style={{ color: COLORS.ink, fontFamily: FONT_MONO, fontSize: 11 }}>
          <span>9:41</span>
          <span>● ● ●</span>
        </div>

        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <span style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontWeight: 700, fontSize: 21 }}>Wander Éire</span>
          <div className="rounded-full flex items-center justify-center" style={{ width: 34, height: 34, background: COLORS.ink }}>
            <User size={16} color={COLORS.cream} />
          </div>
        </div>

        <div className="mx-5 mb-3 flex items-center gap-2 rounded-full px-4 shadow-md" style={{ background: '#fff', height: 44 }}>
          <Search size={16} color={COLORS.ink} style={{ opacity: 0.45 }} />
          <span className="flex-1 text-sm" style={{ color: COLORS.ink, opacity: 0.45 }}>Where to next?</span>
          <SlidersHorizontal size={16} color={COLORS.ink} />
        </div>

        <div className="flex gap-2 px-5 mb-3 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className="rounded-full px-3 whitespace-nowrap flex-shrink-0"
            style={{ height: 28, fontSize: 12, fontWeight: 600, background: activeFilter === 'all' ? COLORS.ink : '#fff', color: activeFilter === 'all' ? COLORS.cream : COLORS.ink }}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveFilter(c.id)}
              className="rounded-full px-3 whitespace-nowrap flex-shrink-0 flex items-center gap-1"
              style={{ height: 28, fontSize: 12, fontWeight: 600, background: activeFilter === c.id ? c.color : '#fff', color: activeFilter === c.id ? '#fff' : COLORS.ink }}
            >
              <span className="rounded-full" style={{ width: 6, height: 6, background: activeFilter === c.id ? '#fff' : c.color }} />
              {c.label}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="relative flex-1 overflow-hidden" style={{ background: `${COLORS.ocean}22` }}>
          <svg viewBox="0 0 240 410" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
            <path d={PATH_D} fill="#DCE8D2" stroke={COLORS.emerald} strokeWidth="1.5" strokeOpacity="0.35" />
            <polygon points="150,10 225,110 100,395" fill={COLORS.emerald} opacity="0.06" />
            <polygon points="0,300 65,100 30,250" fill={COLORS.emerald} opacity="0.08" />
            <path d="M185,300 Q140,220 110,45" fill="none" stroke={COLORS.ink} strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="1 4" />
            <path d="M90,370 Q60,260 50,130" fill="none" stroke={COLORS.ink} strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="1 4" />
            <path d="M185,300 Q140,340 90,370" fill="none" stroke={COLORS.ink} strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="1 4" />
          </svg>

          {PINS.map((p) => {
            const c = CATEGORIES.find((cc) => cc.id === p.cat);
            const isSelected = selected.id === p.id;
            const dimmed = activeFilter !== 'all' && activeFilter !== p.cat;
            const size = isSelected ? 40 : 32;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                style={{ position: 'absolute', ...toPct(p.x, p.y), transform: 'translate(-50%,-50%)', opacity: dimmed ? 0.3 : 1, transition: 'all 0.15s' }}
              >
                <div
                  className="rounded-full flex items-center justify-center shadow-lg"
                  style={{ width: size, height: size, background: c.color, border: `3px solid ${COLORS.cream}` }}
                >
                  <c.Icon size={isSelected ? 17 : 14} color="#fff" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom sheet */}
        <div className="rounded-t-3xl px-5 pt-3 pb-5 shadow-2xl" style={{ background: '#fff' }}>
          <div className="rounded-full mx-auto mb-3" style={{ width: 36, height: 4, background: '#00000022' }} />
          <div className="flex gap-3 items-center">
            <div className="rounded-2xl flex-shrink-0 flex items-center justify-center" style={{ width: 56, height: 56, background: selectedCat?.color }}>
              {selectedCat && <selectedCat.Icon size={22} color="#fff" />}
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: COLORS.ink }}>{selected.name}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.ink, opacity: 0.55, marginTop: 3 }}>
                {selected.county} · {selected.cost}{selected.dist ? ` · ${selected.dist}` : ''}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => toggle(selected.id, 'ticked')} className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, background: status[selected.id]?.ticked ? COLORS.emerald : '#F3EFE6' }}>
                <CheckCircle2 size={17} color={status[selected.id]?.ticked ? '#fff' : COLORS.ink} />
              </button>
              <button onClick={() => toggle(selected.id, 'saved')} className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, background: status[selected.id]?.saved ? COLORS.amber : '#F3EFE6' }}>
                <Bookmark size={17} color={status[selected.id]?.saved ? '#fff' : COLORS.ink} fill={status[selected.id]?.saved ? '#fff' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Style key */}
      <div className="mt-8 w-full flex flex-col items-center" style={{ maxWidth: 360 }}>
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {[{ name: 'Cream', hex: COLORS.cream, border: true }, { name: 'Ink', hex: COLORS.ink }, ...CATEGORIES.map((c) => ({ name: c.label, hex: c.color }))].map((s) => (
            <div key={s.name} className="flex flex-col items-center" style={{ width: 66 }}>
              <div className="rounded-xl mb-1" style={{ width: 40, height: 40, background: s.hex, border: s.border ? '1px solid #00000022' : 'none' }} />
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.ink, opacity: 0.7 }}>{s.name}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-8 mb-6">
          <div className="flex flex-col items-center">
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 28, color: COLORS.ink }}>Aa</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.ink, opacity: 0.55 }}>Space Grotesk</span>
          </div>
          <div className="flex flex-col items-center">
            <span style={{ fontFamily: FONT_BODY, fontWeight: 500, fontSize: 28, color: COLORS.ink }}>Aa</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.ink, opacity: 0.55 }}>Inter</span>
          </div>
          <div className="flex flex-col items-center">
            <span style={{ fontFamily: FONT_MONO, fontWeight: 500, fontSize: 24, color: COLORS.ink }}>2.4km</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.ink, opacity: 0.55 }}>IBM Plex Mono</span>
          </div>
        </div>

        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.ink, opacity: 0.6, textAlign: 'center', lineHeight: 1.5 }}>
          Pins sit like tacks pushed into the map — solid colour ring, no teardrop tail. Colour is the only label you need to read the category. Tap a pin or a filter chip to try it.
        </p>
      </div>
    </div>
  );
}
