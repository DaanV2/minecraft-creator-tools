import { Component, SyntheticEvent } from "react";
import IAppProps from "./IAppProps";
import Project from "../app/Project";
import "./NewEntityType.css";
import { Input, InputProps, ThemeInput } from "@fluentui/react-northstar";
import Database from "./../minecraft/Database";
import Log from "./../core/Log";
import IFolder from "./../storage/IFolder";
import { NewEntityTypeAddMode } from "../app/ProjectUtilities";
import ProjectGallery, { GalleryProjectCommand } from "./ProjectGallery";
import IGalleryProject, { GalleryProjectType } from "../app/IGalleryProject";
import { ProjectTileDisplayMode } from "./ProjectTile";

interface INewEntityTypeProps extends IAppProps {
  project: Project;
  theme: ThemeInput<any>;
  onNewEntityTypeUpdated: (propertyType: NewEntityTypeAddMode, project: IGalleryProject, name: string) => void;
}

interface INewEntityTypeState {
  entitiesFolder?: IFolder;
  selectedEntity?: IGalleryProject;
  name?: string;
  nameIsManuallySet?: boolean;
}

export default class NewEntityType extends Component<INewEntityTypeProps, INewEntityTypeState> {
  constructor(props: INewEntityTypeProps) {
    super(props);

    this._handleTypeGalleryCommand = this._handleTypeGalleryCommand.bind(this);
    this._handleNameChanged = this._handleNameChanged.bind(this);
    this._ensureLoaded = this._ensureLoaded.bind(this);

    this.state = {};

    this._ensureLoaded();
  }

  async _ensureLoaded() {
    await Database.loadDefaultBehaviorPack();

    if (Database.defaultBehaviorPackFolder === undefined || Database.defaultBehaviorPackFolder === null) {
      Log.fail("Unexpectedly could not load default BP folder.");
      return;
    }

    const entitiesFolder = await Database.defaultBehaviorPackFolder.ensureFolder("entities");

    await entitiesFolder.load(false);

    this.setState({
      entitiesFolder: entitiesFolder,
      selectedEntity: this.state.selectedEntity,
    });
  }

  _handleNameChanged(e: SyntheticEvent, data: (InputProps & { value: string }) | undefined) {
    if (data === undefined || this.props.carto === null || this.state == null) {
      return;
    }

    let nextNameIsManuallySet = this.state.nameIsManuallySet;

    if (!nextNameIsManuallySet) {
      if (this.state.selectedEntity && data.value !== this.state.selectedEntity.id) {
        nextNameIsManuallySet = true;
      }
    } else if (data.value === undefined || data.value === "") {
      nextNameIsManuallySet = false;
    }

    if (this.state.selectedEntity && data.value) {
      this.props.onNewEntityTypeUpdated(NewEntityTypeAddMode.baseId, this.state.selectedEntity, data.value);
    }

    this.setState({
      selectedEntity: this.state.selectedEntity,
      name: data.value,
      nameIsManuallySet: nextNameIsManuallySet,
    });
  }

  private _handleTypeGalleryCommand(command: GalleryProjectCommand, project: IGalleryProject) {
    let newName = this.state.name;

    if (!this.state.nameIsManuallySet || newName === undefined) {
      newName = project.id;
    }

    this.setState({
      selectedEntity: project,
      entitiesFolder: this.state.entitiesFolder,
      name: newName,
      nameIsManuallySet: this.state.nameIsManuallySet,
    });

    if (this.props.onNewEntityTypeUpdated) {
      this.props.onNewEntityTypeUpdated(NewEntityTypeAddMode.baseId, project, newName);
    }
  }

  render() {
    if (
      this.state === null ||
      Database.defaultBehaviorPackFolder === null ||
      this.state.entitiesFolder === undefined ||
      this.props.carto.gallery === undefined
    ) {
      return <div>Loading...</div>;
    }

    const entitiesFolder = this.state.entitiesFolder;

    if (entitiesFolder === undefined) {
      return;
    }

    let inputText = this.state.name;

    if (inputText === undefined) {
      inputText = "";
    }

    return (
      <div className="net-outer">
        <div className="net-optionsArea">
          <div>
            <Input
              value={inputText}
              defaultValue={inputText}
              placeholder={this.state.selectedEntity ? this.state.selectedEntity.id : "myMobName"}
              onChange={this._handleNameChanged}
            />
          </div>
        </div>
        <div className="net-galleryHeader">Based on the following mob:</div>
        <div
          className="net-projectGallery"
          style={{
            backgroundColor: this.props.theme.siteVariables?.colorScheme.brand.background3,
            color: this.props.theme.siteVariables?.colorScheme.brand.foreground3,
          }}
        >
          <ProjectGallery
            carto={this.props.carto}
            theme={this.props.theme}
            view={ProjectTileDisplayMode.smallImage}
            isSelectable={true}
            gallery={this.props.carto.gallery}
            filterOn={GalleryProjectType.entityType}
            onGalleryItemCommand={this._handleTypeGalleryCommand}
          />
        </div>
      </div>
    );
  }
}
