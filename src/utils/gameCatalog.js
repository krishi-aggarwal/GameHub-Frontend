const LOCAL_GAME_SLUGS = new Set([
  'deception-around-us',
  'fishpond',
]);

function getGameSlug(game) {
  return String(game?.slug || '').trim().toLowerCase();
}

function getGameType(game) {
  return String(game?.gameType || game?.type || '').trim().toUpperCase();
}

export function supportsPassAndPlay(game) {
  return LOCAL_GAME_SLUGS.has(getGameSlug(game));
}

export function isSocialDeductionGame(game) {
  const slug = getGameSlug(game);
  const name = String(game?.name || '').toLowerCase();
  const type = getGameType(game);

  return slug === 'deception-around-us'
    || [name, type].some((value) => (
      value.includes('deception')
      || value.includes('mafia')
      || value.includes('deduction')
    ));
}

export function matchesGameCategory(game, category) {
  if (category === 'DEDUCTION' || category === 'SOCIAL_DEDUCTION') {
    return isSocialDeductionGame(game);
  }
  if (category === 'PARTY') {
    const type = getGameType(game);
    return !isSocialDeductionGame(game)
      && (getGameSlug(game) === 'fishpond'
        || type.includes('FISHPOND')
        || type.includes('PARTY')
        || type.includes('CASUAL'));
  }
  if (category === 'LOCAL') {
    return supportsPassAndPlay(game);
  }
  return true;
}
