// Scientific AI Match Prediction Engine (Dixon-Coles Bivariate Poisson & Dynamic ELO)
// Based on quantitative soccer analytics modeling

// ELO ratings for all 48 World Cup 2026 teams based on historical and current form
const TEAM_ELO = {
  // Top Tier (Contenders)
  'Argentina': 2080,
  'France': 2050,
  'Spain': 2030,
  'England': 2020,
  'Brazil': 2010,
  'Portugal': 2000,
  'Netherlands': 1990,
  'Belgium': 1970,
  'Germany': 1960,
  'Morocco': 1950,
  'Uruguay': 1940,
  'Colombia': 1920,
  'Croatia': 1910,

  // Mid-High Tier
  'Japan': 1860,
  'Switzerland': 1840,
  'South Korea': 1820,
  'Sweden': 1820,
  'Austria': 1780,
  'Iran': 1760,
  'Mexico': 1800,
  'United States': 1800,
  'Ecuador': 1790,
  'Norway': 1780,
  'Senegal': 1770,
  'Australia': 1750,
  'Turkey': 1740,
  'Czech Republic': 1730,
  'Canada': 1710,
  'Ivory Coast': 1700,

  // Mid Tier
  'Egypt': 1690,
  'Algeria': 1680,
  'Scotland': 1680,
  'Paraguay': 1670,
  'Bosnia and Herzegovina': 1650,
  'Panama': 1630,
  'Iraq': 1630,
  'Ghana': 1620,
  'Qatar': 1620,
  'Uzbekistan': 1620,
  'Tunisia': 1610,
  'Saudi Arabia': 1600,
  'South Africa': 1600,
  'DR Congo': 1590,
  'Cape Verde': 1580,
  'New Zealand': 1560,
  'Jordan': 1550,

  // Lower Tier
  'Haiti': 1450,
  'Curaçao': 1380,
};

// Host nations for World Cup 2026
const HOST_COUNTRIES = [
  'United States', 'Mexico', 'Canada', 
  'Mỹ', 'Canada', 'Mexico'
];

// Map Vietnamese name or raw English name to ELO database keys
const getTeamElo = (teamName) => {
  if (!teamName) return 1600;
  
  // Normalization mapping from Vietnamese display names back to database keys
  const normalizationMap = {
    // Group A
    'Mexico': 'Mexico',
    'Nam Phi': 'South Africa',
    'Hàn Quốc': 'South Korea',
    'Séc': 'Czech Republic',
    'CH Séc': 'Czech Republic',
    // Group B
    'Canada': 'Canada',
    'Bosnia & Hz.': 'Bosnia and Herzegovina',
    'Qatar': 'Qatar',
    'Thụy Sĩ': 'Switzerland',
    // Group C
    'Brazil': 'Brazil',
    'Morocco': 'Morocco',
    'Scotland': 'Scotland',
    'Haiti': 'Haiti',
    // Group D
    'Mỹ': 'United States',
    'Paraguay': 'Paraguay',
    'Úc': 'Australia',
    'Thổ Nhĩ Kỳ': 'Turkey',
    // Group E
    'Đức': 'Germany',
    'Curaçao': 'Curaçao',
    'Bờ Biển Ngà': 'Ivory Coast',
    'Ecuador': 'Ecuador',
    // Group F
    'Hà Lan': 'Netherlands',
    'Nhật Bản': 'Japan',
    'Thụy Điển': 'Sweden',
    'Tunisia': 'Tunisia',
    // Group G
    'Bỉ': 'Belgium',
    'Ai Cập': 'Egypt',
    'Iran': 'Iran',
    'New Zealand': 'New Zealand',
    // Group H
    'Tây Ban Nha': 'Spain',
    'Cape Verde': 'Cape Verde',
    'Ả Rập Saudi': 'Saudi Arabia',
    'Uruguay': 'Uruguay',
    // Group I
    'Pháp': 'France',
    'Senegal': 'Senegal',
    'Iraq': 'Iraq',
    'Na Uy': 'Norway',
    // Group J
    'Argentina': 'Argentina',
    'Algeria': 'Algeria',
    'Áo': 'Austria',
    'Jordan': 'Jordan',
    // Group K
    'Bồ Đào Nha': 'Portugal',
    'Colombia': 'Colombia',
    'Uzbekistan': 'Uzbekistan',
    'Congo DR': 'DR Congo',
    'DR Congo': 'DR Congo',
    // Group L
    'Anh': 'England',
    'Croatia': 'Croatia',
    'Ghana': 'Ghana',
    'Panama': 'Panama'
  };

  const normalized = normalizationMap[teamName] || teamName;
  return TEAM_ELO[normalized] || 1600; // Default ELO is 1600 for unlisted teams
};

// Math Factorial helper
function factorial(n) {
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// Poisson Probability formula: (lambda^k * e^-lambda) / k!
function poissonProbability(k, lambda) {
  if (lambda === 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/**
 * Calculate dynamic form based on last 5 finished matches in the tournament
 */
function getTeamRecentForm(teamName, matches = []) {
  if (!matches || matches.length === 0) {
    return { multiplier: 1.0, goalsScoredAvg: 1.35, goalsConcededAvg: 1.35, description: 'Bình thường (Chưa có dữ liệu)' };
  }

  // Filter finished matches involving this team
  const teamMatches = matches
    .filter(m => m.status === 'FINISHED' && (m.home.name === teamName || m.away.name === teamName))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5);

  if (teamMatches.length === 0) {
    return { multiplier: 1.0, goalsScoredAvg: 1.35, goalsConcededAvg: 1.35, description: 'Bình thường (Chưa thi đấu)' };
  }

  let points = 0;
  let goalsScored = 0;
  let goalsConceded = 0;

  teamMatches.forEach(m => {
    const isHome = m.home.name === teamName;
    const teamScore = isHome ? m.homeScore : m.awayScore;
    const oppScore = isHome ? m.awayScore : m.homeScore;

    goalsScored += teamScore;
    goalsConceded += oppScore;

    if (teamScore > oppScore) {
      points += 3;
    } else if (teamScore === oppScore) {
      points += 1;
    }
  });

  const maxPoints = teamMatches.length * 3;
  const ppg = points / teamMatches.length;

  // PPG ranges from 0 to 3. Map this to a strength multiplier from 0.90 to 1.15
  const multiplier = 0.90 + (ppg / 3) * 0.25;

  let desc = 'Bình thường';
  if (ppg >= 2.2) desc = 'Phong độ hủy diệt 🔥';
  else if (ppg >= 1.6) desc = 'Phong độ tốt 👍';
  else if (ppg < 0.8) desc = 'Phong độ kém ⚠️';

  return {
    multiplier,
    goalsScoredAvg: parseFloat((goalsScored / teamMatches.length).toFixed(2)),
    goalsConcededAvg: parseFloat((goalsConceded / teamMatches.length).toFixed(2)),
    description: `${desc} (Kiếm được ${points}/${maxPoints} điểm gần đây)`
  };
}

/**
 * Predict match probabilities using upgraded Dixon-Coles bivariate Poisson distribution & Dynamic ELO
 */
function predictMatch(homeTeamName, awayTeamName, currentHomeScore = 0, currentAwayScore = 0, status = 'UPCOMING', minute = 0, matches = [], bookmakerOdds = null) {
  const homeElo = getTeamElo(homeTeamName);
  const awayElo = getTeamElo(awayTeamName);

  // 1. Calculate base attack and defense ratings from ELO
  // baseline ELO is 1600
  let homeAttack = homeElo / 1600;
  let homeDefense = 1600 / homeElo;
  let awayAttack = awayElo / 1600;
  let awayDefense = 1600 / awayElo;

  // 2. Incorporate recent tournament form dynamically
  const homeForm = getTeamRecentForm(homeTeamName, matches);
  const awayForm = getTeamRecentForm(awayTeamName, matches);

  if (homeForm.goalsScoredAvg !== 1.35) {
    const formAttackMult = Math.max(0.8, Math.min(1.25, homeForm.goalsScoredAvg / 1.35));
    const formDefenseMult = Math.max(0.8, Math.min(1.25, homeForm.goalsConcededAvg / 1.35));
    homeAttack *= formAttackMult;
    homeDefense *= formDefenseMult;
  }

  if (awayForm.goalsScoredAvg !== 1.35) {
    const formAttackMult = Math.max(0.8, Math.min(1.25, awayForm.goalsScoredAvg / 1.35));
    const formDefenseMult = Math.max(0.8, Math.min(1.25, awayForm.goalsConcededAvg / 1.35));
    awayAttack *= formAttackMult;
    awayDefense *= formDefenseMult;
  }

  // 3. Co-host country advantage adjustments (World Cup 2026: USA, Canada, Mexico)
  const homeIsHost = HOST_COUNTRIES.includes(homeTeamName);
  const awayIsHost = HOST_COUNTRIES.includes(awayTeamName);

  let homeHostAdvantageAttack = 1.0;
  let homeHostAdvantageDefense = 1.0;
  if (homeIsHost && !awayIsHost) {
    homeHostAdvantageAttack = 1.05; // +5% attack
    homeHostAdvantageDefense = 0.95; // -5% goals conceded (better defense)
  }

  // 4. Expected Goal Rates (Lambda and Mu)
  const baseGoalRate = 1.35;
  const lambdaHome = Math.max(0.2, Math.min(5.0, baseGoalRate * homeAttack * awayDefense * homeHostAdvantageAttack));
  const lambdaAway = Math.max(0.2, Math.min(5.0, baseGoalRate * awayAttack * homeDefense * homeHostAdvantageDefense));

  // 5. Remaining time fraction
  let remFraction = 1.0;
  if (status === 'FINISHED') {
    remFraction = 0.0;
  } else if (status === 'LIVE') {
    const elapsed = Math.min(90, Math.max(0, minute));
    remFraction = (90 - elapsed) / 90;
  }

  // Expected goals for remaining time
  const remLambdaHome = lambdaHome * remFraction;
  const remLambdaAway = lambdaAway * remFraction;

  // Compute joint probability matrix (up to 8 goals)
  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;
  let over25Prob = 0;
  let bttsProb = 0;
  let homeCleanSheetProb = 0;
  let awayCleanSheetProb = 0;

  const MAX_GOALS = 8;
  const homePoisson = [];
  const awayPoisson = [];

  for (let i = 0; i <= MAX_GOALS; i++) {
    homePoisson.push(poissonProbability(i, remLambdaHome));
    awayPoisson.push(poissonProbability(i, remLambdaAway));
  }

  const scores = [];
  const rho = 0.08; // Dixon-Coles correlation parameter

  // 5x5 grid for heatmap rendering
  const heatmapGrid = [];

  for (let h = 0; h <= MAX_GOALS; h++) {
    const row = [];
    for (let a = 0; a <= MAX_GOALS; a++) {
      let prob = homePoisson[h] * awayPoisson[a];

      // Dixon-Coles bivariate correction for low goals (0-0, 1-0, 0-1, 1-1)
      if (h === 0 && a === 0) {
        prob *= (1 - remLambdaHome * remLambdaAway * rho);
      } else if (h === 1 && a === 0) {
        prob *= (1 + remLambdaAway * rho);
      } else if (h === 0 && a === 1) {
        prob *= (1 + remLambdaHome * rho);
      } else if (h === 1 && a === 1) {
        prob *= (1 - rho);
      }

      prob = Math.max(0, prob);

      const finalHome = currentHomeScore + h;
      const finalAway = currentAwayScore + a;

      if (finalHome > finalAway) {
        homeWinProb += prob;
      } else if (finalHome === finalAway) {
        drawProb += prob;
      } else {
        awayWinProb += prob;
      }

      if (finalHome + finalAway > 2.5) {
        over25Prob += prob;
      }

      if (finalHome > 0 && finalAway > 0) {
        bttsProb += prob;
      }

      if (finalAway === 0) {
        homeCleanSheetProb += prob;
      }

      if (finalHome === 0) {
        awayCleanSheetProb += prob;
      }

      scores.push({
        score: `${finalHome}-${finalAway}`,
        prob
      });

      // Populate 5x5 heatmap grid
      if (h <= 4 && a <= 4) {
        row.push({
          homeGoals: h,
          awayGoals: a,
          scoreText: `${finalHome}-${finalAway}`,
          probability: parseFloat((prob * 100).toFixed(1))
        });
      }
    }
    if (h <= 4) {
      heatmapGrid.push(row);
    }
  }

  // Sort and take top 3 likely scores
  scores.sort((x, y) => y.prob - x.prob);
  const topScorelines = scores.slice(0, 3).map(s => ({
    score: s.score,
    percent: parseFloat((s.prob * 100).toFixed(1))
  }));

  // Normalize win/draw/loss
  const totalGridProb = homeWinProb + drawProb + awayWinProb || 1;
  homeWinProb /= totalGridProb;
  drawProb /= totalGridProb;
  awayWinProb /= totalGridProb;

  // 6. Expected Value (+EV) calculations based on odds
  const evList = [];
  if (bookmakerOdds) {
    const oH = parseFloat(bookmakerOdds.h2h?.home) || 0;
    const oD = parseFloat(bookmakerOdds.h2h?.draw) || 0;
    const oA = parseFloat(bookmakerOdds.h2h?.away) || 0;
    const oOver = parseFloat(bookmakerOdds.overUnder?.over) || 0;
    const oUnder = parseFloat(bookmakerOdds.overUnder?.under) || 0;

    if (oH > 1) evList.push({ key: '1x2-home', label: `Thắng (${homeTeamName})`, ev: parseFloat((homeWinProb * oH - 1).toFixed(3)), odds: oH });
    if (oD > 1) evList.push({ key: '1x2-draw', label: 'Hòa', ev: parseFloat((drawProb * oD - 1).toFixed(3)), odds: oD });
    if (oA > 1) evList.push({ key: '1x2-away', label: `Thắng (${awayTeamName})`, ev: parseFloat((awayWinProb * oA - 1).toFixed(3)), odds: oA });
    if (oOver > 1) evList.push({ key: 'ou-over', label: 'Tài 2.5', ev: parseFloat((over25Prob * oOver - 1).toFixed(3)), odds: oOver });
    if (oUnder > 1) evList.push({ key: 'ou-under', label: 'Xỉu 2.5', ev: parseFloat(((1 - over25Prob) * oUnder - 1).toFixed(3)), odds: oUnder });
  }

  // Sort and find value bets (EV > 0)
  const valueBets = evList
    .filter(item => item.ev > 0.01) // EV higher than +1%
    .sort((x, y) => y.ev - x.ev);

  return {
    probabilities: {
      homeWin: parseFloat((homeWinProb * 100).toFixed(1)),
      draw: parseFloat((drawProb * 100).toFixed(1)),
      awayWin: parseFloat((awayWinProb * 100).toFixed(1)),
      over25: parseFloat((over25Prob * 100).toFixed(1)),
      under25: parseFloat(((1 - over25Prob) * 100).toFixed(1)),
      btts: parseFloat((bttsProb * 100).toFixed(1)),
      homeCleanSheet: parseFloat((homeCleanSheetProb * 100).toFixed(1)),
      awayCleanSheet: parseFloat((awayCleanSheetProb * 100).toFixed(1))
    },
    analytics: {
      expectedHomeGoals: parseFloat(lambdaHome.toFixed(2)),
      expectedAwayGoals: parseFloat(lambdaAway.toFixed(2)),
      homeElo,
      awayElo,
      homeFormDesc: homeForm.description,
      awayFormDesc: awayForm.description,
      homeIsHost,
      awayIsHost,
      mostLikelyScore: scores[0].score,
      topScorelines,
      heatmapGrid,
      valueBets,
      confidenceRating: Math.abs(homeElo - awayElo) > 180 ? 'CAO' : 'TRUNG BÌNH'
    }
  };
}

module.exports = {
  TEAM_ELO,
  getTeamElo,
  getTeamRecentForm,
  predictMatch
};
