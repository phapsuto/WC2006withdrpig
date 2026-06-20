// World Cup 2026 Match & Betting Odds Simulator
// Updated with REAL tournament results through June 16, 2026

const LEAGUES = {
  WC_GPA: { name: "Bảng A • World Cup 2026", country: "Mexico" },
  WC_GPB: { name: "Bảng B • World Cup 2026", country: "Canada" },
  WC_GPC: { name: "Bảng C • World Cup 2026", country: "Mỹ" },
  WC_GPD: { name: "Bảng D • World Cup 2026", country: "Mỹ" },
  WC_GPE: { name: "Bảng E • World Cup 2026", country: "Mỹ" },
  WC_GPF: { name: "Bảng F • World Cup 2026", country: "Mỹ/Canada" },
  WC_GPG: { name: "Bảng G • World Cup 2026", country: "Mỹ" },
  WC_GPH: { name: "Bảng H • World Cup 2026", country: "Mỹ/Mexico" },
  WC_GPI: { name: "Bảng I • World Cup 2026", country: "Mỹ" },
  WC_GPJ: { name: "Bảng J • World Cup 2026", country: "Mỹ" },
  WC_GPK: { name: "Bảng K • World Cup 2026", country: "Mỹ" },
  WC_GPL: { name: "Bảng L • World Cup 2026", country: "Canada/Mexico" }
};

export const TEAMS = {
  // Group A
  MEX: { name: "Mexico", short: "MEX", flag: "mx", color: "#006847", textColor: "#ffffff" },
  RSA: { name: "Nam Phi", short: "RSA", flag: "za", color: "#ffb612", textColor: "#000000" },
  KOR: { name: "Hàn Quốc", short: "KOR", flag: "kr", color: "#c21e26", textColor: "#ffffff" },
  CZE: { name: "Séc", short: "CZE", flag: "cz", color: "#ffffff", textColor: "#11457b" },
  // Group B
  CAN: { name: "Canada", short: "CAN", flag: "ca", color: "#ff0000", textColor: "#ffffff" },
  BIH: { name: "Bosnia & Hz.", short: "BIH", flag: "ba", color: "#002f6c", textColor: "#ffffff" },
  QAT: { name: "Qatar", short: "QAT", flag: "qa", color: "#8b0000", textColor: "#ffffff" },
  SUI: { name: "Thụy Sĩ", short: "SUI", flag: "ch", color: "#ff0000", textColor: "#ffffff" },
  // Group C
  BRA: { name: "Brazil", short: "BRA", flag: "br", color: "#009739", textColor: "#fedd00" },
  MAR: { name: "Morocco", short: "MAR", flag: "ma", color: "#c1272d", textColor: "#ffffff" },
  SCO: { name: "Scotland", short: "SCO", flag: "gb-sct", color: "#003399", textColor: "#ffffff" },
  HAI: { name: "Haiti", short: "HAI", flag: "ht", color: "#00209f", textColor: "#ffffff" },
  // Group D
  USA: { name: "Mỹ", short: "USA", flag: "us", color: "#002868", textColor: "#ffffff" },
  PAR: { name: "Paraguay", short: "PAR", flag: "py", color: "#d52b1e", textColor: "#ffffff" },
  AUS: { name: "Úc", short: "AUS", flag: "au", color: "#00843d", textColor: "#ffd700" },
  TUR: { name: "Thổ Nhĩ Kỳ", short: "TUR", flag: "tr", color: "#e30a17", textColor: "#ffffff" },
  // Group E
  GER: { name: "Đức", short: "GER", flag: "de", color: "#000000", textColor: "#ffffff" },
  CUR: { name: "Curaçao", short: "CUR", flag: "cw", color: "#002b7f", textColor: "#ffffff" },
  CIV: { name: "Bờ Biển Ngà", short: "CIV", flag: "ci", color: "#f77f00", textColor: "#ffffff" },
  ECU: { name: "Ecuador", short: "ECU", flag: "ec", color: "#ffd100", textColor: "#003893" },
  // Group F
  NED: { name: "Hà Lan", short: "NED", flag: "nl", color: "#ff6600", textColor: "#ffffff" },
  JPN: { name: "Nhật Bản", short: "JPN", flag: "jp", color: "#bc002d", textColor: "#ffffff" },
  SWE: { name: "Thụy Điển", short: "SWE", flag: "se", color: "#006aa7", textColor: "#fecc02" },
  TUN: { name: "Tunisia", short: "TUN", flag: "tn", color: "#e70013", textColor: "#ffffff" },
  // Group G
  BEL: { name: "Bỉ", short: "BEL", flag: "be", color: "#000000", textColor: "#ffd700" },
  EGY: { name: "Ai Cập", short: "EGY", flag: "eg", color: "#c8102e", textColor: "#ffffff" },
  IRN: { name: "Iran", short: "IRN", flag: "ir", color: "#239f40", textColor: "#ffffff" },
  NZL: { name: "New Zealand", short: "NZL", flag: "nz", color: "#000000", textColor: "#ffffff" },
  // Group H
  ESP: { name: "Tây Ban Nha", short: "ESP", flag: "es", color: "#c60b1e", textColor: "#ffc400" },
  CPV: { name: "Cape Verde", short: "CPV", flag: "cv", color: "#003893", textColor: "#ffffff" },
  KSA: { name: "Ả Rập Saudi", short: "KSA", flag: "sa", color: "#006c35", textColor: "#ffffff" },
  URU: { name: "Uruguay", short: "URU", flag: "uy", color: "#5cbfeb", textColor: "#ffffff" },
  // Group I
  FRA: { name: "Pháp", short: "FRA", flag: "fr", color: "#002654", textColor: "#ffffff" },
  SEN: { name: "Senegal", short: "SEN", flag: "sn", color: "#00853f", textColor: "#ffffff" },
  IRQ: { name: "Iraq", short: "IRQ", flag: "iq", color: "#000000", textColor: "#ffffff" },
  NOR: { name: "Na Uy", short: "NOR", flag: "no", color: "#ef2b2d", textColor: "#ffffff" },
  // Group J
  ARG: { name: "Argentina", short: "ARG", flag: "ar", color: "#75aadb", textColor: "#ffffff" },
  ALG: { name: "Algeria", short: "ALG", flag: "dz", color: "#006233", textColor: "#ffffff" },
  AUT: { name: "Áo", short: "AUT", flag: "at", color: "#ed2939", textColor: "#ffffff" },
  JOR: { name: "Jordan", short: "JOR", flag: "jo", color: "#000000", textColor: "#ffffff" },
  // Group K
  POR: { name: "Bồ Đào Nha", short: "POR", flag: "pt", color: "#006600", textColor: "#ff0000" },
  COL: { name: "Colombia", short: "COL", flag: "co", color: "#fcd116", textColor: "#003893" },
  UZB: { name: "Uzbekistan", short: "UZB", flag: "uz", color: "#1eb53a", textColor: "#ffffff" },
  COD: { name: "Congo DR", short: "COD", flag: "cd", color: "#007fff", textColor: "#ffffff" },
  // Group L
  ENG: { name: "Anh", short: "ENG", flag: "gb-eng", color: "#ffffff", textColor: "#cf081f" },
  CRO: { name: "Croatia", short: "CRO", flag: "hr", color: "#ffffff", textColor: "#cf081f" },
  GHA: { name: "Ghana", short: "GHA", flag: "gh", color: "#006b3f", textColor: "#fcd116" },
  PAN: { name: "Panama", short: "PAN", flag: "pa", color: "#005293", textColor: "#ffffff" }
};

// ==================== REAL MATCH DATA ====================
// All results updated with real WC2026 scores as of June 16, 2026

let matches = [
  // ─────────────────── GROUP A (June 11) ───────────────────
  {
    id: "a1",
    league: LEAGUES.WC_GPA,
    home: TEAMS.MEX,
    away: TEAMS.RSA,
    homeScore: 2,
    awayScore: 0,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 58, away: 42 },
      shots: { home: 15, away: 8 },
      shotsOnTarget: { home: 6, away: 3 },
      fouls: { home: 12, away: 14 },
      corners: { home: 5, away: 3 },
      yellowCards: { home: 1, away: 2 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 9, type: "GOAL", team: "home", detail: "J. Quiñones" },
      { minute: 49, type: "RED", team: "away", detail: "S. Sithole" },
      { minute: 67, type: "GOAL", team: "home", detail: "R. Jiménez" },
      { minute: 84, type: "RED", team: "away", detail: "T. Zwane" },
      { minute: 92, type: "RED", team: "home", detail: "C. Montes" }
    ],
    lineups: {
      home: [
        { number: 13, name: "G. Ochoa", role: "GK", x: 50, y: 90 },
        { number: 2, name: "J. Sanchez", role: "DF", x: 85, y: 70 },
        { number: 3, name: "C. Montes", role: "DF", x: 62, y: 75 },
        { number: 5, name: "J. Vasquez", role: "DF", x: 38, y: 75 },
        { number: 23, name: "J. Gallardo", role: "DF", x: 15, y: 70 },
        { number: 4, name: "Edson Alvarez", role: "MF", x: 50, y: 52 },
        { number: 14, name: "L. Chavez", role: "MF", x: 25, y: 45 },
        { number: 8, name: "C. Rodriguez", role: "MF", x: 75, y: 45 },
        { number: 22, name: "H. Lozano", role: "FW", x: 20, y: 20 },
        { number: 11, name: "S. Gimenez", role: "FW", x: 50, y: 15 },
        { number: 15, name: "U. Antuna", role: "FW", x: 80, y: 20 }
      ],
      away: [
        { number: 1, name: "R. Williams", role: "GK", x: 50, y: 90 },
        { number: 2, name: "K. Mudau", role: "DF", x: 85, y: 70 },
        { number: 20, name: "G. Kekana", role: "DF", x: 62, y: 75 },
        { number: 5, name: "M. Mvala", role: "DF", x: 38, y: 75 },
        { number: 6, name: "A. Modiba", role: "DF", x: 15, y: 70 },
        { number: 4, name: "T. Mokoena", role: "MF", x: 65, y: 48 },
        { number: 13, name: "S. Sithole", role: "MF", x: 35, y: 48 },
        { number: 11, name: "T. Zwane", role: "MF", x: 50, y: 35 },
        { number: 18, name: "T. Morena", role: "FW", x: 80, y: 20 },
        { number: 9, name: "E. Makgopa", role: "FW", x: 50, y: 15 },
        { number: 10, name: "P. Tau", role: "FW", x: 20, y: 20 }
      ]
    },
    odds: {
      h2h: { home: 1.01, draw: 50.0, away: 150.0 },
      handicap: { line: "-2", home: 1.80, away: 2.10 },
      overUnder: { line: "2.5", over: 1.05, under: 9.00 }
    }
  },
  {
    id: "a2",
    league: LEAGUES.WC_GPA,
    home: TEAMS.KOR,
    away: TEAMS.CZE,
    homeScore: 2,
    awayScore: 1,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 54, away: 46 },
      shots: { home: 14, away: 11 },
      shotsOnTarget: { home: 5, away: 4 },
      fouls: { home: 10, away: 13 },
      corners: { home: 6, away: 4 },
      yellowCards: { home: 2, away: 3 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 55, type: "GOAL", team: "away", detail: "L. Krejčí" },
      { minute: 68, type: "GOAL", team: "home", detail: "Hwang In-beom" },
      { minute: 80, type: "GOAL", team: "home", detail: "Oh Hyeon-gyu" }
    ],
    lineups: {
      home: [
        { number: 21, name: "Jo Hyeon-woo", role: "GK", x: 50, y: 90 },
        { number: 22, name: "Seol Young-woo", role: "DF", x: 85, y: 70 },
        { number: 4, name: "Kim Min-jae", role: "DF", x: 62, y: 75 },
        { number: 15, name: "Cho Yu-min", role: "DF", x: 38, y: 75 },
        { number: 3, name: "Kim Jin-su", role: "DF", x: 15, y: 70 },
        { number: 6, name: "Hwang In-beom", role: "MF", x: 65, y: 48 },
        { number: 5, name: "Park Yong-woo", role: "MF", x: 35, y: 48 },
        { number: 10, name: "Lee Jae-sung", role: "MF", x: 50, y: 35 },
        { number: 18, name: "Lee Kang-in", role: "FW", x: 80, y: 20 },
        { number: 7, name: "Son Heung-min", role: "FW", x: 20, y: 20 },
        { number: 9, name: "Cho Gue-sung", role: "FW", x: 50, y: 15 }
      ],
      away: [
        { number: 1, name: "J. Stanek", role: "GK", x: 50, y: 90 },
        { number: 5, name: "V. Coufal", role: "DF", x: 85, y: 70 },
        { number: 3, name: "T. Holes", role: "DF", x: 62, y: 75 },
        { number: 4, name: "L. Krejci", role: "DF", x: 38, y: 75 },
        { number: 15, name: "D. Jurasek", role: "DF", x: 15, y: 70 },
        { number: 22, name: "T. Soucek", role: "MF", x: 65, y: 48 },
        { number: 14, name: "L. Provod", role: "MF", x: 35, y: 48 },
        { number: 7, name: "A. Barak", role: "MF", x: 50, y: 35 },
        { number: 10, name: "P. Schick", role: "FW", x: 50, y: 15 },
        { number: 11, name: "J. Kuchta", role: "FW", x: 80, y: 20 },
        { number: 9, name: "A. Hlozek", role: "FW", x: 20, y: 20 }
      ]
    },
    odds: {
      h2h: { home: 1.15, draw: 30.0, away: 80.0 },
      handicap: { line: "-1", home: 1.75, away: 2.15 },
      overUnder: { line: "2.5", over: 1.20, under: 5.50 }
    }
  },

  // ─────────────────── GROUP B (June 12-13) ───────────────────
  {
    id: "b1",
    league: LEAGUES.WC_GPB,
    home: TEAMS.CAN,
    away: TEAMS.BIH,
    homeScore: 1,
    awayScore: 1,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 52, away: 48 },
      shots: { home: 12, away: 9 },
      shotsOnTarget: { home: 4, away: 3 },
      fouls: { home: 8, away: 11 },
      corners: { home: 5, away: 3 },
      yellowCards: { home: 1, away: 2 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 21, type: "GOAL", team: "away", detail: "J. Lukić" },
      { minute: 78, type: "GOAL", team: "home", detail: "C. Larin" }
    ],
    lineups: {
      home: [
        { number: 1, name: "M. Crepeau", role: "GK", x: 50, y: 90 },
        { number: 2, name: "A. Johnston", role: "DF", x: 85, y: 70 },
        { number: 15, name: "M. Bombito", role: "DF", x: 62, y: 75 },
        { number: 4, name: "K. Miller", role: "DF", x: 38, y: 75 },
        { number: 19, name: "Alphonso Davies", role: "DF", x: 15, y: 70 },
        { number: 8, name: "I. Kone", role: "MF", x: 65, y: 48 },
        { number: 7, name: "S. Eustaquio", role: "MF", x: 35, y: 48 },
        { number: 21, name: "J. Shaffelburg", role: "MF", x: 50, y: 35 },
        { number: 17, name: "T. Buchanan", role: "FW", x: 80, y: 20 },
        { number: 20, name: "Jonathan David", role: "FW", x: 50, y: 15 },
        { number: 9, name: "C. Larin", role: "FW", x: 20, y: 20 }
      ],
      away: [
        { number: 1, name: "N. Vasilj", role: "GK", x: 50, y: 90 },
        { number: 16, name: "A. Ahmedhodzic", role: "DF", x: 85, y: 70 },
        { number: 3, name: "N. Radeljic", role: "DF", x: 62, y: 75 },
        { number: 5, name: "E. Bicakcic", role: "DF", x: 38, y: 75 },
        { number: 23, name: "S. Kolasinac", role: "DF", x: 15, y: 70 },
        { number: 8, name: "H. Hajradinovic", role: "MF", x: 65, y: 48 },
        { number: 20, name: "B. Tahirovic", role: "MF", x: 35, y: 48 },
        { number: 7, name: "E. Saric", role: "MF", x: 50, y: 35 },
        { number: 10, name: "E. Dzeko", role: "FW", x: 50, y: 15 },
        { number: 9, name: "H. Tabakovic", role: "FW", x: 80, y: 20 },
        { number: 11, name: "E. Demirovic", role: "FW", x: 20, y: 20 }
      ]
    },
    odds: {
      h2h: { home: 2.50, draw: 1.10, away: 50.0 },
      handicap: { line: "0", home: 1.90, away: 1.90 },
      overUnder: { line: "2.5", over: 2.10, under: 1.70 }
    }
  },
  {
    id: "b2",
    league: LEAGUES.WC_GPB,
    home: TEAMS.QAT,
    away: TEAMS.SUI,
    homeScore: 1,
    awayScore: 1,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 42, away: 58 },
      shots: { home: 8, away: 14 },
      shotsOnTarget: { home: 3, away: 5 },
      fouls: { home: 14, away: 9 },
      corners: { home: 3, away: 6 },
      yellowCards: { home: 2, away: 1 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 17, type: "GOAL", team: "away", detail: "B. Embolo (pen.)" },
      { minute: 94, type: "GOAL", team: "home", detail: "M. Muheim (p.g)" }
    ],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 3.00, draw: 1.10, away: 35.0 },
      handicap: { line: "0", home: 1.90, away: 1.90 },
      overUnder: { line: "2.5", over: 2.00, under: 1.80 }
    }
  },

  // ─────────────────── GROUP C (June 13) ───────────────────
  {
    id: "c1",
    league: LEAGUES.WC_GPC,
    home: TEAMS.BRA,
    away: TEAMS.MAR,
    homeScore: 1,
    awayScore: 1,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 60, away: 40 },
      shots: { home: 16, away: 9 },
      shotsOnTarget: { home: 5, away: 3 },
      fouls: { home: 11, away: 15 },
      corners: { home: 7, away: 3 },
      yellowCards: { home: 1, away: 3 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 21, type: "GOAL", team: "away", detail: "I. Saibari" },
      { minute: 32, type: "GOAL", team: "home", detail: "Vinícius Jr." }
    ],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 2.50, draw: 1.10, away: 50.0 },
      handicap: { line: "0", home: 1.90, away: 1.90 },
      overUnder: { line: "2.5", over: 2.00, under: 1.80 }
    }
  },
  {
    id: "c2",
    league: LEAGUES.WC_GPC,
    home: TEAMS.SCO,
    away: TEAMS.HAI,
    homeScore: 1,
    awayScore: 0,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 63, away: 37 },
      shots: { home: 13, away: 5 },
      shotsOnTarget: { home: 4, away: 1 },
      fouls: { home: 8, away: 12 },
      corners: { home: 6, away: 2 },
      yellowCards: { home: 0, away: 2 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 52, type: "GOAL", team: "home", detail: "J. McGinn" },
      { minute: 70, type: "YELLOW", team: "away", detail: "D. Derilus" }
    ],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 1.05, draw: 30.0, away: 80.0 },
      handicap: { line: "-1", home: 1.85, away: 2.00 },
      overUnder: { line: "0.5", over: 1.10, under: 7.00 }
    }
  },

  // ─────────────────── GROUP D (June 12-13) ───────────────────
  {
    id: "d1",
    league: LEAGUES.WC_GPD,
    home: TEAMS.USA,
    away: TEAMS.PAR,
    homeScore: 4,
    awayScore: 1,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 62, away: 38 },
      shots: { home: 19, away: 7 },
      shotsOnTarget: { home: 8, away: 2 },
      fouls: { home: 9, away: 14 },
      corners: { home: 7, away: 2 },
      yellowCards: { home: 1, away: 3 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 7, type: "GOAL", team: "home", detail: "D. Bobadilla (p.g)" },
      { minute: 30, type: "GOAL", team: "home", detail: "F. Balogun" },
      { minute: 42, type: "GOAL", team: "home", detail: "F. Balogun" },
      { minute: 73, type: "GOAL", team: "away", detail: "Maurício" },
      { minute: 97, type: "GOAL", team: "home", detail: "G. Reyna" }
    ],
    lineups: {
      home: [
        { number: 1, name: "Matt Turner", role: "GK", x: 50, y: 90 },
        { number: 2, name: "Sergino Dest", role: "DF", x: 85, y: 70 },
        { number: 3, name: "Chris Richards", role: "DF", x: 62, y: 75 },
        { number: 13, name: "Tim Ream", role: "DF", x: 38, y: 75 },
        { number: 5, name: "Antonee Robinson", role: "DF", x: 15, y: 70 },
        { number: 4, name: "Tyler Adams", role: "MF", x: 50, y: 52 },
        { number: 6, name: "Yunus Musah", role: "MF", x: 25, y: 45 },
        { number: 8, name: "Weston McKennie", role: "MF", x: 75, y: 45 },
        { number: 21, name: "Timothy Weah", role: "FW", x: 80, y: 20 },
        { number: 9, name: "Folarin Balogun", role: "FW", x: 50, y: 15 },
        { number: 10, name: "Christian Pulisic", role: "FW", x: 20, y: 20 }
      ],
      away: [
        { number: 12, name: "C. Coronel", role: "GK", x: 50, y: 90 },
        { number: 2, name: "I. Velazquez", role: "DF", x: 85, y: 70 },
        { number: 5, name: "F. Balbuena", role: "DF", x: 62, y: 75 },
        { number: 3, name: "O. Alderete", role: "DF", x: 38, y: 75 },
        { number: 4, name: "M. Espinoza", role: "DF", x: 15, y: 70 },
        { number: 6, name: "A. Cubas", role: "MF", x: 65, y: 48 },
        { number: 8, name: "D. Gomez", role: "MF", x: 35, y: 48 },
        { number: 10, name: "M. Almiron", role: "MF", x: 50, y: 35 },
        { number: 7, name: "J. Enciso", role: "FW", x: 80, y: 20 },
        { number: 9, name: "A. Sanabria", role: "FW", x: 50, y: 15 },
        { number: 11, name: "R. Sosa", role: "FW", x: 20, y: 20 }
      ]
    },
    odds: {
      h2h: { home: 1.01, draw: 50.0, away: 150.0 },
      handicap: { line: "-3", home: 1.70, away: 2.20 },
      overUnder: { line: "4.5", over: 1.20, under: 5.00 }
    }
  },
  {
    id: "d2",
    league: LEAGUES.WC_GPD,
    home: TEAMS.AUS,
    away: TEAMS.TUR,
    homeScore: 2,
    awayScore: 0,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 48, away: 52 },
      shots: { home: 11, away: 13 },
      shotsOnTarget: { home: 5, away: 4 },
      fouls: { home: 10, away: 12 },
      corners: { home: 4, away: 5 },
      yellowCards: { home: 1, away: 2 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 27, type: "GOAL", team: "home", detail: "N. Irankunda" },
      { minute: 75, type: "GOAL", team: "home", detail: "C. Metcalfe" }
    ],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 1.05, draw: 30.0, away: 80.0 },
      handicap: { line: "-2", home: 1.80, away: 2.10 },
      overUnder: { line: "1.5", over: 1.15, under: 6.00 }
    }
  },

  // ─────────────────── GROUP E (June 14) ───────────────────
  {
    id: "e1",
    league: LEAGUES.WC_GPE,
    home: TEAMS.GER,
    away: TEAMS.CUR,
    homeScore: 7,
    awayScore: 1,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 72, away: 28 },
      shots: { home: 28, away: 5 },
      shotsOnTarget: { home: 12, away: 2 },
      fouls: { home: 6, away: 16 },
      corners: { home: 12, away: 1 },
      yellowCards: { home: 0, away: 3 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 6, type: "GOAL", team: "home", detail: "F. Nmecha" },
      { minute: 21, type: "GOAL", team: "away", detail: "L. Comenencia" },
      { minute: 38, type: "GOAL", team: "home", detail: "N. Schlotterbeck" },
      { minute: 50, type: "GOAL", team: "home", detail: "K. Havertz (pen.)" },
      { minute: 47, type: "GOAL", team: "home", detail: "J. Musiala" },
      { minute: 68, type: "GOAL", team: "home", detail: "N. Brown" },
      { minute: 78, type: "GOAL", team: "home", detail: "D. Undav" },
      { minute: 88, type: "GOAL", team: "home", detail: "K. Havertz" }
    ],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 1.01, draw: 50.0, away: 200.0 },
      handicap: { line: "-6", home: 1.60, away: 2.30 },
      overUnder: { line: "7.5", over: 1.30, under: 3.50 }
    }
  },
  {
    id: "e2",
    league: LEAGUES.WC_GPE,
    home: TEAMS.CIV,
    away: TEAMS.ECU,
    homeScore: 1,
    awayScore: 0,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 45, away: 55 },
      shots: { home: 10, away: 12 },
      shotsOnTarget: { home: 4, away: 3 },
      fouls: { home: 13, away: 10 },
      corners: { home: 3, away: 5 },
      yellowCards: { home: 2, away: 2 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 90, type: "GOAL", team: "home", detail: "A. Diallo" }
    ],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 1.08, draw: 25.0, away: 60.0 },
      handicap: { line: "-1", home: 1.85, away: 2.00 },
      overUnder: { line: "0.5", over: 1.15, under: 6.00 }
    }
  },

  // ─────────────────── GROUP F (June 14) ───────────────────
  {
    id: "f1",
    league: LEAGUES.WC_GPF,
    home: TEAMS.NED,
    away: TEAMS.JPN,
    homeScore: 2,
    awayScore: 2,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 55, away: 45 },
      shots: { home: 16, away: 14 },
      shotsOnTarget: { home: 6, away: 5 },
      fouls: { home: 11, away: 9 },
      corners: { home: 5, away: 4 },
      yellowCards: { home: 2, away: 1 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 50, type: "GOAL", team: "home", detail: "V. van Dijk" },
      { minute: 57, type: "GOAL", team: "away", detail: "K. Nakamura" },
      { minute: 64, type: "GOAL", team: "home", detail: "C. Summerville" },
      { minute: 89, type: "GOAL", team: "away", detail: "D. Kamada" }
    ],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 2.50, draw: 1.10, away: 30.0 },
      handicap: { line: "0", home: 1.90, away: 1.90 },
      overUnder: { line: "3.5", over: 1.50, under: 2.50 }
    }
  },
  {
    id: "f2",
    league: LEAGUES.WC_GPF,
    home: TEAMS.SWE,
    away: TEAMS.TUN,
    homeScore: 5,
    awayScore: 1,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 58, away: 42 },
      shots: { home: 20, away: 7 },
      shotsOnTarget: { home: 9, away: 2 },
      fouls: { home: 8, away: 14 },
      corners: { home: 8, away: 2 },
      yellowCards: { home: 1, away: 3 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 7, type: "GOAL", team: "home", detail: "Y. Ayari" },
      { minute: 30, type: "GOAL", team: "home", detail: "A. Isak" },
      { minute: 43, type: "GOAL", team: "away", detail: "O. Rekik" },
      { minute: 59, type: "GOAL", team: "home", detail: "V. Gyökeres" },
      { minute: 84, type: "GOAL", team: "home", detail: "M. Svanberg" },
      { minute: 96, type: "GOAL", team: "home", detail: "Y. Ayari" }
    ],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 1.01, draw: 50.0, away: 150.0 },
      handicap: { line: "-4", home: 1.65, away: 2.25 },
      overUnder: { line: "5.5", over: 1.25, under: 4.00 }
    }
  },

  // ─────────────────── GROUP G (June 15) ───────────────────
  {
    id: "g1",
    league: LEAGUES.WC_GPG,
    home: TEAMS.BEL,
    away: TEAMS.EGY,
    homeScore: 1,
    awayScore: 1,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 58, away: 42 },
      shots: { home: 14, away: 10 },
      shotsOnTarget: { home: 5, away: 3 },
      fouls: { home: 10, away: 12 },
      corners: { home: 6, away: 3 },
      yellowCards: { home: 1, away: 2 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 19, type: "GOAL", team: "away", detail: "Emam Ashour" },
      { minute: 66, type: "GOAL", team: "home", detail: "M. Hany (p.g)" }
    ],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 2.50, draw: 1.10, away: 50.0 },
      handicap: { line: "0", home: 1.90, away: 1.90 },
      overUnder: { line: "2.5", over: 2.10, under: 1.70 }
    }
  },
  {
    id: "g2",
    league: LEAGUES.WC_GPG,
    home: TEAMS.IRN,
    away: TEAMS.NZL,
    homeScore: 2,
    awayScore: 2,
    status: "FINISHED",
    minute: 90,
    isHistorical: true,
    stats: {
      possession: { home: 54, away: 46 },
      shots: { home: 14, away: 11 },
      shotsOnTarget: { home: 6, away: 4 },
      fouls: { home: 11, away: 14 },
      corners: { home: 5, away: 4 },
      yellowCards: { home: 2, away: 2 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 7, type: "GOAL", team: "away", detail: "Eli Just" },
      { minute: 32, type: "GOAL", team: "home", detail: "Ramin Rezaeian" },
      { minute: 54, type: "GOAL", team: "away", detail: "Eli Just" },
      { minute: 64, type: "GOAL", team: "home", detail: "Mohammad Mohebi" }
    ],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 2.80, draw: 1.10, away: 4.50 },
      handicap: { line: "0", home: 1.90, away: 1.90 },
      overUnder: { line: "4.5", over: 1.05, under: 9.00 }
    }
  },

  // ─────────────────── GROUP H (June 15) ───────────────────
  {
    id: "h1",
    league: LEAGUES.WC_GPH,
    home: TEAMS.ESP,
    away: TEAMS.CPV,
    homeScore: 0,
    awayScore: 0,
    status: "FINISHED",
    minute: 90,
    stats: {
      possession: { home: 72, away: 28 },
      shots: { home: 22, away: 3 },
      shotsOnTarget: { home: 7, away: 0 },
      fouls: { home: 7, away: 14 },
      corners: { home: 10, away: 1 },
      yellowCards: { home: 0, away: 4 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 35, type: "YELLOW", team: "away", detail: "K. Borges" },
      { minute: 58, type: "YELLOW", team: "away", detail: "R. Lopes" },
      { minute: 72, type: "YELLOW", team: "away", detail: "D. Tavares" }
    ],
    lineups: {
      home: [
        { number: 23, name: "Unai Simon", role: "GK", x: 50, y: 90 },
        { number: 2, name: "Dani Carvajal", role: "DF", x: 85, y: 70 },
        { number: 3, name: "Robin Le Normand", role: "DF", x: 62, y: 75 },
        { number: 14, name: "Aymeric Laporte", role: "DF", x: 38, y: 75 },
        { number: 24, name: "Marc Cucurella", role: "DF", x: 15, y: 70 },
        { number: 16, name: "Rodri", role: "MF", x: 50, y: 52 },
        { number: 8, name: "Fabian Ruiz", role: "MF", x: 32, y: 40 },
        { number: 20, name: "Pedri", role: "MF", x: 68, y: 40 },
        { number: 19, name: "Lamine Yamal", role: "FW", x: 80, y: 20 },
        { number: 7, name: "Alvaro Morata", role: "FW", x: 50, y: 15 },
        { number: 17, name: "Nico Williams", role: "FW", x: 20, y: 20 }
      ],
      away: []
    },
    odds: {
      h2h: { home: 2.50, draw: 1.05, away: 80.0 },
      handicap: { line: "0", home: 1.90, away: 1.90 },
      overUnder: { line: "0.5", over: 3.50, under: 1.25 }
    }
  },

  {
    id: "h2",
    league: LEAGUES.WC_GPH,
    home: TEAMS.KSA,
    away: TEAMS.URU,
    homeScore: 1,
    awayScore: 1,
    status: "FINISHED",
    minute: 90,
    isHistorical: true,
    stats: {
      possession: { home: 40, away: 60 },
      shots: { home: 7, away: 15 },
      shotsOnTarget: { home: 2, away: 5 },
      fouls: { home: 15, away: 9 },
      corners: { home: 2, away: 7 },
      yellowCards: { home: 3, away: 1 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 38, type: "YELLOW", team: "home", detail: "A. Al-Bishi" },
      { minute: 41, type: "GOAL", team: "home", detail: "Abdallh Alamri" },
      { minute: 72, type: "YELLOW", team: "home", detail: "S. Al-Dawsari" },
      { minute: 80, type: "GOAL", team: "away", detail: "M. Araujo" }
    ],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 2.80, draw: 1.10, away: 2.80 },
      handicap: { line: "0", home: 1.90, away: 1.90 },
      overUnder: { line: "2.5", over: 1.10, under: 6.00 }
    }
  },

  // ─────────────────── GROUP I (June 16 - HÔM NAY) ───────────────────
  {
    id: "i1",
    league: LEAGUES.WC_GPI,
    home: TEAMS.FRA,
    away: TEAMS.SEN,
    homeScore: 0,
    awayScore: 0,
    status: "UPCOMING",
    minute: 0,
    stats: null,
    timeline: [],
    lineups: {
      home: [
        { number: 1, name: "M. Maignan", role: "GK", x: 50, y: 90 },
        { number: 2, name: "J. Koundé", role: "DF", x: 85, y: 70 },
        { number: 4, name: "D. Upamecano", role: "DF", x: 62, y: 75 },
        { number: 21, name: "L. Hernandez", role: "DF", x: 38, y: 75 },
        { number: 22, name: "T. Hernandez", role: "DF", x: 15, y: 70 },
        { number: 8, name: "A. Tchouameni", role: "MF", x: 50, y: 52 },
        { number: 6, name: "E. Camavinga", role: "MF", x: 30, y: 42 },
        { number: 14, name: "A. Rabiot", role: "MF", x: 70, y: 42 },
        { number: 10, name: "K. Mbappé", role: "FW", x: 50, y: 15 },
        { number: 7, name: "A. Griezmann", role: "FW", x: 25, y: 22 },
        { number: 11, name: "O. Dembélé", role: "FW", x: 75, y: 22 }
      ],
      away: []
    },
    odds: {
      h2h: { home: 1.45, draw: 4.20, away: 7.50 },
      handicap: { line: "-1.5", home: 2.10, away: 1.75 },
      overUnder: { line: "2.5", over: 1.80, under: 2.00 }
    }
  },
  {
    id: "i2",
    league: LEAGUES.WC_GPI,
    home: TEAMS.IRQ,
    away: TEAMS.NOR,
    homeScore: 0,
    awayScore: 0,
    status: "UPCOMING",
    minute: 0,
    stats: null,
    timeline: [],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 3.50, draw: 3.20, away: 2.10 },
      handicap: { line: "+0.5", home: 1.85, away: 1.95 },
      overUnder: { line: "2.5", over: 2.00, under: 1.80 }
    }
  },

  // ─────────────────── GROUP J (June 16 - HÔM NAY) ───────────────────
  {
    id: "j1",
    league: LEAGUES.WC_GPJ,
    home: TEAMS.ARG,
    away: TEAMS.ALG,
    homeScore: 0,
    awayScore: 0,
    status: "UPCOMING",
    minute: 0,
    stats: null,
    timeline: [],
    lineups: {
      home: [
        { number: 23, name: "E. Martínez", role: "GK", x: 50, y: 90 },
        { number: 26, name: "N. Molina", role: "DF", x: 85, y: 70 },
        { number: 13, name: "C. Romero", role: "DF", x: 62, y: 75 },
        { number: 6, name: "L. Martínez", role: "DF", x: 38, y: 75 },
        { number: 3, name: "N. Tagliafico", role: "DF", x: 15, y: 70 },
        { number: 7, name: "R. De Paul", role: "MF", x: 65, y: 48 },
        { number: 5, name: "L. Paredes", role: "MF", x: 35, y: 48 },
        { number: 20, name: "E. Fernández", role: "MF", x: 50, y: 35 },
        { number: 10, name: "L. Messi", role: "FW", x: 75, y: 20 },
        { number: 9, name: "J. Álvarez", role: "FW", x: 50, y: 15 },
        { number: 11, name: "Á. Di María", role: "FW", x: 25, y: 20 }
      ],
      away: []
    },
    odds: {
      h2h: { home: 1.35, draw: 4.80, away: 9.00 },
      handicap: { line: "-1.5", home: 1.95, away: 1.85 },
      overUnder: { line: "2.5", over: 1.75, under: 2.05 }
    }
  },
  {
    id: "j2",
    league: LEAGUES.WC_GPJ,
    home: TEAMS.AUT,
    away: TEAMS.JOR,
    homeScore: 0,
    awayScore: 0,
    status: "UPCOMING",
    minute: 0,
    stats: null,
    timeline: [],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 1.65, draw: 3.60, away: 5.50 },
      handicap: { line: "-1", home: 1.90, away: 1.90 },
      overUnder: { line: "2.5", over: 1.85, under: 1.95 }
    }
  },

  // ─────────────────── GROUP K (June 17 - SẮP DIỄN RA) ───────────────────
  {
    id: "k1",
    league: LEAGUES.WC_GPK,
    home: TEAMS.POR,
    away: TEAMS.COL,
    homeScore: 0,
    awayScore: 0,
    status: "UPCOMING",
    minute: 0,
    stats: null,
    timeline: [],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 1.70, draw: 3.60, away: 5.00 },
      handicap: { line: "-0.5", home: 1.85, away: 1.95 },
      overUnder: { line: "2.5", over: 1.85, under: 1.95 }
    }
  },
  {
    id: "k2",
    league: LEAGUES.WC_GPK,
    home: TEAMS.UZB,
    away: TEAMS.COD,
    homeScore: 0,
    awayScore: 0,
    status: "UPCOMING",
    minute: 0,
    stats: null,
    timeline: [],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 2.20, draw: 3.20, away: 3.30 },
      handicap: { line: "0", home: 1.90, away: 1.90 },
      overUnder: { line: "2.5", over: 1.90, under: 1.90 }
    }
  },

  // ─────────────────── GROUP L (June 17 - SẮP DIỄN RA) ───────────────────
  {
    id: "l1",
    league: LEAGUES.WC_GPL,
    home: TEAMS.ENG,
    away: TEAMS.CRO,
    homeScore: 0,
    awayScore: 0,
    status: "UPCOMING",
    minute: 0,
    stats: null,
    timeline: [],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 1.80, draw: 3.40, away: 4.50 },
      handicap: { line: "-0.5", home: 1.85, away: 1.95 },
      overUnder: { line: "2.5", over: 1.90, under: 1.90 }
    }
  },
  {
    id: "l2",
    league: LEAGUES.WC_GPL,
    home: TEAMS.GHA,
    away: TEAMS.PAN,
    homeScore: 0,
    awayScore: 0,
    status: "UPCOMING",
    minute: 0,
    stats: null,
    timeline: [],
    lineups: { home: [], away: [] },
    odds: {
      h2h: { home: 1.75, draw: 3.50, away: 4.80 },
      handicap: { line: "-0.5", home: 1.90, away: 1.90 },
      overUnder: { line: "2.5", over: 1.90, under: 1.90 }
    }
  }
];

const SIMULATED_DETAILS = {
  a1: { date: "06/11/2026 15:30", stadiumId: "1" },
  a2: { date: "06/11/2026 19:00", stadiumId: "14" },
  b1: { date: "06/12/2026 17:00", stadiumId: "13" },
  b2: { date: "06/12/2026 20:00", stadiumId: "15" },
  c1: { date: "06/13/2026 15:00", stadiumId: "4" },
  c2: { date: "06/13/2026 18:00", stadiumId: "7" },
  d1: { date: "06/12/2026 19:00", stadiumId: "16" },
  d2: { date: "06/13/2026 21:00", stadiumId: "5" },
  e1: { date: "06/14/2026 15:00", stadiumId: "10" },
  e2: { date: "06/14/2026 18:00", stadiumId: "11" },
  f1: { date: "06/14/2026 21:00", stadiumId: "12" },
  f2: { date: "06/14/2026 17:00", stadiumId: "6" },
  g1: { date: "06/15/2026 15:00", stadiumId: "8" },
  g2: { date: "06/15/2026 18:00", stadiumId: "9" },
  h1: { date: "06/15/2026 21:00", stadiumId: "2" },
  h2: { date: "06/15/2026 19:30", stadiumId: "3" },
  i1: { date: "06/16/2026 15:00", stadiumId: "10" },
  i2: { date: "06/16/2026 18:00", stadiumId: "12" },
  j1: { date: "06/16/2026 21:00", stadiumId: "11" },
  j2: { date: "06/16/2026 19:30", stadiumId: "6" },
  k1: { date: "06/17/2026 15:00", stadiumId: "4" },
  k2: { date: "06/17/2026 18:00", stadiumId: "5" },
  l1: { date: "06/17/2026 21:00", stadiumId: "7" },
  l2: { date: "06/17/2026 19:30", stadiumId: "8" }
};

import { STADIUMS_INFO } from './worldcup26api';

const getVirtualNow = () => {
  let offsetHours = 0;
  try {
    const savedConfig = localStorage.getItem('football_app_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      offsetHours = parseFloat(parsed.virtualTimeOffset) || 0;
    }
  } catch { /* ignore */ }
  return new Date(Date.now() + offsetHours * 60 * 60 * 1000);
};

const getMatchKickoffTime = (match) => {
  if (!match.date) return null;
  const parts = match.date.split(' ');
  if (parts.length < 2) return null;
  const [datePart, timePart] = parts;
  let year, month, day, hour, minute;
  
  if (datePart.includes('/')) {
    const [m, d, y] = datePart.split('/');
    year = parseInt(y, 10);
    month = parseInt(m, 10) - 1;
    day = parseInt(d, 10);
  } else if (datePart.includes('-')) {
    const [y, m, d] = datePart.split('-');
    year = parseInt(y, 10);
    month = parseInt(m, 10) - 1;
    day = parseInt(d, 10);
  } else {
    return new Date(match.date);
  }
  
  const [hh, mm] = timePart.split(':');
  hour = parseInt(hh, 10);
  minute = parseInt(mm, 10);
  
  const stadium = STADIUMS_INFO[match.stadiumId] || { offset: -4 };
  const offset = stadium.offset;
  
  let utcTimestamp;
  if (datePart.includes('-')) {
    utcTimestamp = Date.UTC(year, month, day, hour, minute);
  } else {
    utcTimestamp = Date.UTC(year, month, day, hour, minute) - offset * 60 * 60 * 1000;
  }
  
  return new Date(utcTimestamp);
};

function createSeededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

const generateDeterministicMatchState = (originalMatch, currentMin, targetStatus) => {
  const rand = createSeededRandom(originalMatch.id);
  
  let homeScore = 0;
  let awayScore = 0;
  
  const stats = {
    possession: { home: 50, away: 50 },
    xg: { home: 0.0, away: 0.0 },
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    attacks: { home: 0, away: 0 },
    dangerousAttacks: { home: 0, away: 0 },
    passes: { home: 0, away: 0 },
    accuratePasses: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    offsides: { home: 0, away: 0 },
    saves: { home: 0, away: 0 },
    tackles: { home: 0, away: 0 },
    clearances: { home: 0, away: 0 },
    yellowCards: { home: 0, away: 0 },
    redCards: { home: 0, away: 0 }
  };
  
  const timeline = [];
  const odds = {
    h2h: { home: 1.85, draw: 3.40, away: 4.20 },
    handicap: { line: '-0.5', home: 1.90, away: 1.90 },
    overUnder: { line: '2.5', over: 1.85, under: 1.95 }
  };

  const limitMin = Math.min(90, currentMin);
  
  for (let m = 1; m <= limitMin; m++) {

    const eventRoll = rand();
    let eventAdded = false;
    
    if (eventRoll < 0.02) {
      const isHome = rand() < 0.55;
      eventAdded = true;
      if (isHome) {
        homeScore += 1;
        stats.shotsOnTarget.home += 1;
        stats.shots.home += 1;
        timeline.push({
          minute: m,
          type: "GOAL",
          team: "home",
          detail: PLAYER_POOLS[originalMatch.home.short]?.[Math.floor(rand() * PLAYER_POOLS[originalMatch.home.short].length)] || "Cầu thủ"
        });
      } else {
        awayScore += 1;
        stats.shotsOnTarget.away += 1;
        stats.shots.away += 1;
        timeline.push({
          minute: m,
          type: "GOAL",
          team: "away",
          detail: PLAYER_POOLS[originalMatch.away.short]?.[Math.floor(rand() * PLAYER_POOLS[originalMatch.away.short].length)] || "Cầu thủ"
        });
      }
    } else if (eventRoll < 0.06) {
      const isHome = rand() < 0.5;
      eventAdded = true;
      const isRed = rand() < 0.05;
      if (isHome) {
        if (isRed) {
          stats.redCards.home += 1;
          timeline.push({ 
            minute: m, 
            type: "RED", 
            team: "home", 
            detail: PLAYER_POOLS[originalMatch.home.short]?.[Math.floor(rand() * PLAYER_POOLS[originalMatch.home.short].length)] || "Cầu thủ" 
          });
        } else {
          stats.yellowCards.home += 1;
          timeline.push({ 
            minute: m, 
            type: "YELLOW", 
            team: "home", 
            detail: PLAYER_POOLS[originalMatch.home.short]?.[Math.floor(rand() * PLAYER_POOLS[originalMatch.home.short].length)] || "Cầu thủ" 
          });
        }
      } else {
        if (isRed) {
          stats.redCards.away += 1;
          timeline.push({ 
            minute: m, 
            type: "RED", 
            team: "away", 
            detail: PLAYER_POOLS[originalMatch.away.short]?.[Math.floor(rand() * PLAYER_POOLS[originalMatch.away.short].length)] || "Cầu thủ" 
          });
        } else {
          stats.yellowCards.away += 1;
          timeline.push({ 
            minute: m, 
            type: "YELLOW", 
            team: "away", 
            detail: PLAYER_POOLS[originalMatch.away.short]?.[Math.floor(rand() * PLAYER_POOLS[originalMatch.away.short].length)] || "Cầu thủ" 
          });
        }
      }
    } else {
      const statRoll = rand();
      if (statRoll < 0.15) {
        stats.shots.home += rand() < 0.6 ? 1 : 0;
        stats.shots.away += rand() < 0.4 ? 1 : 0;
        stats.corners.home += rand() < 0.2 ? 1 : 0;
        stats.corners.away += rand() < 0.2 ? 1 : 0;
        stats.fouls.home += rand() < 0.3 ? 1 : 0;
        stats.fouls.away += rand() < 0.3 ? 1 : 0;
      }
      const possChange = Math.floor(rand() * 3) - 1;
      stats.possession.home = Math.max(30, Math.min(70, stats.possession.home + possChange));
      stats.possession.away = 100 - stats.possession.home;
    }
    
    adjustOdds(odds, m, homeScore, awayScore, eventAdded);
  }

  stats.attacks.home = Math.round(stats.shots.home * 4.2 + rand() * 15);
  stats.attacks.away = Math.round(stats.shots.away * 4.2 + rand() * 15);
  stats.dangerousAttacks.home = Math.round(stats.shots.home * 2.1 + rand() * 8);
  stats.dangerousAttacks.away = Math.round(stats.shots.away * 2.1 + rand() * 8);
  
  stats.passes.home = Math.round(450 * (stats.possession.home / 100) + rand() * 50);
  stats.passes.away = Math.round(450 * (stats.possession.away / 100) + rand() * 50);
  stats.accuratePasses.home = Math.round(stats.passes.home * (0.78 + rand() * 0.1));
  stats.accuratePasses.away = Math.round(stats.passes.away * (0.78 + rand() * 0.1));
  
  stats.xg.home = parseFloat((stats.shotsOnTarget.home * 0.35 + (stats.shots.home - stats.shotsOnTarget.home) * 0.05 + rand() * 0.2).toFixed(2));
  stats.xg.away = parseFloat((stats.shotsOnTarget.away * 0.35 + (stats.shots.away - stats.shotsOnTarget.away) * 0.05 + rand() * 0.2).toFixed(2));
  
  stats.offsides.home = Math.floor(rand() * 4);
  stats.offsides.away = Math.floor(rand() * 4);
  stats.saves.home = Math.max(0, stats.shotsOnTarget.away - awayScore);
  stats.saves.away = Math.max(0, stats.shotsOnTarget.home - homeScore);
  
  stats.tackles.home = Math.round(12 + rand() * 8);
  stats.tackles.away = Math.round(12 + rand() * 8);
  stats.clearances.home = Math.round(10 + rand() * 12);
  stats.clearances.away = Math.round(10 + rand() * 12);

  return {
    ...originalMatch,
    status: targetStatus,
    minute: currentMin,
    homeScore,
    awayScore,
    stats,
    timeline,
    odds
  };
};

matches = matches.map(m => {
  const details = SIMULATED_DETAILS[m.id];
  const isFinishedOriginally = m.status === 'FINISHED';
  if (details) {
    return {
      ...m,
      local_date: details.date,
      date: details.date,
      stadiumId: details.stadiumId,
      isHistorical: m.isHistorical || isFinishedOriginally
    };
  }
  return {
    ...m,
    isHistorical: m.isHistorical || isFinishedOriginally
  };
});

const subscribers = new Set();

const tick = () => {
  const now = getVirtualNow();
  let updated = false;

  matches = matches.map((match) => {
    if (match.isHistorical) return match;

    const kickoffTime = getMatchKickoffTime(match);
    if (!kickoffTime) return match;

    const elapsedMs = now.getTime() - kickoffTime.getTime();
    const elapsedMin = Math.floor(elapsedMs / 60000);

    if (elapsedMs < 0) {
      if (match.status !== 'UPCOMING') {
        updated = true;
        return {
          ...match,
          status: 'UPCOMING',
          minute: 0,
          stats: null,
          timeline: []
        };
      }
      return match;
    } else if (elapsedMin < 105) {
      const prevStatus = match.status;
      const prevMin = match.minute;
      
      let currentMin = elapsedMin;
      if (elapsedMin > 45 && elapsedMin <= 60) {
        currentMin = 45; // HT
      } else if (elapsedMin > 60) {
        currentMin = Math.min(90, elapsedMin - 15);
      }

      if (prevStatus !== 'LIVE' || prevMin !== currentMin) {
        updated = true;
        return generateDeterministicMatchState(match, currentMin, 'LIVE');
      }
      return match;
    } else {
      if (match.status !== 'FINISHED') {
        updated = true;
        return generateDeterministicMatchState(match, 90, 'FINISHED');
      }
      return match;
    }
  });

  if (updated) {
    notifySubscribers();
  }
};

export const subscribeToMatches = (callback) => {
  tick(); // Sync once immediately before subscribing
  subscribers.add(callback);
  callback([...matches]); // Immediate delivery
  return () => subscribers.delete(callback);
};

const notifySubscribers = () => {
  const data = [...matches];
  subscribers.forEach((cb) => cb(data));
};

// Player name pools for random event generation during LIVE simulation
const PLAYER_POOLS = {
  MEX: ["S. Gimenez", "H. Lozano", "U. Antuna", "Edson Alvarez", "L. Chavez"],
  RSA: ["P. Tau", "E. Makgopa", "T. Morena", "T. Mokoena", "T. Zwane"],
  KOR: ["Son Heung-min", "Lee Kang-in", "Cho Gue-sung", "Hwang In-beom", "Lee Jae-sung"],
  CZE: ["P. Schick", "A. Hlozek", "T. Soucek", "A. Barak", "L. Provod"],
  CAN: ["Jonathan David", "Alphonso Davies", "C. Larin", "T. Buchanan", "I. Kone"],
  BIH: ["E. Dzeko", "E. Demirovic", "H. Tabakovic", "H. Hajradinovic"],
  QAT: ["Akram Afif", "A. Al-Rawi", "A. Hassan"],
  SUI: ["X. Shaqiri", "G. Xhaka", "B. Embolo", "R. Vargas"],
  BRA: ["Vinícius Jr.", "Rodrygo", "Raphinha", "Casemiro"],
  MAR: ["Y. En-Nesyri", "A. Hakimi", "S. Amrabat", "H. Ziyech"],
  SCO: ["J. McGinn", "A. Robertson", "S. McTominay", "C. Adams"],
  HAI: ["D. Derilus", "F. Pierrot"],
  USA: ["Christian Pulisic", "Timothy Weah", "Folarin Balogun", "Weston McKennie"],
  PAR: ["M. Almiron", "J. Enciso", "A. Sanabria", "D. Gomez"],
  AUS: ["A. Hrustic", "M. Duke", "M. Leckie", "J. Irvine"],
  TUR: ["H. Calhanoglu", "A. Güler", "K. Aktürkoğlu"],
  GER: ["J. Musiala", "F. Wirtz", "K. Havertz", "L. Sané", "N. Füllkrug"],
  CUR: ["L. Bacuna"],
  CIV: ["S. Haller", "N. Pépé", "F. Kessié"],
  ECU: ["P. Hincapié", "M. Caicedo", "E. Valencia"],
  NED: ["C. Gakpo", "X. Simons", "M. Depay", "V. van Dijk"],
  JPN: ["T. Kubo", "D. Kamada", "K. Mitoma", "W. Endo"],
  SWE: ["A. Isak", "V. Gyökeres", "D. Kulusevski", "E. Forsberg"],
  TUN: ["A. Laidouni", "Y. Msakni", "S. Jaziri"],
  ESP: ["Lamine Yamal", "Pedri", "Rodri", "Nico Williams", "A. Morata"],
  CPV: ["R. Lopes", "K. Borges"],
  FRA: ["K. Mbappé", "A. Griezmann", "O. Dembélé", "A. Tchouameni"],
  SEN: ["S. Mané", "I. Gueye", "B. Dieng"],
  ARG: ["L. Messi", "J. Álvarez", "Á. Di María", "E. Fernández"],
  ALG: ["R. Mahrez", "I. Slimani", "S. Benrahma"],
  POR: ["Cristiano Ronaldo", "Bruno Fernandes", "B. Silva", "R. Leão"],
  ENG: ["J. Bellingham", "H. Kane", "B. Saka", "P. Foden"],
  CRO: ["L. Modric", "M. Kovacic", "A. Kramaric", "I. Perisic"],
  COL: ["L. Díaz", "J. Arias", "R. Falcao"],
  GHA: ["M. Kudus", "T. Partey", "I. Williams"],
  PAN: ["A. Carrasquilla", "E. Davis"],
  BEL: ["R. Lukaku", "K. De Bruyne", "J. Doku", "L. Trossard"],
  EGY: ["M. Salah", "Emam Ashour", "T. Hamed", "M. Hany"],
  IRN: ["M. Taremi", "S. Azmoun", "A. Jahanbakhsh"],
  NZL: ["C. Wood", "K. Barbarouses", "M. Rojas"],
  KSA: ["S. Al-Dawsari", "A. Al-Bishi", "Firas Al-Buraikan"],
  URU: ["D. Núñez", "L. Suárez", "F. Valverde", "R. Bentancur"],
  UZB: ["E. Shomurodov", "A. Ismoilov"],
  AUT: ["M. Arnautovic", "K. Laimer", "C. Baumgartner"],
  JOR: ["M. Al-Taamari", "Y. Al-Rawashdeh"],
  COD: ["C. Bakambu", "Y. Betunga"]
};



const adjustOdds = (odds, minute, homeScore, awayScore, eventAdded) => {
  const timeFactor = (90 - minute) / 90;
  const scoreDiff = homeScore - awayScore;
  const previousOdds = JSON.parse(JSON.stringify(odds));

  if (scoreDiff === 0) {
    odds.h2h.home = parseFloat((2.0 + (3.0 * (1 - timeFactor))).toFixed(2));
    odds.h2h.away = parseFloat((2.5 + (3.0 * (1 - timeFactor))).toFixed(2));
    odds.h2h.draw = parseFloat(Math.max(1.1, 3.0 * timeFactor + 0.1).toFixed(2));
  } else if (scoreDiff > 0) {
    odds.h2h.home = parseFloat(Math.max(1.01, 1.8 - (0.8 * scoreDiff) - (0.7 * (1 - timeFactor))).toFixed(2));
    odds.h2h.away = parseFloat((3.0 + (5.0 * scoreDiff) + (10.0 * (1 - timeFactor))).toFixed(2));
    odds.h2h.draw = parseFloat((2.5 + (2.0 * scoreDiff) + (5.0 * (1 - timeFactor))).toFixed(2));
  } else {
    const absDiff = Math.abs(scoreDiff);
    odds.h2h.away = parseFloat(Math.max(1.01, 1.8 - (0.8 * absDiff) - (0.7 * (1 - timeFactor))).toFixed(2));
    odds.h2h.home = parseFloat((3.0 + (5.0 * absDiff) + (10.0 * (1 - timeFactor))).toFixed(2));
    odds.h2h.draw = parseFloat((2.5 + (2.0 * absDiff) + (5.0 * (1 - timeFactor))).toFixed(2));
  }

  const currentTotal = homeScore + awayScore;
  const projectLine = currentTotal + (2 * timeFactor);
  odds.overUnder.line = (Math.round(projectLine * 2) / 2).toFixed(1);
  
  const fluctuation = eventAdded ? 0.05 : 0.01;
  const randVal = () => (Math.random() * fluctuation - (fluctuation / 2));
  
  odds.overUnder.over = parseFloat(Math.max(1.1, Math.min(10.0, odds.overUnder.over + randVal())).toFixed(2));
  odds.overUnder.under = parseFloat(Math.max(1.1, Math.min(10.0, 3.8 - odds.overUnder.over)).toFixed(2));
  
  const handicapLine = (Math.round((scoreDiff - 0.25 * timeFactor) * 4) / 4).toFixed(2);
  odds.handicap.line = handicapLine > 0 ? `-${handicapLine}` : `+${Math.abs(handicapLine)}`;
  odds.handicap.home = parseFloat(Math.max(1.1, Math.min(10.0, odds.handicap.home + randVal())).toFixed(2));
  odds.handicap.away = parseFloat(Math.max(1.1, Math.min(10.0, 3.8 - odds.handicap.home)).toFixed(2));

  odds._direction = {
    h2h: {
      home: odds.h2h.home > previousOdds.h2h.home ? "up" : odds.h2h.home < previousOdds.h2h.home ? "down" : "",
      draw: odds.h2h.draw > previousOdds.h2h.draw ? "up" : odds.h2h.draw < previousOdds.h2h.draw ? "down" : "",
      away: odds.h2h.away > previousOdds.h2h.away ? "up" : odds.h2h.away < previousOdds.h2h.away ? "down" : ""
    },
    handicap: {
      home: odds.handicap.home > previousOdds.handicap.home ? "up" : odds.handicap.home < previousOdds.handicap.home ? "down" : "",
      away: odds.handicap.away > previousOdds.handicap.away ? "up" : odds.handicap.away < previousOdds.handicap.away ? "down" : ""
    },
    overUnder: {
      over: odds.overUnder.over > previousOdds.overUnder.over ? "up" : odds.overUnder.over < previousOdds.overUnder.over ? "down" : "",
      under: odds.overUnder.under > previousOdds.overUnder.under ? "up" : odds.overUnder.under < previousOdds.overUnder.under ? "down" : ""
    }
  };
};

let intervalId = setInterval(tick, 3000);

export const restartSimulation = () => {
  clearInterval(intervalId);
  notifySubscribers();
  intervalId = setInterval(tick, 3000);
};

export const placeBet = (betSlip, stake) => {
  console.log(`[Simulator] Placing bet on ${betSlip?.match?.home?.name || 'Match'} vs ${betSlip?.match?.away?.name || 'Match'} (${betSlip?.label}) with stake ${stake}K`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, betId: "BET-" + Math.floor(Math.random() * 900000 + 100000) });
    }, 1000);
  });
};
