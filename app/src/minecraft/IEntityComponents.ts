// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import IComponentExperienceReward from "./IComponentExperienceReward";
import IComponentTypeFamily from "./IComponentTypeFamily";

export default interface IEntityComponents {
  "minecraft:experience_reward": IComponentExperienceReward;
  "minecraft:type_family": IComponentTypeFamily;
}
