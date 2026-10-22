# Legacy SVG source: builds the original vector badges, not the active WebP art.
# Current image_gen prompts and export settings are recorded in prompts.json.
import os, sys
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

GOLD = '''
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#fff1b8"/><stop offset=".35" stop-color="#e8b740"/>
  <stop offset=".7" stop-color="#b8821c"/><stop offset="1" stop-color="#f2cf6b"/>
</linearGradient>
<linearGradient id="goldIn" x1="1" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#f6d77a"/><stop offset="1" stop-color="#a87314"/>
</linearGradient>'''

def enamel(c1, c2):
    return f'''<radialGradient id="en" cx=".5" cy=".38" r=".7">
  <stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></radialGradient>'''

# Shared mascots: cream tabby cat (teal scarf) on the left, orange fox (navy neckerchief) on the right.
CAT = '''
<g id="cat">
  <path d="M-22 26 Q0 40 22 26 L20 34 Q0 46 -20 34Z" fill="#1f9e98" stroke="#11605c" stroke-width="2"/>
  <path d="M-24 -6 L-20 -34 L-4 -20Z" fill="#f6e6c8" stroke="#6b4f2a" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M24 -6 L20 -34 L4 -20Z" fill="#f6e6c8" stroke="#6b4f2a" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M-18 -12 L-17 -27 L-9 -19Z" fill="#f4a9a8"/><path d="M18 -12 L17 -27 L9 -19Z" fill="#f4a9a8"/>
  <ellipse cx="0" cy="4" rx="27" ry="24" fill="#f6e6c8" stroke="#6b4f2a" stroke-width="2.5"/>
  <path d="M-6 -19 L-4 -11 M0 -20 L0 -11 M6 -19 L4 -11" stroke="#c99a5b" stroke-width="2.6" stroke-linecap="round"/>
  <ellipse cx="-10" cy="3" rx="4.2" ry="5.2" fill="#2d2a26"/><ellipse cx="10" cy="3" rx="4.2" ry="5.2" fill="#2d2a26"/>
  <circle cx="-8.6" cy="1" r="1.6" fill="#fff"/><circle cx="11.4" cy="1" r="1.6" fill="#fff"/>
  <path d="M-2.6 10 L2.6 10 L0 13Z" fill="#e57a8a"/>
  <path d="M0 13 Q-4 18 -8 15 M0 13 Q4 18 8 15" stroke="#6b4f2a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="-17" cy="12" rx="4.5" ry="3" fill="#f6b3b3" opacity=".7"/><ellipse cx="17" cy="12" rx="4.5" ry="3" fill="#f6b3b3" opacity=".7"/>
</g>'''
FOX = '''
<g id="fox">
  <path d="M-20 26 L0 42 L20 26 L14 36 L0 46 L-14 36Z" fill="#26407a" stroke="#152647" stroke-width="2"/>
  <path d="M-26 -4 L-24 -38 L-4 -20Z" fill="#ec8a3c" stroke="#7a3d12" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M26 -4 L24 -38 L4 -20Z" fill="#ec8a3c" stroke="#7a3d12" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M-24.5 -30 L-24 -38 L-17 -31Z" fill="#3a2a22"/><path d="M24.5 -30 L24 -38 L17 -31Z" fill="#3a2a22"/>
  <path d="M-20 -10 L-20 -27 L-10 -19Z" fill="#fde7d2"/><path d="M20 -10 L20 -27 L10 -19Z" fill="#fde7d2"/>
  <path d="M-30 2 Q-28 -22 0 -22 Q28 -22 30 2 Q26 26 0 30 Q-26 26 -30 2Z" fill="#ec8a3c" stroke="#7a3d12" stroke-width="2.5"/>
  <path d="M-28 6 Q-14 4 0 14 Q14 4 28 6 Q22 26 0 30 Q-22 26 -28 6Z" fill="#fffaf2"/>
  <ellipse cx="-11" cy="0" rx="4.2" ry="5.2" fill="#2d2a26"/><ellipse cx="11" cy="0" rx="4.2" ry="5.2" fill="#2d2a26"/>
  <circle cx="-9.6" cy="-2" r="1.6" fill="#fff"/><circle cx="12.4" cy="-2" r="1.6" fill="#fff"/>
  <ellipse cx="0" cy="13" rx="4.2" ry="3.2" fill="#2d2a26"/>
  <path d="M0 16 Q-4 21 -8 18 M0 16 Q4 21 8 18" stroke="#7a3d12" stroke-width="2" fill="none" stroke-linecap="round"/>
</g>'''

STAR = '<path d="M0 -9 L2.6 -2.8 L9 -2.8 L3.8 1.2 L5.8 8 L0 4 L-5.8 8 L-3.8 1.2 L-9 -2.8 L-2.6 -2.8Z"/>'
def sparkles(color="#fff6c8", pts=((-60,-48,0.9),(64,-40,0.7),(-70,6,0.55),(72,10,0.6))):
    return "".join(f'<g transform="translate({x} {y}) scale({s})" fill="{color}" opacity=".9">{STAR}</g>' for x,y,s in pts)

EMBLEMS = {
"sky_launch": ("#bfe6ff", "#3c7fb8", '''
  <g transform="translate(0 -38)">
    <path d="M-62 26 Q-74 26 -80 30 M-58 34 Q-70 36 -76 42" stroke="#eaf6ff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
    <path d="M-46 -4 L-62 -20 L-58 -2Z M-46 4 L-62 20 L-58 2Z" fill="#c4503c" stroke="#5a1e14" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="50" ry="22" fill="#f2f2ee" stroke="#4a4a52" stroke-width="2.5"/>
    <path d="M-50 0 H50 M-30 -20 Q-34 0 -30 20 M0 -22 V22 M30 -20 Q34 0 30 20" stroke="#c9c9cf" stroke-width="2" fill="none"/>
    <path d="M-18 22 L-14 34 H14 L18 22" fill="#8a5a2b" stroke="#4a2c12" stroke-width="2"/>
    <rect x="-16" y="30" width="32" height="10" rx="3" fill="#a86a32" stroke="#4a2c12" stroke-width="2"/>
    <circle cx="-7" cy="35" r="2.6" fill="#fff6c8"/><circle cx="3" cy="35" r="2.6" fill="#fff6c8"/>
    <circle cx="54" cy="0" r="5" fill="#d9a441" stroke="#5a3a10" stroke-width="2"/>
  </g>''' + sparkles()),
"garden_key": ("#c9efc4", "#2f7d4a", '''
  <g transform="translate(0 -36) rotate(-20)">
    <circle cx="-30" cy="0" r="20" fill="none" stroke="url(#goldIn)" stroke-width="9"/>
    <circle cx="-30" cy="0" r="20" fill="none" stroke="#6b4a0e" stroke-width="2"/>
    <path d="M-30 -9 Q-22 0 -30 9 Q-38 0 -30 -9Z" fill="#e7a3c4"/>
    <rect x="-10" y="-5" width="62" height="10" rx="4" fill="url(#goldIn)" stroke="#6b4a0e" stroke-width="2"/>
    <path d="M36 5 V20 H44 V5 M48 5 V15 H54 V5" fill="url(#goldIn)" stroke="#6b4a0e" stroke-width="2"/>
  </g>
  <path d="M-58 -2 Q-70 -24 -52 -40 Q-48 -20 -58 -2Z M62 -6 Q76 -28 58 -44 Q52 -22 62 -6Z" fill="#5cb85c" stroke="#225c2c" stroke-width="2"/>
  <path d="M-46 -66 Q-30 -76 -16 -66 M18 -70 Q34 -80 48 -68" stroke="#3d8f4d" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="-16" cy="-66" r="5" fill="#f6a7c1"/><circle cx="48" cy="-68" r="5" fill="#ffd34d"/>'''),
"spring_bloom": ("#ffe0ec", "#c2577f", '''
  <g transform="translate(0 -34)">
    <path d="M0 40 V0" stroke="#3d8f4d" stroke-width="5" stroke-linecap="round"/>
    <path d="M0 26 Q-22 22 -26 6 Q-6 8 0 26Z M0 18 Q20 12 24 -2 Q6 0 0 18Z" fill="#6cc46c" stroke="#225c2c" stroke-width="2"/>
    <g transform="translate(0 -12)">
      <g fill="#ff9ec4" stroke="#a83d6b" stroke-width="2">
        <ellipse cx="0" cy="-16" rx="10" ry="15"/><ellipse cx="0" cy="-16" rx="10" ry="15" transform="rotate(72)"/>
        <ellipse cx="0" cy="-16" rx="10" ry="15" transform="rotate(144)"/><ellipse cx="0" cy="-16" rx="10" ry="15" transform="rotate(216)"/>
        <ellipse cx="0" cy="-16" rx="10" ry="15" transform="rotate(288)"/>
      </g>
      <circle r="9" fill="#ffd34d" stroke="#a87314" stroke-width="2"/>
    </g>
    <g transform="translate(-50 30)"><path d="M0 10 V-6" stroke="#3d8f4d" stroke-width="3"/><path d="M0 -2 Q-10 -6 -12 -14 Q-2 -12 0 -2Z M0 -4 Q8 -10 10 -18 Q2 -16 0 -4Z" fill="#6cc46c"/></g>
    <g transform="translate(52 30)"><path d="M0 10 V-6" stroke="#3d8f4d" stroke-width="3"/><path d="M0 -2 Q-10 -6 -12 -14 Q-2 -12 0 -2Z M0 -4 Q8 -10 10 -18 Q2 -16 0 -4Z" fill="#6cc46c"/></g>
  </g>''' + sparkles("#fffbe0", ((-62,-58,0.7),(60,-62,0.8),(-74,-10,0.5),(74,-16,0.55)))),
"word_collector": ("#e6dcff", "#5a46a8", '''
  <g transform="translate(0 -34)">
    <path d="M0 -14 Q-30 -26 -60 -16 V30 Q-30 20 0 32Z" fill="#fffaf0" stroke="#4a3a7a" stroke-width="2.5"/>
    <path d="M0 -14 Q30 -26 60 -16 V30 Q30 20 0 32Z" fill="#fff4e0" stroke="#4a3a7a" stroke-width="2.5"/>
    <path d="M-50 -6 Q-30 -12 -10 -4 M-50 6 Q-30 0 -10 8 M-50 18 Q-30 12 -10 20 M10 -4 Q30 -12 50 -6 M10 8 Q30 0 50 6 M10 20 Q30 12 50 18" stroke="#b9a9e0" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M0 -14 V32" stroke="#4a3a7a" stroke-width="2.5"/>
    <g fill="#ffd34d" stroke="#a87314" stroke-width="1.5"><g transform="translate(-30 -40) scale(1.1)">''' + STAR + '''</g><g transform="translate(0 -48) scale(1.4)">''' + STAR + '''</g><g transform="translate(30 -40) scale(1.1)">''' + STAR + '''</g></g>
  </g>'''),
"sound_sorter": ("#c6f0ea", "#1f7f78", '''
  <g transform="translate(0 -30)">
    <g stroke="#14524d" stroke-width="2.5">
      <path d="M-58 0 H-14 L-20 36 H-52Z" fill="#ffb86b"/><path d="M14 0 H58 L52 36 H20Z" fill="#8fd3ff"/>
    </g>
    <path d="M-36 -40 Q-36 -26 -36 -12" stroke="#2d2a26" stroke-width="3"/><ellipse cx="-41" cy="-12" rx="7" ry="5" fill="#2d2a26" transform="rotate(-20 -41 -12)"/>
    <path d="M-36 -40 L-24 -36" stroke="#2d2a26" stroke-width="3"/>
    <path d="M32 -44 V-14 M48 -48 V-18 M32 -44 L48 -48" stroke="#2d2a26" stroke-width="3" fill="none"/>
    <ellipse cx="27" cy="-14" rx="6.5" ry="4.6" fill="#2d2a26" transform="rotate(-20 27 -14)"/><ellipse cx="43" cy="-18" rx="6.5" ry="4.6" fill="#2d2a26" transform="rotate(-20 43 -18)"/>
    <path d="M-12 -56 Q0 -64 12 -56 M-18 -66 Q0 -78 18 -66" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>
    <path d="M-8 18 H8 M3 13 L8 18 L3 23" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>'''),
"dictation_ace": ("#ffe1c4", "#c2500a", '''
  <g transform="translate(-4 -34)">
    <path d="M-58 -26 Q-66 -14 -58 -2 M-68 -34 Q-80 -14 -68 6" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".9"/>
    <rect x="-40" y="-30" width="76" height="58" rx="6" fill="#fffaf0" stroke="#7a3d12" stroke-width="2.5"/>
    <path d="M-30 -14 H24 M-30 0 H24 M-30 14 H10" stroke="#f0c9a0" stroke-width="3" stroke-linecap="round"/>
    <path d="M-28 -16 Q-22 -26 -16 -16 Q-10 -6 -4 -16 Q2 -26 8 -16" stroke="#26407a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g transform="translate(30 6) rotate(35)">
      <rect x="-6" y="-40" width="12" height="44" fill="#ffd34d" stroke="#7a5a10" stroke-width="2"/>
      <rect x="-6" y="-46" width="12" height="7" fill="#f4a9a8" stroke="#7a5a10" stroke-width="2"/>
      <path d="M-6 4 L0 16 L6 4Z" fill="#f6e1c0" stroke="#7a5a10" stroke-width="2"/><path d="M-2 12 L0 16 L2 12Z" fill="#2d2a26"/>
    </g>
    <circle cx="46" cy="-34" r="14" fill="#2bb673" stroke="#14603c" stroke-width="2.5"/>
    <path d="M39 -34 L44 -28 L53 -40" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>'''),
"time_traveler": ("#d6defc", "#33408f", '''
  <g transform="translate(0 -34)">
    <path d="M-60 -6 A60 60 0 0 1 -30 -50" stroke="#ffd34d" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M-30 -50 L-40 -50 M-30 -50 L-32 -40" stroke="#ffd34d" stroke-width="4" stroke-linecap="round"/>
    <path d="M60 -6 A60 60 0 0 0 30 -50" stroke="#8fd3ff" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M60 -6 L50 -8 M60 -6 L62 -16" stroke="#8fd3ff" stroke-width="4" stroke-linecap="round"/>
    <circle r="36" fill="#fffaf0" stroke="url(#goldIn)" stroke-width="7"/>
    <circle r="36" fill="none" stroke="#6b4a0e" stroke-width="1.5"/>
    <g stroke="#33408f" stroke-width="3" stroke-linecap="round">
      <path d="M0 -28 V-23 M0 28 V23 M-28 0 H-23 M28 0 H23"/>
      <path d="M0 0 V-19" stroke-width="4"/><path d="M0 0 L14 8" stroke-width="4"/>
    </g>
    <circle r="4" fill="#c2500a"/>
  </g>''' + sparkles("#fff6c8", ((-66,-70,0.6),(68,-70,0.6)))),
"story_navigator": ("#c4eef0", "#1d6f86", '''
  <g transform="translate(0 -34)">
    <path d="M-62 -30 L-22 -40 L22 -30 L62 -40 V36 L22 46 L-22 36 L-62 46Z" fill="#fff1cf" stroke="#8a6a2a" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M-22 -40 V36 M22 -30 V46" stroke="#e0c890" stroke-width="2"/>
    <path d="M-48 26 Q-34 6 -18 14 Q0 22 10 0" stroke="#c2500a" stroke-width="3" fill="none" stroke-dasharray="6 5" stroke-linecap="round"/>
    <path d="M14 -10 L26 2 M26 -10 L14 2" stroke="#b42323" stroke-width="4" stroke-linecap="round"/>
    <g transform="translate(40 -14)">
      <circle r="16" fill="#fffaf0" stroke="#1d6f86" stroke-width="2.5"/>
      <path d="M0 -13 L4 0 L0 13 L-4 0Z" fill="#b42323"/><path d="M0 13 L4 0 L-4 0Z" fill="#26407a"/>
      <circle r="2.5" fill="#2d2a26"/>
    </g>
  </g>'''),
"watchful_listener": ("#cfe0f7", "#26407a", '''
  <g transform="translate(0 -32)">
    <path d="M-42 6 Q-42 -46 0 -46 Q42 -46 42 6" stroke="#2d2a26" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M-42 6 Q-42 -46 0 -46 Q42 -46 42 6" stroke="#8fa8d6" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="-56" y="-4" width="22" height="36" rx="10" fill="#c2500a" stroke="#5a2a0a" stroke-width="2.5"/>
    <rect x="34" y="-4" width="22" height="36" rx="10" fill="#c2500a" stroke="#5a2a0a" stroke-width="2.5"/>
    <path d="M-70 4 Q-78 14 -70 24 M-80 -2 Q-92 14 -80 30 M70 4 Q78 14 70 24 M80 -2 Q92 14 80 30" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>
    <g fill="#ffd34d" stroke="#a87314" stroke-width="1.5"><g transform="translate(0 -14) scale(1.6)">''' + STAR + '''</g></g>
  </g>'''),
"storm_tamer": ("#e3d4ff", "#4b2e8f", '''
  <g transform="translate(0 -38)">
    <path d="M-50 4 Q-64 4 -64 -10 Q-64 -26 -46 -24 Q-44 -44 -20 -42 Q-8 -58 12 -48 Q32 -56 40 -36 Q62 -36 60 -16 Q62 4 44 4Z" fill="#8a86a8" stroke="#3a3458" stroke-width="2.5"/>
    <path d="M-36 -16 Q-20 -24 -6 -16" stroke="#b9b5d4" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M-30 6 L-38 24 M-12 6 L-18 20 M36 6 L30 22" stroke="#8fd3ff" stroke-width="3" stroke-linecap="round"/>
    <path d="M6 -2 L-8 24 H4 L-6 48 L22 14 H10 L20 -2Z" fill="#ffd34d" stroke="#a87314" stroke-width="2.5" stroke-linejoin="round"/>
  </g>
  <g transform="translate(46 -2)">
    <path d="M0 -20 L18 -13 V2 Q18 16 0 24 Q-18 16 -18 2 V-13Z" fill="#2bb673" stroke="#14603c" stroke-width="2.5"/>
    <path d="M-8 2 L-2 9 L9 -6" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>'''),
}

def badge(bid, c1, c2, emblem):
    rays = "".join(f'<path d="M0 0 L{-6} -110 L{6} -110Z" transform="rotate({a})" fill="#fff" opacity=".07"/>' for a in range(0, 360, 20))
    rim_dots = "".join(f'<circle cx="0" cy="-106" r="2.4" fill="#fff4c4" opacity=".9" transform="rotate({a})"/>' for a in range(0, 360, 15))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" role="img" aria-label="{bid.replace('_',' ')} badge">
<defs>{GOLD}{enamel(c1,c2)}
<clipPath id="inner"><circle r="92"/></clipPath>{CAT}{FOX}</defs>
<g transform="translate(120 120)">
  <circle r="116" fill="#7a5410" opacity=".18" transform="translate(0 4)"/>
  <circle r="114" fill="url(#gold)" stroke="#8a5e12" stroke-width="2"/>
  {rim_dots}
  <circle r="98" fill="url(#goldIn)" stroke="#8a5e12" stroke-width="1.5"/>
  <circle r="92" fill="url(#en)"/>
  <g clip-path="url(#inner)">
    {rays}
    <ellipse cx="0" cy="84" rx="110" ry="40" fill="#000" opacity=".12"/>
    {emblem}
    <use href="#cat" transform="translate(-36 52) scale(.82)"/>
    <use href="#fox" transform="translate(36 52) scale(.82)"/>
  </g>
  <circle r="92" fill="none" stroke="#6b4a0e" stroke-width="2"/>
  <g transform="translate(0 -106) scale(1.2)" fill="#fff6c8" stroke="#8a5e12" stroke-width="1.2">{STAR}</g>
</g>
</svg>
'''

for bid, (c1, c2, emblem) in EMBLEMS.items():
    with open(os.path.join(OUT, bid + ".svg"), "w") as f:
        f.write(badge(bid, c1, c2, emblem))
print("ok", len(EMBLEMS))
