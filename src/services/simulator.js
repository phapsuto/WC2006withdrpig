// World Cup 2026 Match & Betting Odds Simulator
// Focused exclusively on real WC2026 opening fixtures with authentic player lineups

const LEAGUES = {
  WC_GPA: { name: "Bảng A • World Cup 2026", country: "Mỹ/Canada/Mexico" },
  WC_GPB: { name: "Bảng B • World Cup 2026", country: "Mỹ/Canada/Mexico" },
  WC_GPC: { name: "Bảng C • World Cup 2026", country: "Mỹ/Canada/Mexico" }
};

export const TEAMS = {
  MEX: { name: "Mexico", short: "MEX", flag: "mx", color: "#006847", textColor: "#ffffff" },
  RSA: { name: "Nam Phi", short: "RSA", flag: "za", color: "#ffb612", textColor: "#000000" },
  CAN: { name: "Canada", short: "CAN", flag: "ca", color: "#ff0000", textColor: "#ffffff" },
  BIH: { name: "Bosnia & Hz.", short: "BIH", flag: "ba", color: "#002f6c", textColor: "#ffffff" },
  USA: { name: "Mỹ", short: "USA", flag: "us", color: "#002868", textColor: "#ffffff" },
  PAR: { name: "Paraguay", short: "PAR", flag: "py", color: "#d52b1e", textColor: "#ffffff" },
  KOR: { name: "Hàn Quốc", short: "KOR", flag: "kr", color: "#c21e26", textColor: "#ffffff" },
  CZE: { name: "Cộng hòa Séc", short: "CZE", flag: "cz", color: "#ffffff", textColor: "#11457b" },
  ESP: { name: "Tây Ban Nha", short: "ESP", flag: "es", color: "#c60b1e", textColor: "#ffc400" },
  CRO: { name: "Croatia", short: "CRO", flag: "hr", color: "#ffffff", textColor: "#cf081f" }
};

let matches = [
  {
    id: "m1",
    league: LEAGUES.WC_GPA,
    home: TEAMS.MEX,
    away: TEAMS.RSA,
    homeScore: 2,
    awayScore: 0,
    status: "FINISHED", // LIVE, UPCOMING, FINISHED
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
      { minute: 18, type: "YELLOW", team: "away", detail: "T. Mokoena" },
      { minute: 34, type: "GOAL", team: "home", detail: "S. Gimenez" },
      { minute: 58, type: "YELLOW", team: "home", detail: "Edson Alvarez" },
      { minute: 72, type: "GOAL", team: "home", detail: "H. Lozano" },
      { minute: 81, type: "YELLOW", team: "away", detail: "P. Tau" }
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
    },
    news: [
      {
        source: "Facebook - Ghiền Bóng Đá",
        time: "1 ngày trước",
        title: "Bữa tiệc khai mạc World Cup 2026 rực rỡ tại Mexico!",
        summary: "Estadio Azteca bùng nổ trong ngày ra quân. Mexico thể hiện sức mạnh vượt trội đè bẹp Nam Phi 2-0 nhờ các pha lập công của Gimenez và Lozano.",
        upvotes: 12500,
        comments: 2400,
        image: "https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=500&auto=format&fit=crop"
      },
      {
        source: "Sky Sports (Dịch)",
        time: "1 ngày trước",
        title: "Mexico gửi lời cảnh cáo đanh thép đến bảng A",
        summary: "Dù Nam Phi thi đấu quả cảm dưới sự dẫn dắt của Williams, hàng thủ kiên cố của Mexico và tài nghệ của Edson Alvarez đã dập tắt mọi hy vọng.",
        upvotes: 430,
        comments: 78,
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop"
      }
    ]
  },
  {
    id: "m2",
    league: LEAGUES.WC_GPA,
    home: TEAMS.CAN,
    away: TEAMS.BIH,
    homeScore: 1,
    awayScore: 1,
    status: "LIVE",
    minute: 55,
    stats: {
      possession: { home: 52, away: 48 },
      shots: { home: 10, away: 7 },
      shotsOnTarget: { home: 4, away: 3 },
      fouls: { home: 7, away: 8 },
      corners: { home: 4, away: 2 },
      yellowCards: { home: 1, away: 1 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [
      { minute: 21, type: "GOAL", team: "away", detail: "E. Dzeko" },
      { minute: 38, type: "YELLOW", team: "home", detail: "S. Eustaquio" },
      { minute: 45, type: "GOAL", team: "home", detail: "Jonathan David" },
      { minute: 49, type: "YELLOW", team: "away", detail: "A. Ahmedhodzic" }
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
      h2h: { home: 2.10, draw: 2.45, away: 3.90 },
      handicap: { line: "-0.25", home: 1.85, away: 1.95 },
      overUnder: { line: "2.75", over: 1.90, under: 1.90 }
    },
    news: [
      {
        source: "BLV Anh Quân (Facebook)",
        time: "30 phút trước",
        title: "LÃO TƯỚNG DZEKO LÊN TIẾNG - TRẬN ĐẤU CĂNG THẲNG TẠI TORONTO 🇨🇦",
        summary: "Edin Dzeko chứng minh gừng càng già càng cay với cú dứt điểm chuẩn xác đưa Bosnia vươn lên dẫn trước. Nhưng tốc độ của Alphonso Davies và bàn gỡ của David giúp Canada lấy lại thế trận.",
        upvotes: 4500,
        comments: 520,
        image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop"
      },
      {
        source: "Goal.com (Dịch)",
        time: "1 giờ trước",
        title: "Sức mạnh sân nhà có giúp Canada lội ngược dòng?",
        summary: "Hơn 45.000 khán giả phủ đỏ BMO Field tiếp lửa cho thầy trò Jesse Marsch. Hiệp hai dự kiến sẽ vô cùng nảy lửa.",
        upvotes: 890,
        comments: 120,
        image: "https://images.unsplash.com/photo-1510563800743-aed2364902b8?w=500&auto=format&fit=crop"
      }
    ]
  },
  {
    id: "m3",
    league: LEAGUES.WC_GPA,
    home: TEAMS.USA,
    away: TEAMS.PAR,
    homeScore: 0,
    awayScore: 0,
    status: "LIVE",
    minute: 12,
    stats: {
      possession: { home: 65, away: 35 },
      shots: { home: 3, away: 1 },
      shotsOnTarget: { home: 1, away: 0 },
      fouls: { home: 2, away: 3 },
      corners: { home: 2, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 }
    },
    timeline: [],
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
      h2h: { home: 1.55, draw: 3.80, away: 6.50 },
      handicap: { line: "-1", home: 1.90, away: 1.90 },
      overUnder: { line: "2.5", over: 1.85, under: 1.95 }
    },
    news: [
      {
        source: "Facebook - Cộng Đồng Bóng Đá Mỹ",
        time: "10 phút trước",
        title: "Bóng lăn tại SoFi Stadium! Khí thế cuồng nhiệt từ CĐV Mỹ 🇺🇸",
        summary: "Christian Pulisic dẫn dắt tuyển Mỹ tràn lên tấn công ngay từ những phút đầu tiên. Paraguay chủ động đá lùi sâu phòng ngự chặt.",
        upvotes: 3400,
        comments: 420,
        image: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=500&auto=format&fit=crop"
      }
    ]
  },
  {
    id: "m4",
    league: LEAGUES.WC_GPB,
    home: TEAMS.KOR,
    away: TEAMS.CZE,
    homeScore: 0,
    awayScore: 0,
    status: "UPCOMING",
    minute: 0,
    stats: null,
    timeline: [],
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
      h2h: { home: 2.75, draw: 3.10, away: 2.60 },
      handicap: { line: "0", home: 1.90, away: 1.90 },
      overUnder: { line: "2.25", over: 1.95, under: 1.85 }
    },
    news: [
      {
        source: "Kênh BLV Quang Huy (Facebook)",
        time: "5 giờ trước",
        title: "ĐẠI DIỆN CHÂU Á XUẤT TRẬN - SON HEUNG-MIN ĐÃ SẴN SÀNG 🇰🇷",
        summary: "Trận đấu hứa hẹn vô cùng cân tài cân sức giữa tuyển Hàn Quốc và Cộng hòa Séc ở bảng B. Sự bùng nổ của Son Heung-min và Lee Kang-in sẽ đối đầu với lối chơi khoa học của Soucek.",
        upvotes: 8900,
        comments: 650,
        image: "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=500&auto=format&fit=crop"
      }
    ]
  },
  {
    id: "m5",
    league: LEAGUES.WC_GPB,
    home: TEAMS.ESP,
    away: TEAMS.CRO,
    homeScore: 0,
    awayScore: 0,
    status: "UPCOMING",
    minute: 0,
    stats: null,
    timeline: [],
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
      away: [
        { number: 1, name: "D. Livakovic", role: "GK", x: 50, y: 90 },
        { number: 2, name: "Josip Stanisic", role: "DF", x: 85, y: 70 },
        { number: 6, name: "Dejan Lovren", role: "DF", x: 62, y: 75 },
        { number: 4, name: "Josko Gvardiol", role: "DF", x: 38, y: 75 },
        { number: 3, name: "Borna Sosa", role: "DF", x: 15, y: 70 },
        { number: 11, name: "Marcelo Brozovic", role: "MF", x: 50, y: 52 },
        { number: 10, name: "Luka Modric", role: "MF", x: 68, y: 40 },
        { number: 8, name: "Mateo Kovacic", role: "MF", x: 32, y: 40 },
        { number: 9, name: "Andrej Kramaric", role: "FW", x: 50, y: 15 },
        { number: 7, name: "Lovro Majer", role: "FW", x: 80, y: 22 },
        { number: 14, name: "Ivan Perisic", role: "FW", x: 22, y: 22 }
      ]
    },
    odds: {
      h2h: { home: 1.85, draw: 3.40, away: 4.50 },
      handicap: { line: "-0.5", home: 1.85, away: 1.95 },
      overUnder: { line: "2.5", over: 1.90, under: 1.90 }
    },
    news: [
      {
        source: "Marca (Dịch)",
        time: "10 giờ trước",
        title: "Tây Ban Nha tập trung tối đa cho cuộc chiến Bảng B tử thần",
        summary: "HLV Luis de la Fuente tuyên bố toàn đội phải vô hiệu hóa được tầm ảnh hưởng của lão tướng Luka Modric bên phía Croatia nếu muốn giành trọn vẹn 3 điểm.",
        upvotes: 1200,
        comments: 140,
        image: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=500&auto=format&fit=crop"
      }
    ]
  }
];

const subscribers = new Set();

export const subscribeToMatches = (callback) => {
  subscribers.add(callback);
  callback([...matches]); // Immediate delivery
  return () => subscribers.delete(callback);
};

const notifySubscribers = () => {
  const data = [...matches];
  subscribers.forEach((cb) => cb(data));
};

// Main simulation tick
const tick = () => {
  let updated = false;

  matches = matches.map((match) => {
    if (match.status !== "LIVE") return match;

    updated = true;
    const nextMinute = match.minute + 1;

    if (nextMinute > 90) {
      return {
        ...match,
        status: "FINISHED",
        minute: 90
      };
    }

    const newStats = { ...match.stats };
    const newTimeline = [...match.timeline];
    let newHomeScore = match.homeScore;
    let newAwayScore = match.awayScore;
    const newOdds = JSON.parse(JSON.stringify(match.odds));

    // Simulate events
    const eventRoll = Math.random();
    let eventAdded = false;

    if (eventRoll < 0.02) {
      const isHome = Math.random() < 0.55;
      eventAdded = true;
      if (isHome) {
        newHomeScore += 1;
        newStats.shotsOnTarget.home += 1;
        newStats.shots.home += 1;
        newTimeline.push({
          minute: nextMinute,
          type: "GOAL",
          team: "home",
          detail: getRandomPlayer(match.home)
        });
      } else {
        newAwayScore += 1;
        newStats.shotsOnTarget.away += 1;
        newStats.shots.away += 1;
        newTimeline.push({
          minute: nextMinute,
          type: "GOAL",
          team: "away",
          detail: getRandomPlayer(match.away)
        });
      }
    } else if (eventRoll < 0.06) {
      // Card event
      const isHome = Math.random() < 0.5;
      eventAdded = true;
      const isRed = Math.random() < 0.05;
      if (isHome) {
        if (isRed) {
          newStats.redCards.home += 1;
          newTimeline.push({
            minute: nextMinute,
            type: "RED",
            team: "home",
            detail: getRandomPlayer(match.home)
          });
        } else {
          newStats.yellowCards.home += 1;
          newTimeline.push({
            minute: nextMinute,
            type: "YELLOW",
            team: "home",
            detail: getRandomPlayer(match.home)
          });
        }
      } else {
        if (isRed) {
          newStats.redCards.away += 1;
          newTimeline.push({
            minute: nextMinute,
            type: "RED",
            team: "away",
            detail: getRandomPlayer(match.away)
          });
        } else {
          newStats.yellowCards.away += 1;
          newTimeline.push({
            minute: nextMinute,
            type: "YELLOW",
            team: "away",
            detail: getRandomPlayer(match.away)
          });
        }
      }
    } else {
      const statRoll = Math.random();
      if (statRoll < 0.15) {
        newStats.shots.home += Math.random() < 0.6 ? 1 : 0;
        newStats.shots.away += Math.random() < 0.4 ? 1 : 0;
        newStats.corners.home += Math.random() < 0.2 ? 1 : 0;
        newStats.corners.away += Math.random() < 0.2 ? 1 : 0;
        newStats.fouls.home += Math.random() < 0.3 ? 1 : 0;
        newStats.fouls.away += Math.random() < 0.3 ? 1 : 0;
      }
      const possChange = Math.floor(Math.random() * 3) - 1;
      newStats.possession.home = Math.max(30, Math.min(70, newStats.possession.home + possChange));
      newStats.possession.away = 100 - newStats.possession.home;
    }

    adjustOdds(newOdds, nextMinute, newHomeScore, newAwayScore, eventAdded);

    return {
      ...match,
      minute: nextMinute,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      stats: newStats,
      timeline: newTimeline,
      odds: newOdds
    };
  });

  if (updated) {
    notifySubscribers();
  }
};

const getRandomPlayer = (team) => {
  if (team.short === "MEX") {
    const players = ["S. Gimenez", "H. Lozano", "U. Antuna", "Edson Alvarez", "L. Chavez"];
    return players[Math.floor(Math.random() * players.length)];
  }
  if (team.short === "RSA") {
    const players = ["P. Tau", "E. Makgopa", "T. Morena", "T. Mokoena", "T. Zwane"];
    return players[Math.floor(Math.random() * players.length)];
  }
  if (team.short === "CAN") {
    const players = ["Jonathan David", "Alphonso Davies", "C. Larin", "T. Buchanan", "I. Kone"];
    return players[Math.floor(Math.random() * players.length)];
  }
  if (team.short === "BIH") {
    const players = ["E. Dzeko", "E. Demirovic", "H. Tabakovic", "H. Hajradinovic"];
    return players[Math.floor(Math.random() * players.length)];
  }
  if (team.short === "USA") {
    const players = ["Christian Pulisic", "Timothy Weah", "Folarin Balogun", "Weston McKennie"];
    return players[Math.floor(Math.random() * players.length)];
  }
  if (team.short === "PAR") {
    const players = ["M. Almiron", "J. Enciso", "A. Sanabria", "D. Gomez"];
    return players[Math.floor(Math.random() * players.length)];
  }
  return "Cầu thủ";
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
  matches = matches.map(m => {
    if (m.id === "m2") {
      return {
        ...m,
        status: "LIVE",
        minute: 55,
        homeScore: 1,
        awayScore: 1,
        timeline: m.timeline.slice(0, 4)
      };
    }
    if (m.id === "m3") {
      return {
        ...m,
        status: "LIVE",
        minute: 12,
        homeScore: 0,
        awayScore: 0,
        timeline: []
      };
    }
    if (m.id === "m4" || m.id === "m5") {
      return {
        ...m,
        status: "UPCOMING",
        minute: 0,
        homeScore: 0,
        awayScore: 0,
        timeline: []
      };
    }
    return m;
  });
  notifySubscribers();
  intervalId = setInterval(tick, 3000);
};

export const placeBet = (betSlip, stake) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, betId: "BET-" + Math.floor(Math.random() * 900000 + 100000) });
    }, 1000);
  });
};
