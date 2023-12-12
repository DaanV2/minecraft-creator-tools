import { constants } from "../core/Constants";
import IProjectInfoData from "../info/IProjectInfoData";
import { IPackReferenceSet } from "../minecraft/IWorldSettings";
import IFile from "../storage/IFile";
import IFolder from "../storage/IFolder";
import StorageUtilities from "../storage/StorageUtilities";
import ZipStorage from "../storage/ZipStorage";
import Carto from "./Carto";
import Project from "./Project";

export enum PackType {
  packSet = 0,
  world = 1,
  worldTemplate = 2,
  generic = 3,
  project = 4,
}

export default class Pack {
  storagePath: string;
  name: string;
  baseName: string;
  type: PackType;
  file?: IFile;
  reportFile?: IFile;
  cacheFolder?: IFolder;
  data?: IProjectInfoData;

  get isWorldType() {
    return this.type === PackType.world || this.type === PackType.worldTemplate;
  }

  constructor(name: string, path: string) {
    this.name = name;
    this.storagePath = path;
    this.baseName = StorageUtilities.getBaseFromName(name);
    this.type = this._getPackTypeFromPath(path);
  }

  _getPackTypeFromPath(path: string) {
    const type = StorageUtilities.getTypeFromName(path);

    switch (type) {
      case "mcworld":
        return PackType.world;
      case "mcproject":
        return PackType.project;
      case "mctemplate":
        return PackType.worldTemplate;
      case "mcaddon":
      case "mcpack":
        return PackType.packSet;

      default:
        return PackType.generic;
    }
  }

  async ensureData(carto: Carto, file: IFile) {
    this.file = file;

    const summaryFile = file.parentFolder.ensureFile(file.name + ".report.html");

    const summaryFileExists = await summaryFile.exists();

    let summaryObject: IProjectInfoData | undefined = undefined;

    if (summaryFileExists) {
      await summaryFile.loadContent();

      const content = summaryFile.content;

      if (content && typeof content === "string") {
        const adderFunctionDec = content.indexOf("function _addReportJson(");
        let adderFunction = content.indexOf("_addReportJson(");

        if (adderFunction >= 0) {
          if (adderFunctionDec === adderFunction - 9) {
            adderFunction = content.indexOf("_addReportJson(", adderFunction + 10);
          }

          if (adderFunction >= 0) {
            const endOfFunction = content.indexOf("</script>", adderFunction);

            if (endOfFunction > adderFunction) {
              const previousEnd = content.lastIndexOf(");", endOfFunction);
              if (previousEnd > adderFunction && previousEnd < endOfFunction) {
                const jsonContent = content.substring(adderFunction + 15, previousEnd);

                try {
                  summaryObject = JSON.parse(jsonContent);
                } catch (e) {}

                if (summaryObject) {
                  this.reportFile = summaryFile;
                }

                // if the report was generated by a different version, ignore it and regen a new one.
                if (summaryObject && summaryObject.generatorVersion !== constants.version) {
                  summaryObject = undefined;
                }
              }
            }
          }
        }
      }
    }

    if (!summaryObject) {
      await file.loadContent();

      if (file.content && file.content instanceof Uint8Array) {
        let packRootZipFolder = undefined;

        if (!file.fileContainerStorage) {
          const zipStorage = new ZipStorage();

          zipStorage.storagePath = file.storageRelativePath + "#";

          await zipStorage.loadFromUint8Array(file.content, file.name);

          file.fileContainerStorage = zipStorage;
        }

        packRootZipFolder = file.fileContainerStorage.rootFolder;

        const packProject = new Project(carto, file.name, null);
        packProject.setProjectFolder(packRootZipFolder);

        await packProject.inferProjectItemsFromFiles();

        const pis = packProject.infoSet;

        await pis.generateForProject();

        const hash = await file.getHash();

        const reportHtml = pis.getReportHtml(file.name, file.storageRelativePath, hash);

        summaryFile.setContent(reportHtml);
        await summaryFile.saveContent();

        this.reportFile = summaryFile;

        summaryObject = pis.getDataObject(file.name, file.storageRelativePath, hash);
      }
    }

    if (summaryObject) {
      this.data = summaryObject;
    }
  }

  createReference(): IPackReferenceSet {
    const bpRefs: { uuid: string; version: number[] }[] = [];
    const rpRefs: { uuid: string; version: number[] }[] = [];

    if (this.data && this.data.items) {
      for (let i = 0; i < this.data.items.length; i++) {
        const item = this.data.items[i];

        if (item.generatorId === "PACK" && item.generatorIndex === 6 && item.data && typeof item.data === "string") {
          const ref = this.getRefFromString(item.data);

          if (ref) {
            bpRefs.push(ref);
          }
        } else if (
          item.generatorId === "PACK" &&
          item.generatorIndex === 16 &&
          item.data &&
          typeof item.data === "string"
        ) {
          const ref = this.getRefFromString(item.data);

          if (ref) {
            rpRefs.push(ref);
          }
        }
      }
    }

    const packRef: IPackReferenceSet = {
      name: this.name,
      hash: this.data?.sourceHash,
      behaviorPackReferences: bpRefs,
      resourcePackReferences: rpRefs,
    };

    return packRef;
  }

  getRefFromString(uuidPlusVersion: string) {
    const sections = uuidPlusVersion.split("|");

    if (sections.length !== 2) {
      return undefined;
    }

    const verNumbers = sections[1].split(".");

    if (verNumbers.length !== 3) {
      return undefined;
    }

    const targetVerNumbers = [];
    try {
      targetVerNumbers.push(parseInt(verNumbers[0]));
      targetVerNumbers.push(parseInt(verNumbers[1]));
      targetVerNumbers.push(parseInt(verNumbers[2]));
    } catch (e) {}

    if (targetVerNumbers.length !== 3) {
      return undefined;
    }

    return { uuid: sections[0], version: targetVerNumbers };
  }

  matches(packName: string, isWorldFocused?: boolean) {
    const packCoreName = this.name.toLowerCase();
    const packBaseName = this.baseName.toLowerCase();

    packName = packName.toLowerCase();

    if (
      (packBaseName.toLowerCase() === packName &&
        (isWorldFocused === undefined ||
          (isWorldFocused === true && (this.type === PackType.world || this.type === PackType.worldTemplate)) ||
          (isWorldFocused === false && this.type !== PackType.world && this.type !== PackType.worldTemplate))) ||
      packCoreName === packName
    ) {
      return true;
    }

    return false;
  }
}
