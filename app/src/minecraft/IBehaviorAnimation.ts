// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export default interface IBehaviorAnimationWrapper {
  format_version: string;
  __comment__?: string;
  animations: IBehaviorAnimationSet;
}

export interface IBehaviorAnimationSet {
  [identifier: string]: IBehaviorAnimation;
}

export interface IBehaviorAnimation {
  animation_length: number;
  loop?: boolean;
  timeline?: IBehaviorAnimationTimeline;
}

export interface IBehaviorAnimationTimeline {
  [timeStamp: string]: string[];
}

export interface IBehaviorAnimationTimelineWrapper {
  animationId: string;
  timestamp: string;
  timeline: string[];
}
