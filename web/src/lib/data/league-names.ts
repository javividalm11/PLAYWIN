/**
 * Mapa id numérico de liga ESPN → nombre para mostrar.
 * Base generada por scripts/discover-leagues.mjs (2026-07-16),
 * con nombres localizados al español para la audiencia PLAYWIN.
 */
export const LEAGUE_NAMES: Record<string, string> = {
  "606": "Copa del Mundo FIFA", // fifa.world
  "620": "Liga Profesional Boliviana", // bol.1
  "630": "Brasileirão Serie A", // bra.1
  "640": "Primera División de Chile", // chi.1
  "650": "Primera A de Colombia", // col.1
  "660": "LigaPro Ecuador", // ecu.1
  "670": "Liga 1 de Perú", // per.1
  "680": "Liga AUF Uruguaya", // uru.1
  "700": "Premier League", // eng.1
  "710": "Ligue 1", // fra.1
  "715": "Primeira Liga de Portugal", // por.1
  "720": "Bundesliga", // ger.1
  "725": "Eredivisie", // ned.1
  "730": "Serie A", // ita.1
  "735": "Premiership Escocesa", // sco.1
  "740": "LaLiga", // esp.1
  "745": "Liga Profesional Argentina", // arg.1
  "750": "J.League", // jpn.1
  "760": "Liga MX", // mex.1
  "770": "MLS", // usa.1
  "775": "UEFA Champions League", // uefa.champions
  "776": "UEFA Europa League", // uefa.europa
  "783": "CONMEBOL Libertadores", // conmebol.libertadores
  "3901": "Pro League Belga", // bel.1
  "3906": "A-League Australiana", // aus.1
  "3913": "Superliga Danesa", // den.1
  "3914": "Championship Inglesa", // eng.2
  "3918": "FA Cup", // eng.fa
  "3920": "Carabao Cup", // eng.league_cup
  "3921": "LaLiga 2", // esp.2
  "3922": "Amistoso Internacional", // fifa.friendly
  "3926": "Ligue 2", // fra.2
  "3927": "2. Bundesliga", // ger.2
  "3931": "Serie B Italiana", // ita.2
  "3932": "Liga de Expansión MX", // mex.2
  "3934": "Primera División Paraguaya", // par.1
  "3937": "Premiership Sudafricana", // rsa.1
  "3939": "Liga Premier Rusa", // rus.1
  "3944": "Super League Suiza", // sui.1
  "3945": "Allsvenskan Sueca", // swe.1
  "3946": "Süper Lig Turca", // tur.1
  "3949": "Primera División Venezolana", // ven.1
  "3951": "Copa del Rey", // esp.copa_del_rey
  "3954": "Copa de Alemania", // ger.dfb_pokal
  "3955": "Super League Griega", // gre.1
  "3956": "Coppa Italia", // ita.coppa_italia
  "3960": "Eliteserien Noruega", // nor.1
  "4004": "Copa Oro Concacaf", // concacaf.gold
  "5337": "U.S. Open Cup", // usa.open
  "5454": "CONMEBOL Sudamericana", // conmebol.sudamericana
  "5462": "Supercopa de la UEFA", // uefa.super_cup
  "5501": "Mundial de Clubes FIFA", // fifa.cwc
  "5699": "Concacaf Champions Cup", // concacaf.champions
  "8316": "Superliga India", // ind.1
  "8339": "Superliga Indonesia", // idn.1
  "8376": "Superliga China", // chn.1
  "19425": "Leagues Cup", // concacaf.leagues.cup
  "19874": "Champions League (Clasificación)", // uefa.champions_qual
  "20296": "UEFA Conference League", // uefa.europa.conf
  "21231": "Saudi Pro League", // ksa.1
  "780": "Copa América", // conmebol.america
  "781": "Eurocopa", // uefa.euro
  "786": "Eliminatorias UEFA", // fifa.worldq.uefa
  "787": "Eliminatorias CONMEBOL", // fifa.worldq.conmebol
  "788": "Eliminatorias Concacaf", // fifa.worldq.concacaf
  "795": "Copa del Mundo Femenina", // fifa.wwc
  "2395": "UEFA Nations League", // uefa.nations
  "3903": "Primera Nacional Argentina", // arg.2
  "3905": "Primera D Argentina", // arg.5
  "3908": "Copa Africana de Naciones", // caf.nations
  "3928": "Liga Nacional de Guatemala", // gua.1
  "3929": "Liga Nacional de Honduras", // hon.1
  "3943": "Primera División de El Salvador", // slv.1
  "4005": "Primera División de Costa Rica", // crc.1
  "8097": "Superliga Femenina Inglesa", // eng.w.1
  "8107": "Copa Argentina", // arg.copa
  "8301": "NWSL", // usa.nwsl
  "19267": "Concacaf Nations League", // concacaf.nations.league
  "19483": "UEFA Women's Champions League", // uefa.wchampions
  "19834": "Amistoso de Clubes", // club.friendly
  "19887": "Europa League (Clasificación)", // uefa.europa_qual
  "20221": "Conference League (Clasificación)", // uefa.europa.conf_qual
  "20956": "Liga F Española", // esp.w.1
};

export function leagueName(leagueId: string | undefined): string {
  return (leagueId && LEAGUE_NAMES[leagueId]) || "Fútbol Internacional";
}
