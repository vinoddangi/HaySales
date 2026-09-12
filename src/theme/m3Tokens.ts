import { ColorScheme } from '../types';

export interface M3Palette {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export const m3ColorSchemes: Record<ColorScheme, M3Palette> = {
  // Baseline M3 Purple
  purple: {
    light: {
      '--m3-primary': '103 80 164',
      '--m3-on-primary': '255 255 255',
      '--m3-primary-container': '234 221 255',
      '--m3-on-primary-container': '33 0 93',

      '--m3-secondary': '98 91 113',
      '--m3-on-secondary': '255 255 255',
      '--m3-secondary-container': '232 222 248',
      '--m3-on-secondary-container': '30 25 43',

      '--m3-tertiary': '125 82 96',
      '--m3-on-tertiary': '255 255 255',
      '--m3-tertiary-container': '255 216 228',
      '--m3-on-tertiary-container': '49 17 29',

      '--m3-error': '186 26 26',
      '--m3-on-error': '255 255 255',
      '--m3-error-container': '255 218 214',
      '--m3-on-error-container': '65 0 2',

      '--m3-background': '254 247 255',
      '--m3-on-background': '29 27 32',

      '--m3-surface': '254 247 255',
      '--m3-on-surface': '29 27 32',
      '--m3-surface-variant': '231 224 236',
      '--m3-on-surface-variant': '73 69 79',

      '--m3-surface-container-lowest': '255 255 255',
      '--m3-surface-container-low': '247 242 250',
      '--m3-surface-container': '243 237 247',
      '--m3-surface-container-high': '236 230 240',
      '--m3-surface-container-highest': '230 224 233',

      '--m3-outline': '121 116 126',
      '--m3-outline-variant': '202 196 208',
      '--m3-inverse-surface': '49 48 51',
      '--m3-inverse-on-surface': '244 239 244',
      '--m3-inverse-primary': '208 188 255',
    },
    dark: {
      '--m3-primary': '208 188 255',
      '--m3-on-primary': '56 30 114',
      '--m3-primary-container': '79 55 139',
      '--m3-on-primary-container': '234 221 255',

      '--m3-secondary': '204 194 220',
      '--m3-on-secondary': '51 45 65',
      '--m3-secondary-container': '74 68 88',
      '--m3-on-secondary-container': '232 222 248',

      '--m3-tertiary': '239 184 200',
      '--m3-on-tertiary': '73 37 50',
      '--m3-tertiary-container': '99 59 72',
      '--m3-on-tertiary-container': '255 216 228',

      '--m3-error': '255 180 171',
      '--m3-on-error': '105 0 5',
      '--m3-error-container': '147 0 10',
      '--m3-on-error-container': '255 218 214',

      '--m3-background': '20 18 24',
      '--m3-on-background': '230 224 233',

      '--m3-surface': '20 18 24',
      '--m3-on-surface': '230 224 233',
      '--m3-surface-variant': '73 69 79',
      '--m3-on-surface-variant': '202 196 208',

      '--m3-surface-container-lowest': '15 13 19',
      '--m3-surface-container-low': '29 27 32',
      '--m3-surface-container': '33 31 38',
      '--m3-surface-container-high': '43 41 48',
      '--m3-surface-container-highest': '54 52 59',

      '--m3-outline': '147 143 153',
      '--m3-outline-variant': '73 69 79',
      '--m3-inverse-surface': '230 224 233',
      '--m3-inverse-on-surface': '49 48 51',
      '--m3-inverse-primary': '103 80 164',
    },
  },

  // Agricultural Green (Ideal for Hay/Farming)
  green: {
    light: {
      '--m3-primary': '45 107 40',
      '--m3-on-primary': '255 255 255',
      '--m3-primary-container': '174 245 163',
      '--m3-on-primary-container': '0 34 2',

      '--m3-secondary': '83 98 78',
      '--m3-on-secondary': '255 255 255',
      '--m3-secondary-container': '214 232 207',
      '--m3-on-secondary-container': '17 31 16',

      '--m3-tertiary': '56 101 106',
      '--m3-on-tertiary': '255 255 255',
      '--m3-tertiary-container': '188 235 241',
      '--m3-on-tertiary-container': '0 32 35',

      '--m3-error': '186 26 26',
      '--m3-on-error': '255 255 255',
      '--m3-error-container': '255 218 214',
      '--m3-on-error-container': '65 0 2',

      '--m3-background': '247 251 241',
      '--m3-on-background': '25 29 23',

      '--m3-surface': '247 251 241',
      '--m3-on-surface': '25 29 23',
      '--m3-surface-variant': '222 229 217',
      '--m3-on-surface-variant': '66 73 64',

      '--m3-surface-container-lowest': '255 255 255',
      '--m3-surface-container-low': '241 245 236',
      '--m3-surface-container': '235 240 230',
      '--m3-surface-container-high': '229 234 225',
      '--m3-surface-container-highest': '224 229 219',

      '--m3-outline': '114 121 111',
      '--m3-outline-variant': '194 201 189',
      '--m3-inverse-surface': '46 50 44',
      '--m3-inverse-on-surface': '239 243 234',
      '--m3-inverse-primary': '147 216 137',
    },
    dark: {
      '--m3-primary': '147 216 137',
      '--m3-on-primary': '0 57 8',
      '--m3-primary-container': '20 81 18',
      '--m3-on-primary-container': '174 245 163',

      '--m3-secondary': '186 204 180',
      '--m3-on-secondary': '37 52 35',
      '--m3-secondary-container': '60 74 56',
      '--m3-on-secondary-container': '214 232 207',

      '--m3-tertiary': '160 207 213',
      '--m3-on-tertiary': '0 54 59',
      '--m3-tertiary-container': '30 77 82',
      '--m3-on-tertiary-container': '188 235 241',

      '--m3-error': '255 180 171',
      '--m3-on-error': '105 0 5',
      '--m3-error-container': '147 0 10',
      '--m3-on-error-container': '255 218 214',

      '--m3-background': '17 20 15',
      '--m3-on-background': '224 229 219',

      '--m3-surface': '17 20 15',
      '--m3-on-surface': '224 229 219',
      '--m3-surface-variant': '66 73 64',
      '--m3-on-surface-variant': '194 201 189',

      '--m3-surface-container-lowest': '12 15 11',
      '--m3-surface-container-low': '25 29 23',
      '--m3-surface-container': '29 33 27',
      '--m3-surface-container-high': '39 43 37',
      '--m3-surface-container-highest': '50 54 48',

      '--m3-outline': '140 147 137',
      '--m3-outline-variant': '66 73 64',
      '--m3-inverse-surface': '224 229 219',
      '--m3-inverse-on-surface': '46 50 44',
      '--m3-inverse-primary': '45 107 40',
    },
  },

  // Ocean Blue
  blue: {
    light: {
      '--m3-primary': '0 99 154',
      '--m3-on-primary': '255 255 255',
      '--m3-primary-container': '206 230 255',
      '--m3-on-primary-container': '0 30 52',

      '--m3-secondary': '81 96 111',
      '--m3-on-secondary': '255 255 255',
      '--m3-secondary-container': '212 228 247',
      '--m3-on-secondary-container': '13 29 42',

      '--m3-tertiary': '104 88 122',
      '--m3-on-tertiary': '255 255 255',
      '--m3-tertiary-container': '239 219 255',
      '--m3-on-tertiary-container': '35 21 51',

      '--m3-error': '186 26 26',
      '--m3-on-error': '255 255 255',
      '--m3-error-container': '255 218 214',
      '--m3-on-error-container': '65 0 2',

      '--m3-background': '248 249 255',
      '--m3-on-background': '25 28 32',

      '--m3-surface': '248 249 255',
      '--m3-on-surface': '25 28 32',
      '--m3-surface-variant': '222 227 235',
      '--m3-on-surface-variant': '66 71 78',

      '--m3-surface-container-lowest': '255 255 255',
      '--m3-surface-container-low': '242 243 250',
      '--m3-surface-container': '236 238 244',
      '--m3-surface-container-high': '231 232 239',
      '--m3-surface-container-highest': '225 227 233',

      '--m3-outline': '115 120 126',
      '--m3-outline-variant': '194 199 207',
      '--m3-inverse-surface': '46 49 53',
      '--m3-inverse-on-surface': '240 240 247',
      '--m3-inverse-primary': '150 204 255',
    },
    dark: {
      '--m3-primary': '150 204 255',
      '--m3-on-primary': '0 51 83',
      '--m3-primary-container': '0 74 117',
      '--m3-on-primary-container': '206 230 255',

      '--m3-secondary': '185 200 218',
      '--m3-on-secondary': '35 50 63',
      '--m3-secondary-container': '57 72 87',
      '--m3-on-secondary-container': '212 228 247',

      '--m3-tertiary': '211 190 231',
      '--m3-on-tertiary': '57 41 73',
      '--m3-tertiary-container': '80 64 97',
      '--m3-on-tertiary-container': '239 219 255',

      '--m3-error': '255 180 171',
      '--m3-on-error': '105 0 5',
      '--m3-error-container': '147 0 10',
      '--m3-on-error-container': '255 218 214',

      '--m3-background': '17 20 23',
      '--m3-on-background': '225 227 233',

      '--m3-surface': '17 20 23',
      '--m3-on-surface': '225 227 233',
      '--m3-surface-variant': '66 71 78',
      '--m3-on-surface-variant': '194 199 207',

      '--m3-surface-container-lowest': '12 14 18',
      '--m3-surface-container-low': '25 28 32',
      '--m3-surface-container': '29 32 36',
      '--m3-surface-container-high': '40 43 46',
      '--m3-surface-container-highest': '50 53 57',

      '--m3-outline': '140 145 152',
      '--m3-outline-variant': '66 71 78',
      '--m3-inverse-surface': '225 227 233',
      '--m3-inverse-on-surface': '46 49 53',
      '--m3-inverse-primary': '0 99 154',
    },
  },

  // Harvest Amber / Orange
  orange: {
    light: {
      '--m3-primary': '139 80 0',
      '--m3-on-primary': '255 255 255',
      '--m3-primary-container': '255 221 184',
      '--m3-on-primary-container': '44 22 0',

      '--m3-secondary': '113 91 66',
      '--m3-on-secondary': '255 255 255',
      '--m3-secondary-container': '252 222 194',
      '--m3-on-secondary-container': '40 24 6',

      '--m3-tertiary': '88 100 59',
      '--m3-on-tertiary': '255 255 255',
      '--m3-tertiary-container': '220 235 187',
      '--m3-on-tertiary-container': '22 31 2',

      '--m3-error': '186 26 26',
      '--m3-on-error': '255 255 255',
      '--m3-error-container': '255 218 214',
      '--m3-on-error-container': '65 0 2',

      '--m3-background': '255 248 244',
      '--m3-on-background': '34 26 19',

      '--m3-surface': '255 248 244',
      '--m3-on-surface': '34 26 19',
      '--m3-surface-variant': '240 223 210',
      '--m3-on-surface-variant': '80 69 59',

      '--m3-surface-container-lowest': '255 255 255',
      '--m3-surface-container-low': '255 241 233',
      '--m3-surface-container': '250 235 226',
      '--m3-surface-container-high': '244 230 220',
      '--m3-surface-container-highest': '238 224 215',

      '--m3-outline': '131 117 106',
      '--m3-outline-variant': '212 196 183',
      '--m3-inverse-surface': '56 46 39',
      '--m3-inverse-on-surface': '253 238 230',
      '--m3-inverse-primary': '255 185 91',
    },
    dark: {
      '--m3-primary': '255 185 91',
      '--m3-on-primary': '74 40 0',
      '--m3-primary-container': '105 59 0',
      '--m3-on-primary-container': '255 221 184',

      '--m3-secondary': '223 194 167',
      '--m3-on-secondary': '63 44 22',
      '--m3-secondary-container': '88 67 43',
      '--m3-on-secondary-container': '252 222 194',

      '--m3-tertiary': '193 207 160',
      '--m3-on-tertiary': '43 53 18',
      '--m3-tertiary-container': '65 76 38',
      '--m3-on-tertiary-container': '220 235 187',

      '--m3-error': '255 180 171',
      '--m3-on-error': '105 0 5',
      '--m3-error-container': '147 0 10',
      '--m3-on-error-container': '255 218 214',

      '--m3-background': '24 18 13',
      '--m3-on-background': '238 224 215',

      '--m3-surface': '24 18 13',
      '--m3-on-surface': '238 224 215',
      '--m3-surface-variant': '80 69 59',
      '--m3-on-surface-variant': '212 196 183',

      '--m3-surface-container-lowest': '18 13 9',
      '--m3-surface-container-low': '34 26 19',
      '--m3-surface-container': '38 30 23',
      '--m3-surface-container-high': '49 40 33',
      '--m3-surface-container-highest': '60 51 44',

      '--m3-outline': '156 142 130',
      '--m3-outline-variant': '80 69 59',
      '--m3-inverse-surface': '238 224 215',
      '--m3-inverse-on-surface': '56 46 39',
      '--m3-inverse-primary': '139 80 0',
    },
  },

  // Rose
  rose: {
    light: {
      '--m3-primary': '156 65 70',
      '--m3-on-primary': '255 255 255',
      '--m3-primary-container': '255 218 219',
      '--m3-on-primary-container': '64 0 9',

      '--m3-secondary': '118 86 87',
      '--m3-on-secondary': '255 255 255',
      '--m3-secondary-container': '255 218 219',
      '--m3-on-secondary-container': '44 21 23',

      '--m3-tertiary': '116 90 49',
      '--m3-on-tertiary': '255 255 255',
      '--m3-tertiary-container': '255 222 172',
      '--m3-on-tertiary-container': '39 25 0',

      '--m3-error': '186 26 26',
      '--m3-on-error': '255 255 255',
      '--m3-error-container': '255 218 214',
      '--m3-on-error-container': '65 0 2',

      '--m3-background': '255 248 247',
      '--m3-on-background': '34 25 25',

      '--m3-surface': '255 248 247',
      '--m3-on-surface': '34 25 25',
      '--m3-surface-variant': '244 221 222',
      '--m3-on-surface-variant': '82 67 68',

      '--m3-surface-container-lowest': '255 255 255',
      '--m3-surface-container-low': '255 240 240',
      '--m3-surface-container': '250 234 235',
      '--m3-surface-container-high': '244 228 229',
      '--m3-surface-container-highest': '238 223 224',

      '--m3-outline': '133 115 116',
      '--m3-outline-variant': '216 193 194',
      '--m3-inverse-surface': '56 46 46',
      '--m3-inverse-on-surface': '253 237 238',
      '--m3-inverse-primary': '255 178 183',
    },
    dark: {
      '--m3-primary': '255 178 183',
      '--m3-on-primary': '95 18 25',
      '--m3-primary-container': '125 41 46',
      '--m3-on-primary-container': '255 218 219',

      '--m3-secondary': '229 189 191',
      '--m3-on-secondary': '68 41 43',
      '--m3-secondary-container': '92 63 65',
      '--m3-on-secondary-container': '255 218 219',

      '--m3-tertiary': '228 194 148',
      '--m3-on-tertiary': '65 44 8',
      '--m3-tertiary-container': '90 66 28',
      '--m3-on-tertiary-container': '255 222 172',

      '--m3-error': '255 180 171',
      '--m3-on-error': '105 0 5',
      '--m3-error-container': '147 0 10',
      '--m3-on-error-container': '255 218 214',

      '--m3-background': '25 18 18',
      '--m3-on-background': '238 223 224',

      '--m3-surface': '25 18 18',
      '--m3-on-surface': '238 223 224',
      '--m3-surface-variant': '82 67 68',
      '--m3-on-surface-variant': '216 193 194',

      '--m3-surface-container-lowest': '19 13 13',
      '--m3-surface-container-low': '34 25 25',
      '--m3-surface-container': '38 29 29',
      '--m3-surface-container-high': '49 40 40',
      '--m3-surface-container-highest': '60 50 51',

      '--m3-outline': '158 140 141',
      '--m3-outline-variant': '82 67 68',
      '--m3-inverse-surface': '238 223 224',
      '--m3-inverse-on-surface': '56 46 46',
      '--m3-inverse-primary': '156 65 70',
    },
  },
};
