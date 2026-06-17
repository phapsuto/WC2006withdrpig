// Scientific AI Match Prediction Engine (Poisson Distribution & ELO Ratings)
// Based on quantitative soccer analytics modeling

// ELO ratings for all 48 World Cup 2026 teams based on historical and current form
export const TEAM_ELO = {
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

// Map Vietnamese name or raw English name to ELO database keys
export const getTeamElo = (teamName) => {
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
 * Predict match probabilities using Poisson distribution and ELO ratings
 */
export function predictMatch(homeTeamName, awayTeamName, currentHomeScore = 0, currentAwayScore = 0, status = 'UPCOMING', minute = 0) {
  const homeElo = getTeamElo(homeTeamName);
  const awayElo = getTeamElo(awayTeamName);

  // ELO difference
  const eloDiff = (homeElo - awayElo) / 400;

  // Expected base goal rate per match (average is around 1.35 goals per team per match)
  const baseGoalRate = 1.35;
  const lambdaHome = Math.max(0.2, Math.min(5.0, baseGoalRate * Math.pow(10, eloDiff / 2)));
  const lambdaAway = Math.max(0.2, Math.min(5.0, baseGoalRate * Math.pow(10, -eloDiff / 2)));

  // Remaining time factor
  let remFraction = 1.0;
  if (status === 'FINISHED') {
    remFraction = 0.0;
  } else if (status === 'LIVE') {
    const elapsed = Math.min(90, Math.max(0, minute));
    remFraction = (90 - elapsed) / 90;
  }

  // Expected goals for the remaining time
  const remLambdaHome = lambdaHome * remFraction;
  const remLambdaAway = lambdaAway * remFraction;

  // Compute probability grid for additional goals (up to 8 goals per team)
  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;
  let over25Prob = 0;

  let bestProb = -1;
  let bestExtraHome = 0;
  let bestExtraAway = 0;

  const MAX_GOALS = 8;
  const homeGrid = [];
  const awayGrid = [];

  // Pre-calculate poisson arrays
  for (let i = 0; i <= MAX_GOALS; i++) {
    homeGrid.push(poissonProbability(i, remLambdaHome));
    awayGrid.push(poissonProbability(i, remLambdaAway));
  }

  // Calculate joint probabilities
  const scores = [];
  const rho = 0.06; // Dixon-Coles parameter for draw correction
  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      let prob = homeGrid[h] * awayGrid[a];

      // Apply Dixon-Coles correction for low-scoring combinations (0-0, 1-0, 0-1, 1-1)
      if (h === 0 && a === 0) {
        prob *= (1 - rho * remLambdaHome * remLambdaAway);
      } else if (h === 1 && a === 0) {
        prob *= (1 + rho * remLambdaAway);
      } else if (h === 0 && a === 1) {
        prob *= (1 + rho * remLambdaHome);
      } else if (h === 1 && a === 1) {
        prob *= (1 - rho);
      }

      // Ensure probability is not negative
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

      scores.push({
        score: `${finalHome}-${finalAway}`,
        prob
      });

      // Track most likely score
      if (prob > bestProb) {
        bestProb = prob;
        bestExtraHome = h;
        bestExtraAway = a;
      }
    }
  }

  // Sort and take top 3 likely scores
  scores.sort((x, y) => y.prob - x.prob);
  const topScorelines = scores.slice(0, 3).map(s => ({
    score: s.score,
    percent: parseFloat((s.prob * 100).toFixed(1))
  }));

  // Normalize to 100% just in case of grid truncation
  const totalGridProb = homeWinProb + drawProb + awayWinProb || 1;
  homeWinProb /= totalGridProb;
  drawProb /= totalGridProb;
  awayWinProb /= totalGridProb;

  return {
    probabilities: {
      homeWin: parseFloat((homeWinProb * 100).toFixed(1)),
      draw: parseFloat((drawProb * 100).toFixed(1)),
      awayWin: parseFloat((awayWinProb * 100).toFixed(1)),
      over25: parseFloat((over25Prob * 100).toFixed(1)),
      under25: parseFloat(((1 - over25Prob) * 100).toFixed(1))
    },
    analytics: {
      expectedHomeGoals: parseFloat(lambdaHome.toFixed(2)),
      expectedAwayGoals: parseFloat(lambdaAway.toFixed(2)),
      homeElo,
      awayElo,
      mostLikelyScore: `${currentHomeScore + bestExtraHome}-${currentAwayScore + bestExtraAway}`,
      topScorelines,
      confidenceRating: homeElo > awayElo ? (homeElo - awayElo) > 150 ? 'CAO' : 'TRUNG BÌNH' : (awayElo - homeElo) > 150 ? 'CAO' : 'TRUNG BÌNH'
    }
  };
}

export default {
  TEAM_ELO,
  getTeamElo,
  predictMatch
};
