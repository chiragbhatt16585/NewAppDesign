import { ImageSourcePropType } from 'react-native';

export type TroubleshootingNodeType =
  | 'question'
  | 'instruction'
  | 'result'
  | 'terminal';

export interface TroubleshootingOption {
  id: string;
  label: string;
  next: string;
  showChevron?: boolean;
}

export interface TroubleshootingNode {
  id: string;
  type: TroubleshootingNodeType;
  title: string;
  description?: string;
  /** Shown below images on question steps (e.g. "Did the website open?") */
  postImageQuestion?: string;
  stepLabel?: string;
  stepIndex?: number;
  totalSteps?: number;
  /** Local asset key — resolved via troubleshootingImageMap */
  images?: string[];
  /** Remote image URL (https) */
  imageUrls?: string[];
  options?: TroubleshootingOption[];
  /** For instruction nodes — single continue button */
  confirmLabel?: string;
  next?: string;
  action?: 'done' | 'raise_ticket';
  showCompletedSteps?: boolean;
  allowDescription?: boolean;
}

export interface TroubleshootingFlow {
  id: string;
  title: string;
  startId: string;
  nodes: Record<string, TroubleshootingNode>;
}

export interface TroubleshootingConfig {
  hubTitle: string;
  screenTitle: string;
  flows: TroubleshootingFlow[];
}

export interface TroubleshootingAnswer {
  nodeId: string;
  stepLabel?: string;
  optionId: string;
  optionLabel: string;
}

export type TroubleshootingImageMap = Record<string, ImageSourcePropType>;
