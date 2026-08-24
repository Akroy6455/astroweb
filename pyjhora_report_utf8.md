# Comprehensive Research Report: PyJHora Implementation of Sthana Bala and Kaala Bala

## 1. Executive Summary & File Locations

In the PyJHora codebase, the Shadbala calculation engine is located primarily in:
- **Core Calculation Engine**: `src/jhora/horoscope/chart/strength.py`
- **Constants & Configuration**: `src/jhora/const.py`
- **Astronomical & Panchanga Foundations**: `src/jhora/panchanga/drik.py`
- **House & Relational Calculations**: `src/jhora/horoscope/chart/house.py`
- **Chart Generation & Planetary Classifications**: `src/jhora/horoscope/chart/charts.py`
- **Mathematical Utilities**: `src/jhora/utils.py`

### Planet Indexing Standard (0 to 6)
PyJHora uses the following planetary indexing for Shadbala (`const.SUN_TO_SATURN = range(0, 7)`):
- `0`: Sun (*Surya*)
- `1`: Moon (*Chandra*)
- `2`: Mars (*Kuja / Mangala*)
- `3`: Mercury (*Budha*)
- `4`: Jupiter (*Guru*)
- `5`: Venus (*Sukra*)
- `6`: Saturn (*Sani*)

*(Rahu `7` and Ketu `8` are excluded from classical Shadbala).*

### Units and Conversion
- All sub-component scores are computed in **Virupas** (also called **Shashtiamsas**, where $60 \text{ Virupas} = 1 \text{ Rupa}$).
- Total Shadbala $\text{Virupas} = \text{Sthana Bala} + \text{Kaala Bala} + \text{Dig Bala} + \text{Chesta Bala} + \text{Naisargika Bala} + \text{Drik Bala}$.
- Total in Rupas: $\text{Rupas} = \frac{\text{Virupas}}{60.0}$.
- Strength Ratio: $\text{Strength} = \frac{\text{Rupas}}{\text{Required Factor}}$, where `const.shad_bala_factors = [5.0, 6.0, 5.0, 7.0, 6.5, 5.5, 5.0]` (Sun: 5, Moon: 6, Mars: 5, Mercury: 7, Jupiter: 6.5, Venus: 5.5, Saturn: 5).

---

## 2. Sthana Bala (Positional Strength)

**Function**: `_sthana_bala(jd, place)` (Lines 214ΓÇô232 in `strength.py`)

$$\text{Sthana Bala} = \text{Uccha Bala} + \text{Saptavargaja Bala} + \text{Ojayugma Bala} + \text{Kendra Bala} + \text{Drekkana Bala}$$

```python
def _sthana_bala(jd, place):
    sv = const.sapthavargaja_factors  # [1, 2, 3, 7, 9, 12, 30]
    pp_sv = {}
    for dcf in sv:
        pp = charts.divisional_chart(jd, place, divisional_chart_factor=dcf)[:const._pp_count_upto_ketu]
        pp_sv[dcf] = pp
    ub = _uchcha_bala(pp_sv[1])
    svb = _sapthavargaja_bala1(jd, place)
    ob = _ojayugama_bala(pp_sv[1], pp_sv[9])
    kb = _kendra_bala(pp_sv[1])
    db = _dreshkon_bala(pp_sv[1])
    sb = list(map(sum, zip(*[ub, svb, ob, kb, db])))
    sb = [round(v, 2) for v in sb]
    return sb
```

---

### 2.1 Uccha Bala (Exaltation Strength)

**Function**: `_uchcha_bala(planet_positions)` (Lines 312ΓÇô325 in `strength.py`)

#### Formula
1. Compute absolute planetary longitude:
   $$p\_long = \text{sign} \times 30^\circ + \text{degrees\_in\_sign}$$
2. Compute distance $pd$ from deep debilitation point ($\text{deb\_long}$):
   $$pd = (p\_long + 360 - \text{deb\_long}) \pmod{360}$$
   $$\text{if } pd > 180.0: \quad pd = 360.0 - pd$$
   *(Resulting $pd \in [0^\circ, 180^\circ]$, where $0^\circ$ is maximum debilitation and $180^\circ$ is deep exaltation).*
3. Compute Virupas based on `const.use_saravali_formula_for_uccha_bala` (default `True`):
   - **Saravali / BV Raman Formula** (`True`):
     $$\text{Uccha Bala} = \text{round}\left(\frac{pd}{3}, 2\right) \quad (\text{Max } 60 \text{ Virupas})$$
   - **PVR Book Formula** (`False`):
     $$\text{Uccha Bala} = \text{round}\left(\frac{pd}{180.0} \times 20.0, 2\right) \quad (\text{Max } 20 \text{ Virupas})$$

#### Constants & Deep Exaltation Points
- `planet_deep_exaltation_longitudes = [10.0, 33.0, 298.0, 165.0, 95.0, 357.0, 200.0]`
  - Sun: Aries 10┬░ ($10^\circ$)
  - Moon: Taurus 3┬░ ($33^\circ$)
  - Mars: Capricorn 28┬░ ($298^\circ$)
  - Mercury: Virgo 15┬░ ($165^\circ$)
  - Jupiter: Cancer 5┬░ ($95^\circ$)
  - Venus: Pisces 27┬░ ($357^\circ$)
  - Saturn: Libra 20┬░ ($200^\circ$)
- `planet_deep_debilitation_longitudes = [(e + 180.0) % 360 for e in planet_deep_exaltation_longitudes]`
  - Sun: Libra 10┬░ ($190^\circ$)
  - Moon: Scorpio 3┬░ ($213^\circ$)
  - Mars: Cancer 28┬░ ($118^\circ$)
  - Mercury: Pisces 15┬░ ($345^\circ$)
  - Jupiter: Capricorn 5┬░ ($275^\circ$)
  - Venus: Virgo 27┬░ ($177^\circ$)
  - Saturn: Aries 20┬░ ($20^\circ$)

#### Code
```python
def _uchcha_bala(planet_positions):
    ub = []
    for p, (h, long) in planet_positions[1:const._pp_count_upto_saturn]:
        p_long = h * 30 + long
        pd = (p_long + 360 - const.planet_deep_debilitation_longitudes[p]) % 360
        if pd > 180.0:
            pd = 360.0 - pd
        if const.use_saravali_formula_for_uccha_bala:
            ubv = round(pd / 3, 2)
            ub.append(ubv)
        else:
            ubv = round(pd / 180.0 * 20.0, 2)
            ub.append(ubv)
    return ub
```

---

### 2.2 Saptavargaja Bala (Seven Divisional Strengths)

**Functions**: `_sapthavargaja_bala1(jd, place)` & `_sapthavargaja_bala_2(planet_positions, dcf, compound_relations)` (Lines 197ΓÇô213, 233ΓÇô249 in `strength.py`)

#### Divisional Charts Evaluated (Sapthavarga)
`const.sapthavargaja_factors = [1, 2, 3, 7, 9, 12, 30]`
1. D-1 (Rasi)
2. D-2 (Hora) ΓÇö computed specifically with `charts.hora_chart(planet_positions_in_rasi, chart_method=2)`
3. D-3 (Drekkana)
4. D-7 (Saptamsa)
5. D-9 (Navamsa)
6. D-12 (Dwadasamsa)
7. D-30 (Trisamsa)

#### Compound Relationships (Pancha-dha Sambandha)
Computed once in D-1 Rasi chart: `cr = house._get_compound_relationships_of_planets(h_to_p)`
1. **Natural Relationship (`const.planet_relations`)**:
   - `friendly_planets`:
     - Sun: [Moon, Mars, Jupiter]
     - Moon: [Sun, Mercury]
     - Mars: [Sun, Moon, Jupiter]
     - Mercury: [Sun, Venus]
     - Jupiter: [Sun, Moon, Mars]
     - Venus: [Mercury, Saturn]
     - Saturn: [Mercury, Venus]
   - `neutral_planets`:
     - Sun: [Mercury]
     - Moon: [Mars, Jupiter, Venus, Saturn]
     - Mars: [Venus, Saturn]
     - Mercury: [Mars, Jupiter, Saturn]
     - Jupiter: [Saturn]
     - Venus: [Mars, Jupiter]
     - Saturn: [Jupiter]
   - `enemy_planets`:
     - Sun: [Venus, Saturn]
     - Moon: []
     - Mars: [Mercury]
     - Mercury: [Moon]
     - Jupiter: [Mercury, Venus]
     - Venus: [Sun, Moon]
     - Saturn: [Sun, Moon, Mars]
2. **Temporary Relationship (`Tatkalika Mitra / Satru`)**:
   - Planets in houses 2, 3, 4, 10, 11, 12 from planet $\rightarrow$ **Temporary Friend** (`temporary_friend_raasi_positions = [1, 2, 3, 9, 10, 11]`).
   - Planets in houses 1, 5, 6, 7, 8, 9 from planet $\rightarrow$ **Temporary Enemy** (`temporary_enemy_raasi_positions = [0, 4, 5, 6, 7, 8]`).
3. **Compound Combination Matrix**:
   - Natural Friend + Temp Friend $\rightarrow$ **Adhimitra** (Great Friend, internal `cr = 4`)
   - Natural Neutral + Temp Friend $\rightarrow$ **Mitra** (Friend, internal `cr = 3`)
   - (Natural Friend + Temp Enemy) OR (Natural Enemy + Temp Friend) $\rightarrow$ **Sama** (Neutral, internal `cr = 2`)
   - Natural Neutral + Temp Enemy $\rightarrow$ **Satru** (Enemy, internal `cr = 1`)
   - Natural Enemy + Temp Enemy $\rightarrow$ **Adhisatru** (Great Enemy, internal `cr = 0`)

#### Scoring Matrix in Each Varga
For a planet $p$ in sign $h$ in divisional chart $dcf$ owned by `owner = const._house_owners_list[h]`:
| Dignity | Condition | Score (Virupas) |
|---|---|---|
| **Moola Trikona** | $dcf == 1$ AND $h == \text{moola\_trikona\_of\_planets}[p]$ | **45.0** |
| **Swastha (Own Sign)** | $\text{house\_strengths\_of\_planets}[p][h] == 5$ | **30.0** |
| **Adhimitra (Great Friend)** | $cr[p][\text{owner}] == 4$ | **22.5** |
| **Mitra (Friend)** | $cr[p][\text{owner}] == 3$ | **15.0** |
| **Sama (Neutral)** | $cr[p][\text{owner}] == 2$ | **7.5** |
| **Satru (Enemy)** | $cr[p][\text{owner}] == 1$ | **3.75** |
| **Adhisatru (Great Enemy)**| $cr[p][\text{owner}] == 0$ | **1.875** |

- `_house_owners_list = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4]`
- `moola_trikona_of_planets = [4, 1, 0, 5, 8, 6, 10]` (Sun: Leo, Moon: Taurus, Mars: Aries, Mercury: Virgo, Jupiter: Sagittarius, Venus: Libra, Saturn: Aquarius)

#### Code
```python
def _sapthavargaja_bala_2(planet_positions, dcf, compound_relations):
    sb = [0 for _ in range(const.KETU_ID)]
    cr = compound_relations
    sb_fac = {
        const._ADHISATHRU_GREATENEMY - 1: 1.875,  # key 0
        const._SATHRU_ENEMY - 1: 3.75,            # key 1
        const._SAMAM_NEUTRAL - 1: 7.5,            # key 2
        const._MITHRA_FRIEND - 1: 15,             # key 3
        const._ADHIMITRA_GREATFRIEND - 1: 22.5    # key 4
    }
    for p, (h, _) in planet_positions[1:const._pp_count_upto_saturn]:
        owner = const._house_owners_list[h]
        if h == const.moola_trikona_of_planets[p] and dcf == 1:
            sb[p] = 45
        elif const.house_strengths_of_planets[p][h] == const._OWNER_RULER:
            sb[p] = 30
        else:
            sb[p] = sb_fac[cr[p][owner]]
    return sb

def _sapthavargaja_bala1(jd, place):
    sv = const.sapthavargaja_factors
    pp_sv = {}
    planet_positions_in_rasi = charts.rasi_chart(jd, place)[:const._pp_count_upto_ketu]
    h_to_p = utils.get_house_planet_list_from_planet_positions(planet_positions_in_rasi)
    cr = house._get_compound_relationships_of_planets(h_to_p)
    for dcf in sv:
        pp = charts.divisional_chart(jd, place, divisional_chart_factor=dcf) if dcf != 2 \
             else charts.hora_chart(planet_positions_in_rasi, chart_method=2)
        pp_sv[dcf] = pp[:const._pp_count_upto_ketu]
    svb = []
    for dcf in sv:
        svbc = _sapthavargaja_bala_2(pp_sv[dcf], dcf, cr)
        svb.append(svbc)
    svb_sum = list(map(sum, zip(*svb)))
    svb_sum = [round(v, 2) for v in svb_sum]
    return svb_sum
```

---

### 2.3 Ojayugma Bala (Odd/Even Sign Strength / Yugmayugma Bala)

**Function**: `_ojayugama_bala(rasi_planet_positions, navamsa_planet_positions)` (Lines 267ΓÇô282 in `strength.py`)

#### Rules
- `odd_signs = [0, 2, 4, 6, 8, 10]` (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius)
- `even_signs = [1, 3, 5, 7, 9, 11]` (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces)
- **Feminine Planets: Moon (1) and Venus (5)**:
  - If in an **even sign** in Rasi (D-1) $\rightarrow$ **+15 Virupas**
  - If in an **even sign** in Navamsa (D-9) $\rightarrow$ **+15 Virupas**
- **Masculine / Neutral Planets: Sun (0), Mars (2), Mercury (3), Jupiter (4), Saturn (6)**:
  - If in an **odd sign** in Rasi (D-1) $\rightarrow$ **+15 Virupas**
  - If in an **odd sign** in Navamsa (D-9) $\rightarrow$ **+15 Virupas**
- Maximum per planet: **30 Virupas** (15 in D-1 + 15 in D-9).

#### Code
```python
def _ojayugama_bala(rasi_planet_positions, navamsa_planet_positions):
    sb = [0 for _ in const.SUN_TO_SATURN]
    for p in const.SUN_TO_SATURN:
        rh = rasi_planet_positions[p+1][1][0]
        nh = navamsa_planet_positions[p+1][1][0]
        if p in [const.MOON_ID, const.VENUS_ID]:
            if rh in const.even_signs:
                sb[p] = 15
            if nh in const.even_signs:
                sb[p] += 15
        else:
            if rh in const.odd_signs:
                sb[p] = 15
            if nh in const.odd_signs:
                sb[p] += 15
    return sb
```

---

### 2.4 Kendra Bala (Quadrant Strength)

**Function**: `_kendra_bala(rasi_planet_positions)` (Lines 283ΓÇô293 in `strength.py`)

#### Rules
Based on house occupancy relative to Lagna sign ($asc$) in Rasi (D-1):
- **Kendra (1st, 4th, 7th, 10th)**: $[asc, asc+3, asc+6, asc+9] \pmod{12} \rightarrow$ **60 Virupas**
- **Panaphara (2nd, 5th, 8th, 11th)**: $[asc+1, asc+4, asc+7, asc+10] \pmod{12} \rightarrow$ **30 Virupas**
- **Apoklima (3rd, 6th, 9th, 12th)**: $[asc+2, asc+5, asc+8, asc+11] \pmod{12} \rightarrow$ **15 Virupas**

#### Code
```python
def _kendra_bala(rasi_planet_positions):
    kb = [0 for _ in const.SUN_TO_SATURN]
    asc_house = rasi_planet_positions[0][1][0]
    for p, (h, _) in rasi_planet_positions[1:const._pp_count_upto_saturn]:
        if h in kendras(asc_house):
            kb[p] = 60
        elif h in panapharas(asc_house):
            kb[p] = 30
        elif h in apoklimas(asc_house):
            kb[p] = 15
    return kb
```

---

### 2.5 Drekkana Bala / Dreshkona Bala (Decanate Strength)

**Function**: `_dreshkon_bala(planet_positions)` (Lines 294ΓÇô301 in `strength.py`)

#### Rules
Based on the longitude within the sign ($0^\circ \le long < 30^\circ$), decanate index $pd = \text{int}(long // 10.0)$:
- `const.dreshkon_bala_list = [(0, 2, 4), (3, 6), (1, 5)]`
- **1st Drekkana ($0^\circ - 10^\circ$, $pd=0$)**: Masculine planets (**Sun [0], Mars [2], Jupiter [4]**) get **15 Virupas**.
- **2nd Drekkana ($10^\circ - 20^\circ$, $pd=1$)**: Hermaphrodite planets (**Mercury [3], Saturn [6]**) get **15 Virupas**.
- **3rd Drekkana ($20^\circ - 30^\circ$, $pd=2$)**: Feminine planets (**Moon [1], Venus [5]**) get **15 Virupas**.
- Otherwise: **0 Virupas**.

#### Code
```python
def _dreshkon_bala(planet_positions):
    kb = [0 for _ in const.SUN_TO_SATURN]
    kbf = const.dreshkon_bala_list
    for p, (h, long) in planet_positions[1:const._pp_count_upto_saturn]:
        pd = int(long // 10.0)
        if p in kbf[pd]:
            kb[p] = 15
    return kb
```

---

## 3. Kaala Bala (Temporal Strength)

**Function**: `_kaala_bala(jd, place)` (Lines 643ΓÇô665 in `strength.py`)

$$\text{Kaala Bala} = \text{Nathonnatha} + \text{Paksha} + \text{Tribhaga} + \text{Abda} + \text{Masa} + \text{Vara} + \text{Hora} + \text{Ayana} + \text{Yuddha}$$

```python
def _kaala_bala(jd, place):
    kb = [0 for _ in const.SUN_TO_SATURN]
    nb = _nathonnath_bala(jd, place)
    pb = _paksha_bala(jd, place)
    tb = _tribhaga_bala(jd, place)
    ab = _abdadhipathi(jd, place)
    mb = _masadhipathi(jd, place)
    vb = _vaaradhipathi(jd, place)
    hb = _hora_bala(jd, place)
    ayb = _ayana_bala(jd, place)
    yb = _yuddha_bala(jd, place)
    for p in const.SUN_TO_SATURN:
        kb[p] += nb[p]
        kb[p] += pb[p]
        kb[p] += tb[p]
        kb[p] += ab[p]
        kb[p] += mb[p]
        kb[p] += vb[p]
        kb[p] += hb[p]
        kb[p] += ayb[p]
        kb[p] += yb[p]
    kb = [round(kbp, 2) for kbp in kb]
    return kb
```

---

### 3.1 Nathonnatha Bala (Diurnal / Nocturnal Strength / Diva-Ratri Bala)

**Function**: `_nathonnath_bala(jd, place)` (Lines 479ΓÇô489 in `strength.py`)

#### Formula & Logic
1. Local birth hour $tobh$ (from `utils.jd_to_gregorian(jd)`).
2. Midnight hour $mnhl = \text{drik.midnight}(jd, place)$.
3. Angular time distance $t\_diff$:
   $$t\_diff = \begin{cases} (tobh - mnhl) \times \frac{60}{12}, & \text{if } tobh < 12.0 \\ (24.0 + mnhl - tobh) \times \frac{60}{12}, & \text{if } tobh \ge 12.0 \end{cases}$$
4. Assignment:
   - **Diurnal Planets (Sun [0], Jupiter [4], Venus [5])**:
     $$\text{Bala} = \text{round}(t\_diff, 2)$$
   - **Nocturnal Planets (Moon [1], Mars [2], Saturn [6])**:
     $$\text{Bala} = \text{round}(60.0 - t\_diff, 2)$$
   - **Mercury [3] (Always Strong)**:
     $$\text{Bala} = 60.0$$

#### Code
```python
def _nathonnath_bala(jd, place):
    nbp = [0 for _ in const.SUN_TO_SATURN]
    _, _, _, tobh = utils.jd_to_gregorian(jd)
    mnhl = drik.midnight(jd, place)
    t_diff = (tobh - mnhl) * 60 / 12 if tobh < 12.0 else (24.0 + mnhl - tobh) * 60 / 12
    for p in [const.SUN_ID, const.JUPITER_ID, const.VENUS_ID]:
        nbp[p] = round(t_diff, 2)
    for p in [const.MOON_ID, const.MARS_ID, const.SATURN_ID]:
        nbp[p] = round(60 - t_diff, 2)
    nbp[3] = 60.0
    return nbp
```

---

### 3.2 Paksha Bala (Lunar Phase Strength)

**Function**: `_paksha_bala(jd, place)` (Lines 490ΓÇô503 in `strength.py`)

#### Formula & Logic
1. Compute absolute longitudes of Sun and Moon:
   $$sun\_long = \text{Sun sign} \times 30 + \text{Sun deg}$$
   $$moon\_long = \text{Moon sign} \times 30 + \text{Moon deg}$$
2. Compute base Paksha value $pb$:
   $$pb = \text{round}\left(\frac{|sun\_long - moon\_long|}{3.0}, 2\right)$$
3. Determine functional benefics & malefics via `charts.benefics_and_malefics(jd, place, exclude_rahu_ketu=True)`:
   - Natural benefics: Jupiter (4), Venus (5)
   - Natural malefics: Sun (0), Mars (2), Saturn (6)
   - Moon (1): Benefic if Tithi $\le 15$ (Sukla Paksha / Waxing); Malefic if Tithi $> 15$ (Krishna Paksha / Waning).
   - Mercury (3): Benefic if alone or with more benefics; Malefic if with more malefics; if tied, closest planet by longitude decides.
4. Score distribution:
   - **Benefics**: get $pb$ Virupas.
   - **Malefics**: get $\text{round}(60.0 - pb, 2)$ Virupas.
   - **Special Rule for Moon**: Moon's score is **doubled**:
     $$\text{Paksha Bala}[\text{Moon}] = \text{Paksha Bala}[\text{Moon}] \times 2$$

#### Code
```python
def _paksha_bala(jd, place):
    planet_positions = drik.dhasavarga(jd, place, divisional_chart_factor=1)
    sun_long = planet_positions[const.SUN_ID][1][0] * 30 + planet_positions[const.SUN_ID][1][1]
    moon_long = planet_positions[const.MOON_ID][1][0] * 30 + planet_positions[const.MOON_ID][1][1]
    pb = round(abs(sun_long - moon_long) / 3.0, 2)
    pbp = [pb for _ in const.SUN_TO_SATURN]
    cht_benefics, cht_malefics = charts.benefics_and_malefics(jd, place, exclude_rahu_ketu=True)
    for p in cht_benefics:
        pbp[p] = pb
    for p in cht_malefics[:]:
        pbp[p] = round(60.0 - pb, 2)
    pbp[1] *= 2
    return pbp
```

---

### 3.3 Tribhaga Bala (Three-part Day/Night Strength)

**Function**: `_tribhaga_bala(jd, place)` (Lines 504ΓÇô525 in `strength.py`)

#### Rules
1. **Jupiter (4) ALWAYS gets 60 Virupas** regardless of time of birth.
2. Day length $dl = \text{sunset} - \text{sunrise}$, divided into 3 portions ($dlinc = dl / 3$).
3. Night length $nl = 24.0 + \text{sunrise}_{\text{tomorrow}} - \text{sunset}$, divided into 3 portions ($nlinc = nl / 3$).
4. The active lord gets **60 Virupas** (all others get 0):
   - **1st part of Day** ($srh \le tobh < srh + dlinc$): **Mercury [3]** gets **60 Virupas**
   - **2nd part of Day** ($srh + dlinc \le tobh < srh + 2 \times dlinc$): **Sun [0]** gets **60 Virupas**
   - **3rd part of Day** ($srh + 2 \times dlinc \le tobh < ssh$): **Saturn [6]** gets **60 Virupas**
   - **1st part of Night** ($ssh < tobh < ssh + nlinc$): **Moon [1]** gets **60 Virupas**
   - **2nd part of Night** ($ssh + nlinc \le tobh < 24$ OR $0 \le tobh < srh - nlinc$): **Venus [5]** gets **60 Virupas**
   - **3rd part of Night** ($srh - nlinc \le tobh < srh$): **Mars [2]** gets **60 Virupas**

#### Code
```python
def _tribhaga_bala(jd, place):
    tbp = [0 for _ in const.SUN_TO_SATURN]
    _, _, _, tobh = utils.jd_to_gregorian(jd)
    srh = drik.sunrise(jd, place)[0]
    ssh = drik.sunset(jd, place)[0]
    dl = drik.day_length(jd, place)
    nl = drik.night_length(jd, place)
    dlinc = dl / 3
    nlinc = nl / 3
    tbp[const.JUPITER_ID] = 60  # Guru/Jupiter always gets 60
    if tobh >= srh and tobh < srh + dlinc:
        tbp[const.MERCURY_ID] = 60
    elif tobh >= srh + dlinc and tobh < srh + 2 * dlinc:
        tbp[const.SUN_ID] = 60
    elif tobh >= srh + 2 * dlinc and tobh < ssh:
        tbp[const.SATURN_ID] = 60
    elif tobh > ssh and tobh < ssh + nlinc:
        tbp[const.MOON_ID] = 60
    elif (tobh >= ssh + nlinc and tobh < 24) or (tobh >= 0 and tobh < srh - nlinc):
        tbp[const.VENUS_ID] = 60
    elif tobh >= srh - nlinc and tobh < srh:
        tbp[const.MARS_ID] = 60
    return tbp
```

---

### 3.4 Abda Adhipati Bala (Lord of the Year Strength)

**Function**: `_abdadhipathi(jd, place)` (Lines 526ΓÇô553 in `strength.py`)

#### Formula & Ahargana Logic
1. Uses BV Raman Bhava & Graha Bala Table I base:
   - Base Year: `1951`, Base Days: `174`
2. Days elapsed since base:
   $$\text{total\_days} = 174 + (\text{leap\_years} \times 366) + (\text{non\_leap\_years} \times 365)$$
3. Ahargana days up to birth date:
   $$\_ahargana\_days = \_days\_elapsed\_since\_base(ay - 1) + \text{elapsed\_days\_in\_current\_year}$$
4. Year Lord weekday index:
   $$day = \left(\left\lfloor \frac{\_ahargana\_days}{360} \right\rfloor \times 3 + 1\right) \pmod 7$$
5. Map through `const.abdahipathi_weekdays = [2, 3, 4, 5, 6, 0, 1]` (Mars, Mercury, Jupiter, Venus, Saturn, Sun, Moon starting from Tuesday):
   - Winning Planet = `_abda_weekdays[day]`
   - Lord of the Year gets **15 Virupas** (all others get 0).

#### Code
```python
def _days_elapsed_since_base(year, base_year=1951, base_days=174):
    total_years = year - base_year
    leap_years = len([
        y for y in range(base_year + 1, year + 1)
        if (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0)
    ])
    non_leap_years = total_years - leap_years
    total_days = base_days + (leap_years * 366) + (non_leap_years * 365)
    return total_days

def _abdadhipathi(jd, place):
    abp = [0 for _ in const.SUN_TO_SATURN]
    _abda_weekdays = const.abdahipathi_weekdays  # [2, 3, 4, 5, 6, 0, 1]
    ay, _, _, _ = utils.jd_to_gregorian(jd)
    elpased_days_in_year = int(jd - utils.gregorian_to_jd(drik.Date(ay, 1, 1)) + 1)
    _ahargana_days = _days_elapsed_since_base(ay - 1) + elpased_days_in_year
    day = (int(_ahargana_days // 360) * 3 + 1) % 7
    abp[_abda_weekdays[day]] = 15
    return abp
```

---

### 3.5 Masa Adhipati Bala (Lord of the Month Strength)

**Function**: `_masadhipathi(jd, place)` (Lines 559ΓÇô568 in `strength.py`)

#### Formula
1. Uses Ahargana days $\_ahargana\_days$ from `_days_elapsed_since_base(ay - 1) + elpased_days_in_year`.
2. Month Lord weekday index:
   $$day = \left(\left\lfloor \frac{\_ahargana\_days}{30} \right\rfloor \times 2 + 1\right) \pmod 7$$
3. Map through `_abda_weekdays = [2, 3, 4, 5, 6, 0, 1]`:
   - Winning Planet = `_abda_weekdays[day]`
   - Lord of the Month gets **30 Virupas** (all others get 0).

#### Code
```python
def _masadhipathi(jd, place):
    abp = [0 for _ in const.SUN_TO_SATURN]
    _abda_weekdays = const.abdahipathi_weekdays
    ay, _, _, _ = utils.jd_to_gregorian(jd)
    elpased_days_in_year = int(jd - utils.gregorian_to_jd(drik.Date(ay, 1, 1)) + 1)
    _ahargana_days = _days_elapsed_since_base(ay - 1) + elpased_days_in_year
    day = (int(_ahargana_days // 30) * 2 + 1) % 7
    abp[_abda_weekdays[day]] = 30
    return abp
```

---

### 3.6 Vara Adhipati Bala (Lord of the Day Strength)

**Function**: `_vaaradhipathi(jd, place)` (Lines 574ΓÇô585 in `strength.py`)

#### Formula
1. Uses Ahargana with base year 1827 and base days 244:
   $$\_ahargana\_days = \_days\_elapsed\_since\_base(ay - 1, base\_year=1827, base\_days=244) + elpased\_days\_in\_year$$
2. Adjust for sunrise:
   $$\text{if } bth < \text{sunrise}: \quad \_ahargana\_days -= 1$$
3. Weekday index:
   $$day = \text{int}(\_ahargana\_days) \pmod 7$$
4. Map through `_abda_weekdays = [2, 3, 4, 5, 6, 0, 1]`:
   - Winning Planet = `_abda_weekdays[day]`
   - Lord of the Day gets **45 Virupas** (all others get 0).

*(Note: In `_vaara_bala`, it directly takes Vedic weekday from sunrise to sunrise: `day = drik.vaara(jd, place)` and awards 45 virupas).*

#### Code
```python
def _vaaradhipathi(jd, place):
    abp = [0 for _ in const.SUN_TO_SATURN]
    _abda_weekdays = const.abdahipathi_weekdays
    ay, _, _, bth = utils.jd_to_gregorian(jd)
    elpased_days_in_year = int(jd - utils.gregorian_to_jd(drik.Date(ay, 1, 1)) + 1)
    _ahargana_days = _days_elapsed_since_base(ay - 1, base_year=1827, base_days=244) + elpased_days_in_year
    if bth < drik.sunrise(jd, place)[0]:
        _ahargana_days -= 1
    day = int(_ahargana_days) % 7
    abp[_abda_weekdays[day]] = 45
    return abp
```

---

### 3.7 Hora Adhipati Bala (Lord of the Hour Strength)

**Function**: `_hora_bala(jd, place)` (Lines 595ΓÇô606 in `strength.py`)

#### Formula & Hora Order
1. Hora Lord sequence: `const.hora_bala_hora_order = [6, 4, 2, 0, 5, 3, 1]` (Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon).
2. Vedic weekday: `day = drik._vaara(jd)`.
   If $tobh < srise$: $day = (day - 1) \pmod 7$, $tobh += 24.0$.
3. Elapsed Hora index:
   $$hora = (\text{int}(tobh - srise) + day + 1) \pmod 7$$
4. Winning Planet = `hora_order[hora]`
   - Lord of the Hora gets **60 Virupas** (all others get 0).

#### Code
```python
def _hora_bala(jd, place):
    abp = [0 for _ in const.SUN_TO_SATURN]
    day = drik._vaara(jd)
    _, _, _, tobh = utils.jd_to_gregorian(jd)
    srise = drik.sunrise(jd, place)[0]
    if tobh < srise:
        day = (day - 1) % 7
        tobh += 24.0
    hora_order = const.hora_bala_hora_order  # [6, 4, 2, 0, 5, 3, 1]
    hora = (int(tobh - srise) + day + 1) % 7
    abp[hora_order[hora]] = 60
    return abp
```

---

### 3.8 Ayana Bala (Solstitial Strength)

**Functions**: `_ayana_bala(jd, place)` (Lines 607ΓÇô614 in `strength.py`) & `drik.declination_of_planets(jd, place)` (Lines 1844ΓÇô1881 in `drik.py`)

#### Declination ($\delta$) Calculation in `drik.py`
1. Tropical Sayana Longitude:
   $$p\_long = h \times 30 + long + ayanamsa$$
2. Sign of Declination:
   - Northern Hemisphere ($0^\circ \le p\_long < 180^\circ$):
     - $+1$ for Sun (0), Mars (2), Jupiter (4), Venus (5)
     - $-1$ for Moon (1), Saturn (6)
   - Southern Hemisphere ($180^\circ \le p\_long < 360^\circ$):
     - $+1$ for Moon (1), Saturn (6)
     - $-1$ for Sun (0), Mars (2), Jupiter (4), Venus (5)
   - Mercury (3) is always $+1$ ($north\_south\_sign[3] = 1$).
3. Bhuja (quadrant reduction):
   $$bhuja = \begin{cases} p\_long, & 0^\circ \le p\_long \le 90^\circ \\ 180^\circ - p\_long, & 90^\circ < p\_long < 180^\circ \\ p\_long - 180^\circ, & 180^\circ \le p\_long < 270^\circ \\ 360^\circ - p\_long, & 270^\circ \le p\_long < 360^\circ \end{cases}$$
4. Surya Siddhanta Declination Table Interpolation (Inverse Lagrange):
   - $bd = [0, \frac{362}{60}, \frac{703}{60}, \frac{1002}{60}, \frac{1238}{60}, \frac{1388}{60}, \frac{1440}{60}] = [0^\circ, 6.033^\circ, 11.717^\circ, 16.7^\circ, 20.633^\circ, 23.133^\circ, 24.0^\circ]$
   - $bx = [0, 15, 30, 45, 60, 75, 90]$
   - $\delta_p = north\_south\_sign[p] \times \text{inverse\_lagrange}(bd, bx, bhuja_p)$

#### Ayana Bala Formula
$$\text{Ayana Bala}[p] = \text{round}\left((24.0 + \delta_p) \times 1.25, 2\right)$$
- **Special Rule for Sun**:
  $$\text{Ayana Bala}[\text{Sun}] = \text{Ayana Bala}[\text{Sun}] \times 2$$

#### Code
```python
def _ayana_bala(jd, place):
    _declinations = drik.declination_of_planets(jd, place)
    ab = [0 for _ in const.SUN_TO_SATURN]
    for p in const.SUN_TO_SATURN:
        ab[p] = round((24.0 + _declinations[p]) * 1.25, 2)
        if p == 0:
            ab[p] *= 2
    return ab
```

---

### 3.9 Yuddha Bala (Planetary War Strength)

**Function**: `_yuddha_bala(jd, place)` (Lines 615ΓÇô642 in `strength.py`)

#### Formula & Logic
1. Check true planets: Mars (2), Mercury (3), Jupiter (4), Venus (5), Saturn (6). Sun and Moon do not participate (returns all 0 if either is involved).
2. Find the two planets closest in longitude: `utils.closest_elements(p_longs, p_longs)`.
3. Compute total strength up to Hora Bala for each planet:
   $$\text{Total Bala}_i = \text{Sthana} + \text{Dig} + \text{Nathonnatha} + \text{Paksha} + \text{Tribhaga} + \text{Hora}$$
4. Calculate differences:
   $$b\_diff = |\text{Total Bala}_1 - \text{Total Bala}_2|$$
   $$dia\_diff = |\text{Diameter}_1 - \text{Diameter}_2|$$
   - `const.planets_disc_diameters = [-1, -1, 9.4, 6.6, 190.4, 16.6, 158.0, -1, -1]`
     - Mars: `9.4`
     - Mercury: `6.6`
     - Jupiter: `190.4`
     - Venus: `16.6`
     - Saturn: `158.0`
5. Planetary War Score:
   $$y\_bala = \text{round}\left(\frac{b\_diff}{dia\_diff}, 2\right)$$
   - Winner (`indices[0]`): $+y\_bala$
   - Loser (`indices[1]`): $-y\_bala$

#### Code
```python
def _yuddha_bala(jd, place):
    yb = [0 for _ in const.SUN_TO_SATURN]
    pp = drik.dhasavarga(jd, place, divisional_chart_factor=1)[:7]
    p_longs = [h * 30 + long for _, (h, long) in pp]
    ce = sorted(utils.closest_elements(p_longs, p_longs))
    indices = [p_longs.index(v) for v in ce]
    if any([sm == i for sm in [const.SUN_ID, const.MOON_ID] for i in indices]):
        return yb  # All Zero
    sb = _sthana_bala(jd, place)
    dgb = _dig_bala(jd, place)
    nb = _nathonnath_bala(jd, place)
    pb = _paksha_bala(jd, place)
    tb = _tribhaga_bala(jd, place)
    hb = _hora_bala(jd, place)
    bala_totals = [0 for _ in const.SUN_TO_SATURN]
    for i in indices:
        bala_totals[i] += sb[i]
        bala_totals[i] += dgb[i]
        bala_totals[i] += nb[i]
        bala_totals[i] += pb[i]
        bala_totals[i] += tb[i]
        bala_totals[i] += hb[i]
    b_diff = abs(bala_totals[indices[0]] - bala_totals[indices[1]])
    dia_diff = abs(const.planets_disc_diameters[indices[0]] - const.planets_disc_diameters[indices[1]])
    y_bala = round(b_diff / dia_diff, 2)
    yb[indices[0]] = y_bala
    yb[indices[1]] = -y_bala
    return yb
```

---

## 4. Master Constants Reference Table

| Constant Name | Location | Definition / Values | Usage |
|---|---|---|---|
| `SUN_TO_SATURN` | `const.py` | `[0, 1, 2, 3, 4, 5, 6]` | 7 planets in Shadbala |
| `use_saravali_formula_for_uccha_bala` | `const.py` | `True` | Uccha Bala: $pd/3$ (Saravali) vs $pd/180 \times 20$ (PVR) |
| `planet_deep_exaltation_longitudes` | `const.py` | `[10.0, 33.0, 298.0, 165.0, 95.0, 357.0, 200.0]` | Deep exaltation degrees |
| `planet_deep_debilitation_longitudes`| `const.py` | `[(e+180)%360 for e in exaltation]` | Deep debilitation degrees |
| `sapthavargaja_factors` | `const.py` | `[1, 2, 3, 7, 9, 12, 30]` | Saptavarga divisional factors |
| `_house_owners_list` | `const.py` | `[2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4]` | Sign lords 0..11 |
| `moola_trikona_of_planets` | `const.py` | `[4, 1, 0, 5, 8, 6, 10, 5, 11]` | Moolatrikona signs (Sun: Leo, Moon: Taurus, Mars: Aries, etc.) |
| `odd_signs` | `const.py` | `[0, 2, 4, 6, 8, 10]` | Odd signs for Ojayugma Bala |
| `even_signs` | `const.py` | `[1, 3, 5, 7, 9, 11]` | Even signs for Ojayugma Bala |
| `dreshkon_bala_list` | `const.py` | `[(0, 2, 4), (3, 6), (1, 5)]` | Drekkana 1/2/3 beneficiaries |
| `temporary_friend_raasi_positions` | `const.py` | `[1, 2, 3, 9, 10, 11]` | Houses 2, 3, 4, 10, 11, 12 from planet |
| `temporary_enemy_raasi_positions` | `const.py` | `[0, 4, 5, 6, 7, 8]` | Houses 1, 5, 6, 7, 8, 9 from planet |
| `abdahipathi_weekdays` | `const.py` | `[2, 3, 4, 5, 6, 0, 1]` | Order of day lords starting from Tuesday |
| `hora_bala_hora_order` | `const.py` | `[6, 4, 2, 0, 5, 3, 1]` | Hora descending orbital speed order |
| `planets_disc_diameters` | `const.py` | `[-1, -1, 9.4, 6.6, 190.4, 16.6, 158.0, -1, -1]` | Disc diameters for Yuddha Bala |
| `shad_bala_factors` | `const.py` | `[5, 6, 5, 7, 6.5, 5.5, 5]` | Minimum required Shadbala in Rupas |

---

## 5. Summary of Key Implementation Nuances

1. **Saptavargaja Bala D-2 Hora Chart**: When $dcf = 2$, PyJHora specifically routes to `charts.hora_chart(planet_positions_in_rasi, chart_method=2)` rather than standard non-cyclic charts.
2. **Moolatrikona in Saptavargaja**: 45 virupas are awarded **only in D-1** ($dcf == 1$). In all other divisional charts ($dcf \in \{2, 3, 7, 9, 12, 30\}$), a planet in its Moolatrikona sign is scored as Swastha (30 virupas) or based on compound relationship.
3. **Ayana Bala Sun Doubling**: The Sun's Ayana Bala is doubled (`ab[0] *= 2`) per standard classical rules (since Sun is the source of all Ayana movement).
4. **Paksha Bala Moon Doubling**: Moon's Paksha Bala is doubled (`pbp[1] *= 2`) because lunar phase strength is the primary manifestation of Moon's vitality.
5. **Tribhaga Bala Jupiter Invariance**: Jupiter unconditionally receives 60 virupas at all times, in addition to whichever planet rules the specific 1/3 diurnal or nocturnal segment.
6. **Mercury Nathonnatha Bala Invariance**: Mercury unconditionally receives 60 virupas day and night.
