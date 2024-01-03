import { Component, UIEvent } from "react";
import "./ProjectInfoDisplay.css";
import IAppProps from "./IAppProps";
import Project from "../app/Project";
import ProjectInfoSet from "../info/ProjectInfoSet";
import ProjectInfoItemDisplay from "./ProjectInfoItemDisplay";
import ProjectInfoItem from "../info/ProjectInfoItem";
import Utilities from "../core/Utilities";
import { Dropdown, DropdownProps, ThemeInput, Toolbar } from "@fluentui/react-northstar";
import {
  DownloadLabel,
  ErrorFilterLabel,
  FailureFilterLabel,
  InfoFilterLabel,
  InfoTabLabel,
  RecommendationsFilterLabel,
  SuccessFilterLabel,
  SummaryTabLabel,
  WarningFilterLabel,
} from "./Labels";

import { InfoItemType } from "../info/IInfoItemData";
import WebUtilities from "./WebUtilities";
import Carto from "../app/Carto";
import Status, { StatusTopic } from "../app/Status";
import { ProjectInfoSuite } from "../info/IProjectInfoData";

interface IProjectInfoDisplayProps extends IAppProps {
  project: Project;
  heightOffset: number;
  theme: ThemeInput<any>;
  onInfoItemCommand: (command: InfoItemCommand, item: ProjectInfoItem) => Promise<void>;
}

interface IProjectInfoDisplayState {
  infoSet: ProjectInfoSet | undefined;
  viewMode: ProjectInfoDisplayMode;
  activeSuite: ProjectInfoSuite;
  displayErrors: boolean;
  displaySuccess: boolean;
  displayWarnings: boolean;
  displayRecommendation: boolean;
  displayFailure: boolean;
  displayInfo: boolean;
  isLoading: boolean;
  maxItems: number;
  loadStatus?: string;
}

export enum ProjectInfoDisplayMode {
  info,
  summary,
}

export const SuiteTitles = ["All", "Platform Versions", "Add-on Best Practices"];

export enum InfoItemCommand {
  itemSelect,
  runUpdater,
}

export default class ProjectInfoDisplay extends Component<IProjectInfoDisplayProps, IProjectInfoDisplayState> {
  private _isMountedInternal: boolean = false;

  constructor(props: IProjectInfoDisplayProps) {
    super(props);

    this._generateInfoSet = this._generateInfoSet.bind(this);
    this._generateInfoSetInternal = this._generateInfoSetInternal.bind(this);
    this._toggleErrorFilter = this._toggleErrorFilter.bind(this);
    this._toggleWarningFilter = this._toggleWarningFilter.bind(this);
    this._toggleRecommendationFilter = this._toggleRecommendationFilter.bind(this);
    this._toggleInfoFilter = this._toggleInfoFilter.bind(this);
    this._toggleSuccessFilter = this._toggleSuccessFilter.bind(this);
    this._toggleFailureFilter = this._toggleFailureFilter.bind(this);
    this._setInfoMode = this._setInfoMode.bind(this);
    this._setSummaryMode = this._setSummaryMode.bind(this);
    this._handleInfoItemCommand = this._handleInfoItemCommand.bind(this);
    this._handleSuiteChange = this._handleSuiteChange.bind(this);
    this._handleStatusUpdates = this._handleStatusUpdates.bind(this);
    this._downloadReport = this._downloadReport.bind(this);
    this._handleListScroll = this._handleListScroll.bind(this);

    this.state = {
      infoSet: undefined,
      activeSuite: ProjectInfoSuite.allExceptAddOn,
      viewMode: ProjectInfoDisplayMode.info,
      displayErrors: true,
      displaySuccess: true,
      displayWarnings: true,
      displayRecommendation: true,
      displayFailure: true,
      maxItems: 5000,
      displayInfo: false,
      isLoading: true,
      loadStatus: undefined,
    };
  }

  private async _generateInfoSet() {
    await this._generateInfoSetInternal(false);
  }

  private async _handleStatusUpdates(carto: Carto, status: Status): Promise<void> {
    if (status.topic === StatusTopic.projectLoad || status.topic === StatusTopic.validation) {
      return new Promise((resolve: () => void, reject: () => void) => {
        this.setState(
          {
            infoSet: this.state.infoSet,
            displayErrors: this.state.displayErrors,
            displaySuccess: this.state.displaySuccess,
            displayFailure: this.state.displayFailure,
            displayWarnings: this.state.displayWarnings,
            maxItems: this.state.maxItems,
            displayRecommendation: this.state.displayRecommendation,
            displayInfo: this.state.displayInfo,
            isLoading: this.state.isLoading,
            loadStatus: status.message,
          },
          () => {
            window.setTimeout(() => {
              resolve();
            }, 1);
          }
        );
      });
    }
  }

  private async _generateInfoSetInternal(force: boolean) {
    this.props.carto.subscribeStatusAddedAsync(this._handleStatusUpdates);

    let newInfoSet = undefined;

    if (this.state.activeSuite === ProjectInfoSuite.allExceptAddOn) {
      newInfoSet = this.props.project.infoSet;
    } else {
      newInfoSet = new ProjectInfoSet(this.props.project, this.state.activeSuite);
    }

    await newInfoSet.generateForProject(force);

    if (this._isMountedInternal && this.state.activeSuite === newInfoSet.suite) {
      this.setState({
        infoSet: newInfoSet,
        displayErrors: this.state.displayErrors,
        displaySuccess: this.state.displaySuccess,
        maxItems: this.state.maxItems,
        displayFailure: this.state.displayFailure,
        displayWarnings: this.state.displayWarnings,
        displayRecommendation: this.state.displayRecommendation,
        displayInfo: this.state.displayInfo,
        isLoading: false,
        loadStatus: undefined,
      });
    }

    this.props.carto.unsubscribeStatusAddedAsync(this._handleStatusUpdates);
  }

  componentDidMount() {
    this._isMountedInternal = true;

    this._generateInfoSet();
  }

  componentWillUnmount(): void {
    this._isMountedInternal = false;
  }

  getDataSummary(data: string | number | boolean | undefined) {
    if (data) {
      return data;
    }

    if (typeof data === "number" || typeof data === "boolean") {
      return data.toString();
    }

    return "(not defined)";
  }

  private _toggleErrorFilter() {
    this.setState({
      infoSet: this.state.infoSet,
      viewMode: this.state.viewMode,
      displayErrors: !this.state.displayErrors,
      displaySuccess: this.state.displaySuccess,
      maxItems: this.state.maxItems,
      displayWarnings: this.state.displayWarnings,
      displayRecommendation: this.state.displayRecommendation,
      displayFailure: this.state.displayFailure,
      displayInfo: this.state.displayInfo,
      isLoading: false,
    });
  }

  private _toggleInfoFilter() {
    this.setState({
      infoSet: this.state.infoSet,
      viewMode: this.state.viewMode,
      maxItems: this.state.maxItems,
      displayErrors: this.state.displayErrors,
      displaySuccess: this.state.displaySuccess,
      displayWarnings: this.state.displayWarnings,
      displayRecommendation: this.state.displayRecommendation,
      displayFailure: this.state.displayFailure,
      displayInfo: !this.state.displayInfo,
      isLoading: false,
    });
  }

  private _toggleSuccessFilter() {
    this.setState({
      infoSet: this.state.infoSet,
      viewMode: this.state.viewMode,
      displayErrors: this.state.displayErrors,
      displaySuccess: !this.state.displaySuccess,
      displayWarnings: this.state.displayWarnings,
      maxItems: this.state.maxItems,
      displayRecommendation: this.state.displayRecommendation,
      displayFailure: this.state.displayFailure,
      displayInfo: this.state.displayInfo,
      isLoading: false,
    });
  }

  private _toggleFailureFilter() {
    this.setState({
      infoSet: this.state.infoSet,
      viewMode: this.state.viewMode,
      activeSuite: this.state.activeSuite,
      maxItems: this.state.maxItems,
      displayErrors: this.state.displayErrors,
      displaySuccess: this.state.displaySuccess,
      displayWarnings: this.state.displayWarnings,
      displayRecommendation: this.state.displayRecommendation,
      displayFailure: !this.state.displayFailure,
      displayInfo: this.state.displayInfo,
      isLoading: false,
    });
  }

  private _toggleWarningFilter() {
    this.setState({
      infoSet: this.state.infoSet,
      viewMode: this.state.viewMode,
      activeSuite: this.state.activeSuite,
      displayErrors: this.state.displayErrors,
      displaySuccess: this.state.displaySuccess,
      displayWarnings: !this.state.displayWarnings,
      displayRecommendation: this.state.displayRecommendation,
      maxItems: this.state.maxItems,
      displayFailure: this.state.displayFailure,
      displayInfo: this.state.displayInfo,
      isLoading: false,
    });
  }

  private _toggleRecommendationFilter() {
    this.setState({
      infoSet: this.state.infoSet,
      viewMode: this.state.viewMode,
      activeSuite: this.state.activeSuite,
      maxItems: this.state.maxItems,
      displayErrors: this.state.displayErrors,
      displaySuccess: this.state.displaySuccess,
      displayWarnings: this.state.displayWarnings,
      displayRecommendation: !this.state.displayRecommendation,
      displayFailure: this.state.displayFailure,
      displayInfo: this.state.displayInfo,
      isLoading: false,
    });
  }

  private _setInfoMode() {
    this.setState({
      infoSet: this.state.infoSet,
      viewMode: ProjectInfoDisplayMode.info,
      activeSuite: this.state.activeSuite,
      displayErrors: this.state.displayErrors,
      displaySuccess: this.state.displaySuccess,
      maxItems: this.state.maxItems,
      displayWarnings: this.state.displayWarnings,
      displayRecommendation: this.state.displayRecommendation,
      displayFailure: this.state.displayFailure,
      displayInfo: this.state.displayInfo,
      isLoading: this.state.isLoading,
    });
  }

  _handleSuiteChange(
    event: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element> | null,
    data: DropdownProps
  ) {
    let targetedSuite = ProjectInfoSuite.allExceptAddOn;

    if (data.value === SuiteTitles[1]) {
      targetedSuite = ProjectInfoSuite.currentPlatform;
    } else if (data.value === SuiteTitles[2]) {
      targetedSuite = ProjectInfoSuite.addOn;
    }

    this.setState({
      infoSet: this.state.infoSet,
      viewMode: this.state.viewMode,
      activeSuite: targetedSuite,
      displayErrors: this.state.displayErrors,
      displaySuccess: this.state.displaySuccess,
      maxItems: this.state.maxItems,
      displayWarnings: this.state.displayWarnings,
      displayRecommendation: this.state.displayRecommendation,
      displayFailure: this.state.displayFailure,
      displayInfo: this.state.displayInfo,
      isLoading: true,
    });

    window.setTimeout(this._generateInfoSet, 1);
  }

  _handleListScroll(event: UIEvent<HTMLDivElement>) {
    if (event.currentTarget && this.state && this.state.infoSet && this.state.infoSet.items) {
      if (
        event.currentTarget.scrollTop >
          event.currentTarget.scrollHeight -
            (event.currentTarget.offsetHeight + event.currentTarget.scrollHeight / 20) &&
        this.state.maxItems < this.state.infoSet.items.length &&
        this.state.maxItems < 25000
      ) {
        this.setState({
          infoSet: this.state.infoSet,
          viewMode: this.state.viewMode,
          activeSuite: this.state.activeSuite,
          displayErrors: this.state.displayErrors,
          displaySuccess: this.state.displaySuccess,
          maxItems: this.state.maxItems + 5000,
          displayWarnings: this.state.displayWarnings,
          displayRecommendation: this.state.displayRecommendation,
          displayFailure: this.state.displayFailure,
          displayInfo: this.state.displayInfo,
          isLoading: this.state.isLoading,
        });
      }
    }
  }

  private _setSummaryMode() {
    this.setState({
      infoSet: this.state.infoSet,
      viewMode: ProjectInfoDisplayMode.summary,
      activeSuite: this.state.activeSuite,
      displayErrors: this.state.displayErrors,
      displaySuccess: this.state.displaySuccess,
      displayWarnings: this.state.displayWarnings,
      displayRecommendation: this.state.displayRecommendation,
      displayFailure: this.state.displayFailure,
      displayInfo: this.state.displayInfo,
      isLoading: this.state.isLoading,
    });
  }

  private async _downloadReport() {
    if (this.props.project === null || this.state.infoSet === undefined) {
      return;
    }

    const date = new Date();
    const projName = this.props.project.name;

    const reportHtml = this.state.infoSet.getReportHtml(projName, projName, date.getTime().toString());

    saveAs(new Blob([reportHtml]), projName + " " + SuiteTitles[this.state.activeSuite] + ".html");
  }

  private async _handleInfoItemCommand(command: InfoItemCommand, item: ProjectInfoItem) {
    await this.props.onInfoItemCommand(command, item);

    //    await this._generateInfoSetInternal(true);
  }

  render() {
    let contentAreaHeightSmall = "calc(100vh - " + (this.props.heightOffset + 126) + "px)";
    let contentAreaHeightLarge = "calc(100vh - " + (this.props.heightOffset + 95) + "px)";
    const width = WebUtilities.getWidth();

    const lines = [];
    const topToolbarItems = [
      {
        icon: (
          <InfoTabLabel
            theme={this.props.theme}
            isSelected={this.state.viewMode === ProjectInfoDisplayMode.info}
            isCompact={false}
          />
        ),
        key: "errorFilter",
        kind: "toggle",
        onClick: this._setInfoMode,
        title: "Toggle whether an info view is shown",
      },
      {
        icon: (
          <SummaryTabLabel
            theme={this.props.theme}
            isSelected={this.state.viewMode === ProjectInfoDisplayMode.summary}
            isCompact={false}
          />
        ),
        key: "infoFilter",
        kind: "toggle",
        onClick: this._setSummaryMode,
        title: "Toggle whether a summary view is shown",
      },
    ];

    const actionToolbarItems = [
      {
        icon: <DownloadLabel isCompact={false} />,
        key: "downloadReport",
        onClick: this._downloadReport,
        title: "Downloads a report",
      },
    ];

    const countsByType: number[] = [];

    if (this.state && this.state.infoSet) {
      for (const item of this.state.infoSet.items) {
        if (!countsByType[item.itemType]) {
          countsByType[item.itemType] = 1;
        } else {
          countsByType[item.itemType]++;
        }
      }
    }

    const toolbarItems = [
      {
        icon: (
          <ErrorFilterLabel
            theme={this.props.theme}
            isSelected={this.state.displayErrors}
            value={countsByType[InfoItemType.error]}
            isCompact={width < 1016}
          />
        ),
        key: "errorFilter",
        kind: "toggle",
        onClick: this._toggleErrorFilter,
        title: "Toggle whether error items show",
      },
      {
        icon: (
          <WarningFilterLabel
            theme={this.props.theme}
            isSelected={this.state.displayWarnings}
            value={countsByType[InfoItemType.warning]}
            isCompact={width < 1016}
          />
        ),
        key: "warningFilter",
        kind: "toggle",
        onClick: this._toggleWarningFilter,
        title: "Toggle whether warning items show",
      },
      {
        icon: (
          <RecommendationsFilterLabel
            theme={this.props.theme}
            value={countsByType[InfoItemType.recommendation]}
            isSelected={this.state.displayRecommendation}
            isCompact={width < 1016}
          />
        ),
        key: "recoFilter",
        kind: "toggle",
        onClick: this._toggleRecommendationFilter,
        title: "Toggle whether error items show",
      },
      {
        icon: <InfoFilterLabel theme={this.props.theme} isSelected={this.state.displayInfo} isCompact={width < 1016} />,
        key: "infoFilter",
        kind: "toggle",
        onClick: this._toggleInfoFilter,
        title: "Toggle whether information items show",
      },
      {
        icon: (
          <SuccessFilterLabel
            theme={this.props.theme}
            isSelected={this.state.displaySuccess}
            value={countsByType[InfoItemType.testCompleteSuccess]}
            isCompact={width < 1016}
          />
        ),
        key: "successFilter",
        kind: "toggle",
        onClick: this._toggleSuccessFilter,
        title: "Toggle whether success items show",
      },
      {
        icon: (
          <FailureFilterLabel
            theme={this.props.theme}
            isSelected={this.state.displayFailure}
            value={countsByType[InfoItemType.testCompleteFail]}
            isCompact={width < 1016}
          />
        ),
        key: "failureFilter",
        kind: "toggle",
        onClick: this._toggleFailureFilter,
        title: "Toggle whether success items show",
      },
    ];

    const itemTiles = [];
    if (this.state && this.state.infoSet) {
      for (let i = 0; i < this.state.infoSet.items.length && i < this.state.maxItems; i++) {
        const item = this.state.infoSet.items[i];

        if (
          (this.state.displayWarnings && item.itemType === InfoItemType.warning) ||
          (this.state.displayRecommendation && item.itemType === InfoItemType.recommendation) ||
          (this.state.displayErrors && item.itemType === InfoItemType.error) ||
          (this.state.displaySuccess && item.itemType === InfoItemType.testCompleteSuccess) ||
          (this.state.displayFailure && item.itemType === InfoItemType.testCompleteFail) ||
          (this.state.displayInfo && item.itemType === InfoItemType.info)
        ) {
          itemTiles.push(
            <ProjectInfoItemDisplay
              item={item}
              theme={this.props.theme}
              key={"pid" + i}
              carto={this.props.carto}
              onInfoItemCommand={this._handleInfoItemCommand}
            />
          );
        }
      }

      const keyVals = this.state.infoSet.info as { [index: string]: any };

      for (const key in keyVals) {
        if (key !== "features") {
          const val = keyVals[key];

          lines.push(
            <div className="pis-itemHeader" key={key + "headerA"}>
              {Utilities.humanifyJsName(key)}
            </div>
          );
          lines.push(
            <div className="pis-itemData" key={key + "dataA"}>
              {this.getDataSummary(val)}
            </div>
          );
        }
      }

      if (this.state.infoSet.info.features) {
        for (const featName in this.state.infoSet.info.features) {
          const featVal = this.state.infoSet.info.features[featName];

          if (typeof featVal === "number") {
            const featSummaryName = featName; //.replace(/|/gi, " ");

            lines.push(
              <div className="pis-itemHeader" key={featName + "headerB"}>
                {featSummaryName}
              </div>
            );
            lines.push(
              <div className="pis-itemData" key={featName + "dataB"}>
                {featVal}
              </div>
            );
          }
        }
      }
    }

    const title = this.props.project.loc.getTokenValueOrDefault(this.props.project.title);

    let outer = <></>;

    if (this.state.isLoading) {
      outer = (
        <div
          className="pid-areaOuter"
          style={{
            backgroundColor: this.props.theme.siteVariables?.colorScheme.brand.background3,
            color: this.props.theme.siteVariables?.colorScheme.brand.foreground3,
          }}
        >
          <div
            className="pid-validating"
            style={{
              color: this.props.theme.siteVariables?.colorScheme.brand.foreground3,
            }}
          >
            Validating... {this.state.loadStatus ? "(" + this.state.loadStatus + ")" : ""}
          </div>
        </div>
      );
    } else if (this.state.viewMode === ProjectInfoDisplayMode.summary) {
      outer = (
        <div className="pid-areaOuter">
          <div
            className="pid-summaryArea"
            style={{
              maxHeight: contentAreaHeightLarge,
            }}
          >
            <div className="pid-header">Summary</div>
            <div className="pid-summary">
              <div className="pis-summaryArea">{lines}</div>
            </div>
          </div>
        </div>
      );
    } else {
      outer = (
        <div className="pid-areaOuter">
          <div>
            <Toolbar aria-label="Actions toolbar overflow menu" items={toolbarItems} />
          </div>
          <div
            className="pid-tableWrapper"
            style={{
              maxHeight: contentAreaHeightSmall,
            }}
            onScroll={this._handleListScroll}
          >
            <div
              className="pid-area"
              style={{
                backgroundColor: this.props.theme.siteVariables?.colorScheme.brand.background4,
                color: this.props.theme.siteVariables?.colorScheme.brand.foreground4,
              }}
            >
              <div
                className="pid-headerRow"
                style={{
                  backgroundColor: this.props.theme.siteVariables?.colorScheme.brand.background3,
                  color: this.props.theme.siteVariables?.colorScheme.brand.foreground3,
                }}
              >
                <div className="pid-headerCell pid-headerTypeCell">Type</div>
                <div className="pid-headerCell">Area</div>
                <div className="pid-headerCell">Test</div>
                <div className="pid-headerCell">Actions</div>
                <div className="pid-headerCell">Message</div>
                <div className="pid-headerCell">File</div>
              </div>
              {itemTiles}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          backgroundColor: this.props.theme.siteVariables?.colorScheme.brand.background1,
          color: this.props.theme.siteVariables?.colorScheme.brand.foreground1,
        }}
      >
        <div className="pid-outer">
          <div
            className="pid-title"
            style={{
              backgroundColor: this.props.theme.siteVariables?.colorScheme.brand.background1,
              color: this.props.theme.siteVariables?.colorScheme.brand.foreground1,
            }}
          >
            Project Inspector for {title}
          </div>
          <div className="pid-toolArea">
            <div className="pid-topToolbar">
              <Toolbar aria-label="Actions  toolbar overflow menu" items={topToolbarItems} />
            </div>
            <div className="pid-suiteTitle">Suite:</div>
            <div className="pid-suiteDropdown">
              <Dropdown
                items={SuiteTitles}
                defaultValue={SuiteTitles[this.state.activeSuite]}
                key="testSuiteDropdown"
                onChange={this._handleSuiteChange}
              />
            </div>
            <div className="pid-actionToolbar">
              <Toolbar aria-label="Actions toolbar overflow menu" items={actionToolbarItems} />
            </div>
          </div>
          {outer}
        </div>
      </div>
    );
  }
}
