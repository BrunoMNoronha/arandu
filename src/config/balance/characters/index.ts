import type { PlayerConfig } from '../../types';
import { WARRIOR_CONFIG } from './WarriorConfig';

export const DEFAULT_CHARACTER_KEY: string = 'warrior';

export const CHARACTER_CONFIGS: Readonly<Record<string, PlayerConfig>> = Object.freeze({
    [DEFAULT_CHARACTER_KEY]: WARRIOR_CONFIG
});
