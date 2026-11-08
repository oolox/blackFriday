import arrowLeftSvg from '../../../assets/icons/arrow-left.svg?raw';
import audioFileSvg from '../../../assets/icons/audio-file.svg?raw';
import caretDownSvg from '../../../assets/icons/caret-down.svg?raw';
import caretLeftSvg from '../../../assets/icons/caret-left.svg?raw';
import caretRightSvg from '../../../assets/icons/caret-right.svg?raw';
import caretUpSvg from '../../../assets/icons/caret-up.svg?raw';
import closeSvg from '../../../assets/icons/close.svg?raw';
import colorPickerSvg from '../../../assets/icons/color-picker.svg?raw';
import clockSvg from '../../../assets/icons/clock.svg?raw';
import configSvg from '../../../assets/icons/config.svg?raw';
import copySvg from '../../../assets/icons/copy.svg?raw';
import cropSvg from '../../../assets/icons/crop.svg?raw';
import diceSvg from '../../../assets/icons/dice.svg?raw';
import dropperSvg from '../../../assets/icons/dropper.svg?raw';
import eraserSvg from '../../../assets/icons/eraser.svg?raw';
import generateSvg from '../../../assets/icons/generate.svg?raw';
import guideSvg from '../../../assets/icons/guide.svg?raw';
import loadSvg from '../../../assets/icons/load.svg?raw';
import lockSvg from '../../../assets/icons/lock.svg?raw';
import modelSvg from '../../../assets/icons/model.svg?raw';
import moveSvg from '../../../assets/icons/move.svg?raw';
import mutateSvg from '../../../assets/icons/mutate.svg?raw';
import negativePromptSvg from '../../../assets/icons/negative-prompt.svg?raw';
import plusSvg from '../../../assets/icons/plus.svg?raw';
import promptSvg from '../../../assets/icons/prompt.svg?raw';
import ratio16x9Svg from '../../../assets/icons/ratio-16x9.svg?raw';
import ratio9x16Svg from '../../../assets/icons/ratio-9x16.svg?raw';
import ratioSquareSvg from '../../../assets/icons/ratio-square.svg?raw';
import ratioSquareSmSvg from '../../../assets/icons/ratio-square-sm.svg?raw';
import regenerateSvg from '../../../assets/icons/regenerate.svg?raw';
import resetSvg from '../../../assets/icons/reset.svg?raw';
import rotateSvg from '../../../assets/icons/rotate.svg?raw';
import saveSvg from '../../../assets/icons/save.svg?raw';
import searchSvg from '../../../assets/icons/search.svg?raw';
import sendSvg from '../../../assets/icons/send.svg?raw';
import settingsSvg from '../../../assets/icons/settings.svg?raw';
import skipToEndSvg from '../../../assets/icons/skip-to-end.svg?raw';
import skipToStartSvg from '../../../assets/icons/skip-to-start.svg?raw';
import sortSvg from '../../../assets/icons/sort.svg?raw';
import sparkleSvg from '../../../assets/icons/sparkle.svg?raw';
import starSvg from '../../../assets/icons/star.svg?raw';
import starFilledSvg from '../../../assets/icons/star-filled.svg?raw';
import stepsSvg from '../../../assets/icons/steps.svg?raw';
import textFileSvg from '../../../assets/icons/text-file.svg?raw';
import thumbMdSvg from '../../../assets/icons/thumb-md.svg?raw';
import thumbSmSvg from '../../../assets/icons/thumb-sm.svg?raw';
import thumbXsmSvg from '../../../assets/icons/thumb-xsm.svg?raw';
import trashSvg from '../../../assets/icons/trash.svg?raw';
import transparentSvg from '../../../assets/icons/transparent.svg?raw';
import tagSvg from '../../../assets/icons/tag.svg?raw';
import unlockSvg from '../../../assets/icons/unlock.svg?raw';

export const iconSources = {
  'arrow-left': arrowLeftSvg,
  'audio-file': audioFileSvg,
  'caret-down': caretDownSvg,
  'caret-left': caretLeftSvg,
  'caret-right': caretRightSvg,
  'caret-up': caretUpSvg,
  close: closeSvg,
  'color-picker': colorPickerSvg,
  clock: clockSvg,
  config: configSvg,
  copy: copySvg,
  crop: cropSvg,
  dice: diceSvg,
  dropper: dropperSvg,
  eraser: eraserSvg,
  generate: generateSvg,
  guide: guideSvg,
  load: loadSvg,
  lock: lockSvg,
  model: modelSvg,
  move: moveSvg,
  mutate: mutateSvg,
  'negative-prompt': negativePromptSvg,
  plus: plusSvg,
  prompt: promptSvg,
  'ratio-16x9': ratio16x9Svg,
  'ratio-9x16': ratio9x16Svg,
  'ratio-square': ratioSquareSvg,
  'ratio-square-sm': ratioSquareSmSvg,
  regenerate: regenerateSvg,
  reset: resetSvg,
  rotate: rotateSvg,
  save: saveSvg,
  search: searchSvg,
  send: sendSvg,
  settings: settingsSvg,
  'skip-to-end': skipToEndSvg,
  'skip-to-start': skipToStartSvg,
  sort: sortSvg,
  sparkle: sparkleSvg,
  star: starSvg,
  'star-filled': starFilledSvg,
  steps: stepsSvg,
  'text-file': textFileSvg,
  'thumb-md': thumbMdSvg,
  'thumb-sm': thumbSmSvg,
  'thumb-xsm': thumbXsmSvg,
  trash: trashSvg,
  transparent: transparentSvg,
  tag: tagSvg,
  unlock: unlockSvg,
} as const;

export type IconName = keyof typeof iconSources;
