import IProjectItemData from "./IProjectItemData";
import IGitHubInfo from "./IGitHubInfo";
import ITool from "./ITool";
import { IWorldSettings } from "../minecraft/IWorldSettings";

export enum ProjectDataType {
  localStorage = 0,
  clientStorage = 1,
}

export enum ProjectFocus {
  general = 0,
  gameTests = 1,
  world = 2,
  singleBehaviorPack = 3,
}

export enum ProjectScriptLanguage {
  javaScript = 0,
  typeScript = 1,
}

export enum ProjectScriptVersion {
  latestBeta = 0,
  stable10 = 1,
}

export enum ProjectEditPreference {
  summarized = 0,
  editors = 1,
  raw = 2,
}

export default interface IProjectData {
  dataType: ProjectDataType;
  storageBasePath: string;
  name: string;
  title: string;
  shortName?: string;
  creator?: string;
  defaultNamespace?: string;
  scriptEntryPoint?: string;
  description: string;
  focus: ProjectFocus;

  editPreference: ProjectEditPreference;

  gitHubReferences?: IGitHubInfo[];

  collapsedStoragePaths?: string[];

  preferredTools?: ITool[];

  preferredScriptLanguage?: ProjectScriptLanguage;
  scriptVersion?: ProjectScriptVersion;

  versionMajor?: number;
  versionMinor?: number;
  versionPatch?: number;
  usesCustomWorldSettings?: boolean;
  worldSettings?: IWorldSettings;
  autoDeploymentMode?: number;

  lastMapDeployedDate?: Date;
  lastMapDeployedHash?: string;

  showHiddenItems?: boolean;
  showFunctions?: boolean;
  showAssets?: boolean;
  showTypes?: boolean;

  gitHubRepoName?: string;
  gitHubOwner?: string;
  gitHubFolder?: string;
  gitHubBranch?: string;

  originalGalleryId?: string;
  originalSampleId?: string;
  originalFullPath?: string;
  originalFileList?: string[];
  originalGitHubRepoName?: string;
  originalGitHubOwner?: string;
  originalGitHubBranch?: string;
  originalGitHubFolder?: string;

  defaultBehaviorPackUniqueId: string;
  defaultResourcePackUniqueId: string;
  defaultDataUniqueId: string;
  defaultScriptModuleUniqueId: string;
  contentsModified: Date | null;

  localFolderPath?: string;
  localFilePath?: string;
  dataStorageRelativePath: string;

  items: IProjectItemData[];
}
